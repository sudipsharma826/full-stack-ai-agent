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
        const subject = "🎉 Welcome to AI Ticket Platform - Your Account is Ready!";
        const text = `Hello ${userObject.name || ""},\n\nWelcome to AI Ticket Platform! Your intelligent support ticket management system account is now active. Login to experience seamless ticket management with AI-powered analysis.\n\nBest regards,\nAI Ticket Platform Team`;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AI Ticket Platform</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container { 
            max-width: 600px; 
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
            font-size: 28px; 
            font-weight: 600; 
        }
        .header p { 
            margin: 10px 0 0 0; 
            opacity: 0.9; 
            font-size: 16px; 
        }
        .content { 
            padding: 40px 30px; 
            line-height: 1.6; 
        }
        .welcome-text { 
            font-size: 18px; 
            color: #333; 
            margin-bottom: 25px; 
        }
        .feature-list { 
            background: #f8f9ff; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 25px 0; 
        }
        .feature-item { 
            display: flex; 
            align-items: center; 
            margin: 15px 0; 
        }
        .feature-icon { 
            width: 24px; 
            height: 24px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            border-radius: 50%; 
            margin-right: 15px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 12px;
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
        .social-links { 
            margin: 20px 0; 
        }
        .social-links a { 
            margin: 0 10px; 
            color: #667eea; 
            text-decoration: none; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to AI Ticket Platform!</h1>
            <p>Your intelligent support ticket management system</p>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <strong>Dear ${userObject.name || "Valued User"},</strong>
            </div>
            
            <p>Welcome to our cutting-edge AI-powered ticket platform! We're thrilled to have you join our community of users who experience seamless support ticket management.</p>
            
            <div class="feature-list">
                <h3 style="margin-top: 0; color: #333;">🚀 What you can do now:</h3>
                
                <div class="feature-item">
                    <div class="feature-icon">🎫</div>
                    <div>
                        <strong>Create Smart Tickets:</strong> Submit support requests that are automatically analyzed by AI
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <div>
                        <strong>AI-Powered Analysis:</strong> Get instant priority assessment and skill-based assignment
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div>
                        <strong>Track Progress:</strong> Monitor your tickets in real-time with our intuitive dashboard
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <div>
                        <strong>Fast Resolution:</strong> Experience quicker response times with intelligent routing
                    </div>
                </div>
            </div>
            
            <p>Ready to get started? Login to your account and create your first ticket!</p>
            
            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'https://aiticket.sudipsharma.com.np'}/login" class="cta-button">
                    Login to Your Account
                </a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you have any questions or need assistance, feel free to reach out to our support team. We're here to help you make the most of your experience!
            </p>
        </div>
        
        <div class="footer">
            <p><strong>AI Ticket Platform Team</strong></p>
            <p>Intelligent Support • Faster Resolution • Better Experience</p>
            
            <div class="social-links">
                <a href="mailto:support@sudipsharma.com.np">📧 Support</a>
                <a href="${process.env.FRONTEND_URL || 'https://aiticket.sudipsharma.com.np'}">🌐 Platform</a>
            </div>
            
            <p style="font-size: 12px; margin-top: 20px;">
                This email was sent because you recently created an account on AI Ticket Platform.<br>
                If you didn't create this account, please contact our support team immediately.
            </p>
        </div>
    </div>
</body>
</html>
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
