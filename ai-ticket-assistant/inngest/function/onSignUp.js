import { NonRetriableError } from "inngest";
import user from "../../models/user.js";
import inngest from "../client.js";
import { sendMail } from "../../lib/sendMail.js";

export const userSignUp = inngest.createFunction(
  {
    id: "onUserSignUp", // Unique ID for the function
    retries: 2,
  },
  {
    event: "user/signUp", // Event that triggers this function
  },
  async ({ event, step }) => {
    console.log("📨 user/signUp event received:", event.data);

    try {
      const { email } = event.data;

      if (!email) {
        console.error("❌ Email not provided in event data");
        throw new NonRetriableError("Email is required");
      }

      // Step 1: Find the user
      const userObject = await step.run("get-user-email", async () => {
        const foundUser = await user.findOne({ email });
        if (!foundUser) {
          console.error("❌ User not found for email:", email);
          throw new NonRetriableError("User not found");
        }
        console.log("✅ User found:", foundUser.email);
        return foundUser;
      });

      // Step 2: Send welcome email
      await step.run("send-welcome-email", async () => {
        const subject = "Welcome to AI Ticket Assistant";
        const text = `Hello ${userObject.name || ""},\n\nWelcome to AI Ticket Assistant! We're excited to have you on board.\n\nBest regards,\nAI Ticket Assistant Team`;
        const html = `
          <p>Hello ${userObject.name || ""},</p>
          <p>Welcome to <strong>AI Ticket Assistant</strong>! We're excited to have you on board.</p>
          <p>Best regards,<br/>AI Ticket Assistant Team</p>
        `;

        console.log("📧 Sending welcome email to:", userObject.email);
        await sendMail(userObject.email, subject, text, html);
        console.log("✅ Welcome email sent successfully");
      });

      return {
        success: true,
        message: "User signed up and welcome email sent successfully",
      };

    } catch (error) {
      console.error("❌ Error in userSignUp function:", error);
      return { success: false, error: error.message };
    }
  }
);
