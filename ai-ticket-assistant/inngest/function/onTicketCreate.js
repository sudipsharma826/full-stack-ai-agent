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

      // Step 3: Analyze with AI
      let aiResponse = null;
      try {
        console.log("🤖 Step 3: Starting AI analysis...");
        aiResponse = await analyzeTicket(ticketObject);
        console.log("✅ AI analysis completed:", aiResponse);
      } catch (err) {
        console.warn("⚠️ AI analysis failed:", err.message);
      }

      // Fallback if AI fails
      if (!aiResponse) {
        console.log("🔄 Using fallback response due to AI failure");
        aiResponse = {
          summary: "Manual review required",
          priority: "medium",
          helpfulNotes: "AI analysis unavailable",
          relatedSkills: ["General Support"],
          deadline: null,
        };
      }

      // Step 4: Clean & update ticket with AI result
      const relatedSkills = await step.run("update-with-ai", async () => {
        console.log("📝 Step 4: Updating ticket with AI results...");
        const cleanSkills = Array.isArray(aiResponse.relatedSkills)
          ? aiResponse.relatedSkills.filter(skill => typeof skill === "string" && skill.trim())
          : ["General Support"];

        const cleanDeadline = aiResponse.deadline && aiResponse.deadline !== "null"
          ? String(aiResponse.deadline).trim()
          : null;

        const updateData = {
          summary: aiResponse.summary || "AI analysis completed",
          priority: ["low", "medium", "high"].includes((aiResponse.priority || "").toLowerCase())
            ? aiResponse.priority.toLowerCase()
            : "medium",
          helpfulNotes: aiResponse.helpfulNotes || "No additional notes",
          relatedSkills: cleanSkills,
          deadline: cleanDeadline,
          status: "open",
        };

        console.log("📝 Update data:", updateData);

        const updated = await ticket.findByIdAndUpdate(ticketId, updateData, {
          new: true,
          runValidators: true,
        });

        if (!updated) {
          console.error("❌ Failed to update ticket");
          throw new Error("Failed to update ticket");
        }

        console.log("✅ Ticket updated successfully");
        return cleanSkills;
      });

      // Step 5: Assign ticket to a moderator/admin
      const assignedUser = await step.run("assign-to-user", async () => {
        console.log("📝 Step 5: Assigning ticket to user...");
        
        try {
          const matchBySkill = await user.findOne({
            role: "moderator",
            skills: { $elemMatch: { $regex: relatedSkills.join("|"), $options: "i" } },
          });

          const fallbackUser = await user.findOne({ role: "moderator" }) || await user.findOne({ role: "admin" });

          const assigned = matchBySkill || fallbackUser;

          if (assigned) {
            await ticket.findByIdAndUpdate(ticketId, { assignedTo: assigned._id });
            console.log("✅ Ticket assigned to:", assigned.email);
          } else {
            console.log("⚠️ No moderator or admin found to assign ticket");
          }

          return assigned;
        } catch (error) {
          console.error("❌ Error in user assignment:", error.message);
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
          await sendMail(
            assignedUser.email,
            "New Ticket Assigned",
            "You have been assigned a new ticket.",
            `
              <p><strong>Title:</strong> ${ticketObject.title}</p>
              <p><strong>Description:</strong> ${ticketObject.description}</p>
              <p><strong>Summary:</strong> ${aiResponse.summary}</p>
              <p><strong>Priority:</strong> ${aiResponse.priority}</p>
              <p><strong>Helpful Notes:</strong> ${aiResponse.helpfulNotes}</p>
              <p><strong>Related Skills:</strong> ${aiResponse.relatedSkills.join(", ")}</p>
            `
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
