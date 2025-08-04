import { createAgent, gemini } from "@inngest/agent-kit";

export const analyzeTicket = async (ticket) => {
  console.log("Starting AI analysis for ticket:", ticket._id);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  try {
    const agent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Analyzer",
      description: "Analyzes support tickets and suggests responses",
      system: `
        You are an AI assistant that analyzes support tickets and suggests responses.
        Your job is to:
        1. Summarize the issue.
        2. Estimate priority (low, medium, high).
        3. Provide helpful suggestions.
        4. List related skills.
        5. Provide a reasonable deadline (format: YYYY-MM-DD) that is in the future.

        Important: Always set deadlines to be in the future, starting from today (${new Date().toISOString().split('T')[0]}).
        For low priority: add 7-14 days
        For medium priority: add 3-7 days  
        For high priority: add 1-3 days

        Respond ONLY with a pure JSON object.
        Do NOT include markdown, code blocks, or extra text.
      `,
    });

    const prompt = `
Analyze this support ticket and respond with ONLY a JSON object:

Ticket Details:
- ID: ${ticket._id}
- Title: ${ticket.title}
- Description: ${ticket.description}

Required JSON format:
{
  "summary": "Brief summary of the issue",
  "priority": "low|medium|high",
  "helpfulNotes": "Helpful suggestions for resolution",
  "relatedSkills": ["skill1", "skill2"],
  "deadline": "YYYY-MM-DD"
}
`;

    const response = await agent.run(prompt);
    console.log("Full AI response:", JSON.stringify(response, null, 2));

    // Extract raw content from response
    let raw = "";
    const output = response.output?.[0];
    if (typeof output === "string") {
      raw = output;
    } else if (output?.content) {
      raw = output.content;
    } else if (output?.context) {
      raw = output.context;
    } else {
      raw = JSON.stringify(output || response.output || response);
    }

    console.log("Extracted raw response:", raw);

    // Extract JSON string
    const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonString = codeBlockMatch?.[1]?.trim() || jsonMatch?.[0]?.trim() || raw.trim();

    const parsed = JSON.parse(jsonString);
    console.log("✅ Parsed JSON:", parsed);

    // Return cleaned and validated result
    return {
      summary: parsed.summary || "AI analysis completed",
      priority: ["low", "medium", "high"].includes(parsed.priority?.toLowerCase())
        ? parsed.priority.toLowerCase()
        : "medium",
      helpfulNotes: parsed.helpfulNotes || "No additional notes provided",
      relatedSkills: parsed.relatedSkills || ["General Support"],
      deadline: parsed.deadline || null,
    };
  } catch (error) {
    console.error("❌ AI analysis failed:", error.message);
    throw error;
  }
};
