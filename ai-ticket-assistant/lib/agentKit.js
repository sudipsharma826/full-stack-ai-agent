import { createAgent, gemini } from "@inngest/agent-kit";

// We want the AI to analyze the ticket and suggest a response
export const analyzeTicket = async (ticket) => {
  const agent = createAgent({
    model: gemini({
      // Setting up the Gemini model
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    }),
    name: "AI Ticket Analyzer", // Name of the agent
    description: "Analyzes support tickets and suggests responses",
    system: `
      You are an AI assistant that analyzes support tickets and suggests responses.
      You will be provided with a support ticket and you need to analyze it and suggest a response.
      Your job is to:
      1. Summarize the issue.
      2. Estimate its priority.
      3. Provide helpful notes and resource links for humans.
      4. List related skills that might be helpful in resolving the issue.
      5. Provide a deadline if the ticket is according to the priority.
      
      Important:
      - Do not provide any code or technical details in your response.
      - Respond only with JSON format.
      - No markdown or any other formatting.
      - The format must be a raw JSON object.
    `,
  });

  const response = await agent.run(`
    You are a ticket triage agent.
    Only return a strict JSON object with no extra text, header, or markdown.
    Analyze the following ticket and provide the required information:
    - Summarize the issue.
    - Estimate its priority.
    - Provide helpful notes and resource links for humans.
    - List related skills that might be helpful in resolving the issue (e.g. ["React Js", "Node Js", "Express Js"]).
    - Provide a deadline if ticket according to the priority.
    Respond only with the JSON object with no extra text, header, or markdown.
    Example response:
    {
      "summary": "The user is unable to login to the application",
      "priority": "high",
      "helpfulNotes": "Check the user's account status and reset the password if necessary. For more information, refer to the user guide at https://example.com/user-guide",
      "relatedSkills": ["Authentication", "User Management"],
      "deadline": "2023-12-31"
    }
    Information you will be provided:
    Ticket ID: ${ticket.ticketId}
    Title: ${ticket.title}
    Description: ${ticket.description}
  `);

  // handling the response to extract the JSON object
  const raw = response.output[0].context;
  try {
    const match = raw.match(/```json\s*([\s\S]*?)\s*```/i);
    const jsonString = match ? match[1].trim() : raw.trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.log("Failed to parse JSON response: " + error.message);
    return null;
  }
};
