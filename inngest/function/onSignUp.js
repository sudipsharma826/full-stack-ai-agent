import { NonRetriableError } from "inngest";
import user from "../../models/user.js";
import { inngest } from "../client.js"; // `
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
    try {
      const { email } = event.data; 

      // Step 1: Find the user ( step 1)
      const userObject = await step.run("get-user-email", async () => {
        const foundUser = await user.findOne({ email });
        if (!foundUser) {
          throw new NonRetriableError("User not found");
        }
        return foundUser;
      });

      // Step 2: Send welcome email ( step 2) ( in step 2 = step 1 data is accessible )
      await step.run("send-welcome-email", async () => {
        const subject = "Welcome to AI Ticket Assistant";
        const text = `Hello ,\n\nWelcome to AI Ticket Assistant! We're excited to have you on board.\n\nBest regards,\nAI Ticket Assistant Team`;
        const html = `<p>Hello ,</p><p>Welcome to AI Ticket Assistant! We're excited to have you on board.</p><p>Best regards,<br />AI Ticket Assistant Team</p>`;
        await sendMail(userObject.email, subject, text, html);
      });

      return {
        success: true,
        message: "User signed up and welcome email sent successfully",
      };

    } catch (error) {
      console.error("Error in userSignUp function:", error);
      throw error;
    }
  }
);
