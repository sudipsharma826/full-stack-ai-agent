import { createAgent, grok, openai ,gemini} from "@inngest/agent-kit";
import 'dotenv/config';


export const analyzeTicket = async (ticket) => {
  console.log("🤖 Starting AI analysis for ticket:", ticket._id);
  console.log("📋 Ticket details:", { title: ticket.title, description: ticket.description });

  // Validate provider API keys (we're using OpenAI here by default)
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY is not set in environment variables");
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  try {
    console.log("🔧 Creating AI agent with Gemini model...");
    
    const agent = createAgent({
      model: openai({
        model: "openai/gpt-4o-mini",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: "https://openrouter.ai/api/v1",
    defaultParameters: { 
      temperature: 0.5 
    },
    headers:{
      "HTTP-Referer":"ai-ticket-assistant",
      "X-Title":"AI Ticket Assistant"
    }
      }),
      // Use a unique agent name per ticket to avoid duplicate step IDs in Inngest
      name: `AI Ticket Analyzer - ${ticket._id}`,
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

    // Retry with exponential backoff to handle 429 rate limits or transient errors
    const maxRetries = 3;
    const baseDelayMs = 1000;
    let response;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        response = await agent.run(prompt);
        break;
      } catch (err) {
        const isRateLimit = String(err?.message || '').includes('429') || String(err).includes('rate') || String(err).includes('Rate');
        if (attempt === maxRetries || !isRateLimit) {
          throw err;
        }
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`⚠️ AI call failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
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
    console.warn("⚠️ AI analysis failed (using fallback):", error.message);
    console.warn("💡 Tip: Check API key validity, quota, and model access");
    const result = {
      summary: `Manual review required for: ${ticket.title}`,
      priority: "medium",
      helpfulNotes: "AI unavailable or rate-limited. Proceed with manual triage.",
      relatedSkills: ["General Support"],
      deadline: null,
    };
    console.log("↩️ Using fallback analysis:", result);
    return result;
  }
};
