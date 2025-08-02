import { NonRetriableError } from "inngest";
import ticket from "../../models/ticket.js";
import  inngest  from "../client.js";
import { sendMail } from "../../lib/sendMail.js";
import { analyzeTicket } from "../../lib/agentKit.js";
import user from "../../models/user.js";

export const onTicketCreate = inngest.createFunction(
  {
    id: "onTicketCreate",
    retries: 2,
  },
  {
    event: "ticket/create",
  },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // Step 1: Fetch the ticket details from the database
      const ticketObject = await step.run("get-ticket-details", async () => {
        const foundTicket = await ticket.findById(ticketId);
        if (!foundTicket) {
          throw new NonRetriableError("Ticket not found");
        }
        return foundTicket;
      });

      // Step 2: Update ticket status to "in-progress"
      await step.run("update-ticket-status", async () => {
        await ticket.findByIdAndUpdate(ticketObject._id, {
          status: "in-progress",
        });
      });

      // Step 3: Analyze the ticket using AI
      const aiResponse = await analyzeTicket(ticketObject);
      if (!aiResponse) {
        throw new NonRetriableError("AI response is null or invalid");
      }

      // Step 4: Update ticket with AI response
      const relatedSkills = await step.run("update-ticket-with-ai-response", async () => {
        await ticket.findByIdAndUpdate(ticketObject._id, {
          summary: aiResponse.summary,
          priority: ["low", "medium", "high"].includes(aiResponse.priority)
            ? aiResponse.priority
            : "medium",
          helpfulNotes: aiResponse.helpfulNotes,
          relatedSkills: aiResponse.relatedSkills,
          deadline: (aiResponse.deadline < ticketObject.createdAt.toISOString())
            ? aiResponse.deadline
            : null,
        });
        return aiResponse.relatedSkills;
      });

      // Step 5: Assign the ticket to a moderator or fallback to admin
      const assignedUser = await step.run("assign-ticket-to-moderator", async () => {
        let moderator = await user.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"),
              $options: "i", // case-insensitive
            },
          },
        });

        if (!moderator) {
          moderator = await user.findOne({ role: "admin" });
        }

        await ticket.findByIdAndUpdate(ticketObject._id, {
          assignedTo: moderator?._id,
        });

        return moderator;
      });

      // Step 6: Send an email to the assigned user
      await step.run("send-email-to-moderator/admin", async () => {
        if (!assignedUser?.email) {
          console.warn("No user email to send to.");
          return;
        }

        await sendMail({
          to: assignedUser.email,
          subject: "New Ticket Assigned",
          text: `You have been assigned a new ticket.`,
          html: `
            <p>You have been assigned a new ticket with the following details:</p>
            <p><strong>Title:</strong> ${ticketObject.title}</p>
            <p><strong>Description:</strong> ${ticketObject.description}</p>
            <p><strong>Summary:</strong> ${aiResponse.summary}</p>
            <p><strong>Priority:</strong> ${aiResponse.priority}</p>
            <p><strong>Helpful Notes:</strong> ${aiResponse.helpfulNotes}</p>
            <p><strong>Related Skills:</strong> ${aiResponse.relatedSkills.join(", ")}</p>
          `,
        });
      });

    } catch (e) {
      console.error("Error in onTicketCreate function:", e.message);
      return { success: false, error: e.message };
    }
  }
);
