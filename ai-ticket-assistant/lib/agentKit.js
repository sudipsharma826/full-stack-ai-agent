
import { createAgent, grok, openai, gemini } from "@inngest/agent-kit";
import 'dotenv/config';



export const analyzeTicket = async (ticket) => {
  console.log("🤖 Starting AI analysis for ticket:", ticket._id);
  console.log("📋 Ticket details:", { title: ticket.title, description: ticket.description });

  // Prompt and system message
  const system = `You are an AI assistant that analyzes support tickets and suggests responses.
    Analyze the ticket and respond with ONLY a valid JSON object containing:
    - summary: Brief summary of the issue
    - priority: one of "low", "medium", or "high"
    - helpfulNotes: Helpful suggestions for resolution
    - relatedSkills: array of relevant skills
    - deadline: date in YYYY-MM-DD format (future date based on priority)
    For deadlines, use these guidelines:
    - high priority: add 1 days from today (${new Date().toISOString().split('T')[0]})
    - medium priority: add 2-4 days from today
    - low priority: add 5-10 days from today
    Respond ONLY with valid JSON. No explanations, no markdown, no code blocks.`;

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

  // Provider configs (ordered by preference)
  const providers = [
    {
      name: 'OpenRouter-OpenAI',
      enabled: !!process.env.OPENROUTER_API_KEY,
      model: openai({
        model: "openai/gpt-4o-mini",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: "https://openrouter.ai/api/v1",
        defaultParameters: { temperature: 0.5 },
        headers: {
          "HTTP-Referer": "ai-ticket-assistant",
          "X-Title": "AI Ticket Assistant"
        }
      })
    },
    {
      name:'HuggingFace-OpenAI',
      enabled: !!process.env.HUGGINGFACE_API_KEY,
      model: openai({
        model: "openai/gpt-oss-20b:groq",
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: "https://router.huggingface.co/v1",
        defaultParameters: { temperature: 0.5 }
      })

    },
    {
      name: 'Gemini',
      enabled: !!process.env.GEMINI_API_KEY,
      model: gemini({
        apiKey: process.env.GEMINI_API_KEY,
        model: "gemini-pro"
      })
    },
    {
      name: 'Grok',
      enabled: !!process.env.GROK_API_KEY,
      model: grok({
        apiKey: process.env.GROK_API_KEY
      })
    },
    {
      name: 'DeepSeek',
      enabled: !!process.env.DEEPSEEK_API_KEY,
      model: openai({
        model: "deepseek-chat",
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: "https://api.deepseek.com/v1",
      })
    },
    {
      name: 'OpenAI',
      enabled: !!process.env.OPENAI_API_KEY,
      model: openai({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  ];

  // Helper: parse error for quota/rate/limit
  function isQuotaOrRateError(err) {
    const msg = String(err?.message || err || "").toLowerCase();
    return (
      msg.includes("quota") ||
      msg.includes("exceed") ||
      msg.includes("rate") ||
      msg.includes("429") ||
      msg.includes("limit")
    );
  }

  // Try each provider in order
  for (const provider of providers) {
    if (!provider.enabled) continue;
    try {
      console.log(`🔧 Trying provider: ${provider.name}`);
      const agent = createAgent({
        model: provider.model,
        name: `AI Ticket Analyzer - ${ticket._id}`,
        description: "Analyzes support tickets and suggests responses",
        system
      });
      const maxRetries = 1;
      const baseDelayMs = 1000;
      let response;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          response = await agent.run(prompt);
          break;
        } catch (err) {
          if (attempt === maxRetries || !isQuotaOrRateError(err)) throw err;
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          console.warn(`⚠️ ${provider.name} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
        }
      }
      console.log(`📥 ${provider.name} response:`, JSON.stringify(response, null, 2));

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

      // Clean up the content to extract JSON
      let jsonString = rawContent.trim();
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonString);
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
      console.log(`🎯 Final cleaned response from ${provider.name}:`, result);
      return result;
    } catch (error) {
      if (isQuotaOrRateError(error)) {
        console.warn(`⚠️ Provider ${provider.name} quota/rate error:`, error.message || error);
        continue; // Try next provider
      }
      console.warn(`⚠️ Provider ${provider.name} failed:`, error.message || error);
    }
  }

  // If all providers fail, fallback
  const result = {
    summary: `Manual review required for: ${ticket.title}`,
    priority: "medium",
    helpfulNotes: "AI unavailable or rate-limited. Proceed with manual triage.",
    relatedSkills: ["General Support"],
    deadline: null,
  };
  console.log("↩️ Using fallback analysis:", result);
  return result;
};
