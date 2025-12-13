import { NonRetriableError } from "inngest";
import ticket from "../../models/ticket.js";
import inngest from "../client.js";
import { sendMail } from "../../lib/sendMail.js";
import { analyzeTicket } from "../../lib/agentKit.js";
import user from "../../models/user.js";

export const onTicketCreate = inngest.createFunction(
  { id: "onTicketCreate", retries: 2 },
  { event: "ticket/create" },
  async ({ event, step }) => {
    const { ticketId } = event.data;
    console.log("🔔 Inngest: Ticket creation triggered for ID:", ticketId);
    console.log("🔔 Full event data:", JSON.stringify(event, null, 2));

    try {
      // Step 1: Get ticket
      const ticketObject = await step.run("get-ticket", async () => {
        console.log("📝 Step 1: Getting ticket...");
        const found = await ticket.findById(ticketId);
        if (!found) {
          console.error("❌ Ticket not found:", ticketId);
          throw new NonRetriableError("Ticket not found");
        }
        console.log("✅ Found ticket:", found.title);
        return found;
      });

      // Step 2: Mark status as in-progress
      await step.run("set-status-in-progress", async () => {
        console.log("📝 Step 2: Setting status to in-progress...");
        await ticket.findByIdAndUpdate(ticketId, { status: "in-progress" });
        console.log("✅ Status updated to in-progress");
      });

      // Step 3: Analyze with AI (outside of step.run to avoid nesting)
      console.log("🤖 Step 3: Starting AI analysis...");
      let aiResponse = null;
      
      try {
        aiResponse = await analyzeTicket(ticketObject);
        console.log("✅ AI analysis completed:", aiResponse);
      } catch (err) {
        console.warn("⚠️ AI analysis failed:", err.message);
      }
      
      // Step 4: Clean & update ticket with AI result
      const relatedSkills = await step.run("update-with-ai", async () => {
        console.log("📝 Step 4: Updating ticket with AI results...");
        
        // Ensure aiResponse exists and has valid data
        if (!aiResponse) {
          console.warn("⚠️ No AI response available, creating default response");
          aiResponse = {
            summary: `Manual review required for: ${ticketObject.title}`,
            priority: "medium",
            helpfulNotes: "AI analysis unavailable - manual review required",
            relatedSkills: ["General Support"],
            deadline: null,
          };
        }

        const cleanSkills = Array.isArray(aiResponse.relatedSkills)
          ? aiResponse.relatedSkills.filter(skill => typeof skill === "string" && skill.trim())
          : ["General Support"];

        const cleanDeadline = aiResponse.deadline && aiResponse.deadline !== "null"
          ? String(aiResponse.deadline).trim()
          : null;

        const updateData = {
          summary: aiResponse.summary || `Manual review for: ${ticketObject.title}`,
          priority: ["low", "medium", "high"].includes((aiResponse.priority || "").toLowerCase())
            ? aiResponse.priority.toLowerCase()
            : "medium",
          helpfulNotes: aiResponse.helpfulNotes || "Manual review required",
          relatedSkills: cleanSkills,
          deadline: cleanDeadline,
          status: "open",
        };

        console.log("📝 Update data:", updateData);

        try {
          const updated = await ticket.findByIdAndUpdate(ticketId, updateData, {
            new: true,
            runValidators: true,
          });

          if (!updated) {
            console.error("❌ Failed to update ticket - ticket not found");
            throw new Error("Ticket not found for update");
          }

          console.log("✅ Ticket updated successfully with ID:", updated._id);
          return cleanSkills;
        } catch (updateError) {
          console.error("❌ Database update error:", updateError.message);
          
          // Try a simpler update without validation
          try {
            console.log("🔄 Attempting simplified update...");
            const simpleUpdate = await ticket.findByIdAndUpdate(
              ticketId, 
              { 
                status: "open",
                summary: updateData.summary,
                priority: updateData.priority 
              },
              { new: true }
            );
            
            if (simpleUpdate) {
              console.log("✅ Simplified update successful");
              return cleanSkills;
            }
          } catch (simpleError) {
            console.error("❌ Even simplified update failed:", simpleError.message);
          }
          
          // If all updates fail, continue with default skills
          console.log("⚠️ Continuing with default skills due to update failure");
          return ["General Support"];
        }
      });

      // Step 5: Assign ticket to a moderator/admin
      const assignedUser = await step.run("assign-to-user", async () => {
        console.log("📝 Step 5: Assigning ticket to user...");
        
        try {
          const matchBySkill = await user.findOne({
            role: "moderator",
            skills: { $elemMatch: { $regex: relatedSkills.join("|"), $options: "i" } },
          });

          // If no skill match, find any moderator or admin
          const fallbackUser = await user.findOne({ role: "moderator" }) || 
                              await user.findOne({ role: "admin" });

          const assigned = matchBySkill || fallbackUser;

          if (assigned) {
            try {
              await ticket.findByIdAndUpdate(ticketId, { assignedTo: assigned._id });
              console.log("✅ Ticket assigned to:", assigned.email);
              return assigned;
            } catch (assignError) {
              console.error("❌ Failed to update ticket assignment:", assignError.message);
              // Continue anyway, we'll still send the email
              return assigned;
            }
          } else {
            console.log("⚠️ No moderator or admin found to assign ticket");
            return null;
          }

        } catch (error) {
          console.error("❌ Error in user assignment:", error.message);
          console.error("📍 Assignment error stack:", error.stack);
          
          // Try to find any user as last resort
          try {
            const anyAdmin = await user.findOne({ role: "admin" });
            if (anyAdmin) {
              console.log("🔄 Found admin as last resort:", anyAdmin.email);
              return anyAdmin;
            }
          } catch (lastResortError) {
            console.error("❌ Last resort assignment also failed:", lastResortError.message);
          }
          
          return null;
        }
      });

      // Step 6: Send notification
      await step.run("send-email", async () => {
        console.log("📝 Step 6: Sending email notification...");
        
        if (!assignedUser?.email) {
          console.log("⚠️ No assigned user email found, skipping email");
          return;
        }

        try {
          const ticketAssignmentHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Ticket Assignment</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container { 
            max-width: 650px; 
            margin: 40px auto; 
            background: white; 
            border-radius: 16px; 
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 26px; 
            font-weight: 600; 
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 15px; 
        }
        .content { 
            padding: 40px 30px; 
            line-height: 1.6; 
        }
        .ticket-card { 
            background: #f8f9ff; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 25px 0; 
            border-left: 5px solid #667eea;
        }
        .ticket-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .ticket-title { 
            font-size: 20px; 
            font-weight: 600; 
            color: #333; 
            margin: 0;
        }
        .priority-badge { 
            padding: 5px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase;
        }
        .priority-high { background: #ffebee; color: #c62828; }
        .priority-medium { background: #fff3e0; color: #ef6c00; }
        .priority-low { background: #e8f5e8; color: #2e7d32; }
        .info-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0;
        }
        .info-item { 
            background: white; 
            padding: 15px; 
            border-radius: 8px; 
            border: 1px solid #e0e0e0;
        }
        .info-label { 
            font-size: 12px; 
            color: #666; 
            text-transform: uppercase; 
            font-weight: 600; 
            margin-bottom: 5px;
        }
        .info-value { 
            color: #333; 
            font-weight: 500;
        }
        .description-box { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            border: 1px solid #e0e0e0; 
            margin: 20px 0;
        }
        .ai-analysis { 
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); 
            border-radius: 12px; 
            padding: 20px; 
            margin: 25px 0;
        }
        .ai-title { 
            display: flex; 
            align-items: center; 
            font-weight: 600; 
            color: #333; 
            margin-bottom: 15px;
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 20px 0;
        }
        .footer { 
            background: #f8f9ff; 
            padding: 30px; 
            text-align: center; 
            color: #666; 
            border-top: 1px solid #eee; 
        }
        .skills-tags { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            margin-top: 10px;
        }
        .skill-tag { 
            background: #667eea; 
            color: white; 
            padding: 4px 10px; 
            border-radius: 15px; 
            font-size: 12px; 
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎫 New Ticket Assignment</h1>
            <p>A new support ticket has been assigned to you</p>
        </div>
        
        <div class="content">
            <p><strong>Hello ${assignedUser.name || assignedUser.email},</strong></p>
            
            <p>You have been assigned a new support ticket. Here are the details:</p>
            
            <div class="ticket-card">
                <div class="ticket-header">
                    <h2 class="ticket-title">${ticketObject.title}</h2>
                    <span class="priority-badge priority-${aiResponse.priority}">
                        ${aiResponse.priority} Priority
                    </span>
                </div>
                
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Ticket ID</div>
                        <div class="info-value">#${ticketObject._id.toString().slice(-8).toUpperCase()}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Created By</div>
                        <div class="info-value">${ticketObject.createdBy || 'System'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-value">Open</div>
                    </div>
                    ${aiResponse.deadline ? `
                    <div class="info-item">
                        <div class="info-label">Deadline</div>
                        <div class="info-value">${new Date(aiResponse.deadline).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="description-box">
                    <div class="info-label">Description</div>
                    <div class="info-value">${ticketObject.description}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Related Skills</div>
                    <div class="skills-tags">
                        ${aiResponse.relatedSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            </div>
            
            <div class="ai-analysis">
                <div class="ai-title">
                    <span style="margin-right: 10px;">🤖</span>
                    AI Analysis & Recommendations
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div class="info-label">Summary</div>
                    <div class="info-value">${aiResponse.summary}</div>
                </div>
                
                <div>
                    <div class="info-label">Helpful Notes</div>
                    <div class="info-value">${aiResponse.helpfulNotes}</div>
                </div>
            </div>
            
            <p>Please review the ticket and begin working on it as soon as possible. The priority level has been automatically determined based on the content analysis.</p>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://aiticket.sudipsharma.com.np'}" class="cta-button">
                    View Ticket Dashboard
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                This ticket was automatically analyzed and assigned based on your skills and availability. 
                If you need to reassign or have questions, please contact the admin team.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>AI Ticket Platform</strong></p>
            <p>Intelligent Assignment • Faster Resolution • Better Support</p>
            
            <p style="font-size: 12px; margin-top: 20px;">
                This email was sent because a new ticket was assigned to you on AI Ticket Platform.<br>
                For support, contact us at support@sudipsharma.com.np
            </p>
        </div>
    </div>
</body>
</html>
          `;

          await sendMail(
            assignedUser.email,
            `🎫 New Ticket Assigned: ${ticketObject.title}`,
            `You have been assigned a new ${aiResponse.priority} priority ticket: "${ticketObject.title}". Please check your dashboard for details.`,
            ticketAssignmentHTML
          );
          console.log("✅ Email sent successfully to:", assignedUser.email);
        } catch (emailError) {
          console.error("❌ Failed to send email:", emailError.message);
        }
      });

      console.log("✅ Ticket processing completed");
      return { success: true };

    } catch (err) {
      console.error("❌ Ticket creation error:", err.message);
      return { success: false, error: err.message };
    }
  }
);
