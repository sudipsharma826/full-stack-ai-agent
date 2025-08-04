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

    try {
      // Step 1: Get ticket
      const ticketObject = await step.run("get-ticket", async () => {
        const found = await ticket.findById(ticketId);
        if (!found) throw new NonRetriableError("Ticket not found");
        return found;
      });

      // Step 2: Mark status as in-progress
      await step.run("set-status-in-progress", async () => {
        await ticket.findByIdAndUpdate(ticketId, { status: "in-progress" });
      });

      // Step 3: Analyze with AI
      let aiResponse = null;
      try {
        aiResponse = await analyzeTicket(ticketObject);
      } catch (err) {
        console.warn("AI analysis failed:", err.message);
      }

      // Fallback if AI fails
      if (!aiResponse) {
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

        const updated = await ticket.findByIdAndUpdate(ticketId, updateData, {
          new: true,
          runValidators: true,
        });

        if (!updated) throw new Error("Failed to update ticket");

        return cleanSkills;
      });

      // Step 5: Assign ticket to a moderator/admin
      const assignedUser = await step.run("assign-to-user", async () => {
        const matchBySkill = await user.findOne({
          role: "moderator",
          skills: { $elemMatch: { $regex: relatedSkills.join("|"), $options: "i" } },
        });

        const fallbackUser = await user.findOne({ role: "moderator" }) || await user.findOne({ role: "admin" });

        const assigned = matchBySkill || fallbackUser;

        if (assigned) {
          await ticket.findByIdAndUpdate(ticketId, { assignedTo: assigned._id });
        }

        return assigned;
      });

      // Step 6: Send notification
      await step.run("send-email", async () => {
        if (!assignedUser?.email) return;

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
      });

      console.log("✅ Ticket processing completed");
      return { success: true };

    } catch (err) {
      console.error("❌ Ticket creation error:", err.message);
      return { success: false, error: err.message };
    }
  }
);
