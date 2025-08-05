import { createAgent, gemini } from "@inngest/agent-kit";

export const analyzeTicket = async (ticket) => {
  console.log("🤖 Starting AI analysis for ticket:", ticket._id);
  console.log("📋 Ticket details:", { title: ticket.title, description: ticket.description });

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in environment variables");
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  try {
    console.log("🔧 Creating AI agent with Gemini model...");
    
    const agent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Analyzer",
      description: "Analyzes support tickets and suggests responses",
      system: `You are an AI assistant that analyzes support tickets and suggests responses.
        
        Analyze the ticket and respond with ONLY a valid JSON object containing:
        - summary: Brief summary of the issue
        - priority: one of "low", "medium", or "high"  
        - helpfulNotes: Helpful suggestions for resolution
        - relatedSkills: array of relevant skills
        - deadline: date in YYYY-MM-DD format (future date based on priority)
        
        For deadlines, use these guidelines:
        - high priority: add 1-3 days from today (${new Date().toISOString().split('T')[0]})
        - medium priority: add 3-7 days from today
        - low priority: add 7-14 days from today
        
        Respond ONLY with valid JSON. No explanations, no markdown, no code blocks.`,
    });

    const prompt = `Analyze this support ticket and respond with ONLY a JSON object:

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
}`;

    console.log("📤 Sending prompt to AI agent...");
    
    const response = await agent.run(prompt);
    console.log("📥 AI response received:", JSON.stringify(response, null, 2));

    // Extract the response content
    let rawContent = "";
    
    if (response.output && Array.isArray(response.output) && response.output.length > 0) {
      const firstOutput = response.output[0];
      if (typeof firstOutput === "string") {
        rawContent = firstOutput;
      } else if (firstOutput && typeof firstOutput === "object") {
        rawContent = firstOutput.content || firstOutput.text || JSON.stringify(firstOutput);
      }
    } else if (response.content) {
      rawContent = response.content;
    } else if (response.text) {
      rawContent = response.text;
    } else {
      rawContent = JSON.stringify(response);
    }

    console.log("📝 Extracted raw content:", rawContent);

    // Clean up the content to extract JSON
    let jsonString = rawContent.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
    
    // Extract JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    console.log("🧩 JSON string to parse:", jsonString);

    const parsed = JSON.parse(jsonString);
    console.log("✅ Successfully parsed JSON:", parsed);

    // Validate and return cleaned response
    const result = {
      summary: parsed.summary || "AI analysis completed",
      priority: ["low", "medium", "high"].includes(parsed.priority?.toLowerCase()) 
        ? parsed.priority.toLowerCase() 
        : "medium",
      helpfulNotes: parsed.helpfulNotes || "No additional notes provided",
      relatedSkills: Array.isArray(parsed.relatedSkills) 
        ? parsed.relatedSkills.filter(skill => typeof skill === "string" && skill.trim())
        : ["General Support"],
      deadline: parsed.deadline && parsed.deadline !== "null" && parsed.deadline !== null
        ? parsed.deadline
        : null,
    };

    console.log("🎯 Final cleaned response:", result);
    return result;

  } catch (error) {
    console.error("❌ AI analysis failed:", error.message);
    console.error("📍 Error stack:", error.stack);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};
