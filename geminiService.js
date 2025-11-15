const { GoogleGenAI } = require("@google/genai");

class GeminiService {
  constructor(apiKey) {
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn(
        "⚠️  Gemini API key not configured. AI analysis will be disabled."
      );
      console.warn(
        "   Get your free key at: https://aistudio.google.com/app/apikey"
      );
      this.enabled = false;
      return;
    }

    this.ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    this.enabled = true;
    console.log("✓ Gemini AI initialized");
  }

  // Sanitize post data - extract only what's needed for AI analysis
  sanitizePost(post) {
    return {
      id: post.id,
      title: post.title,
      // Truncate content to save tokens
      content: post.selftext
        ? post.selftext.length > 2000
          ? post.selftext.substring(0, 2000) + "...[truncated]"
          : post.selftext
        : "",
      subreddit: post.subreddit,
      author: post.author,
      score: post.score,
      numComments: post.num_comments || post.numComments,
    };
  }

  async analyzePost(post) {
    if (!this.enabled) {
      return {
        score: 50,
        reasoning: "AI analysis disabled - add GEMINI_API_KEY to .env",
        recommendation: "Configure Gemini API for AI-powered lead scoring",
        shouldReach: "unknown",
      };
    }

    try {
      // Sanitize the post data
      const cleanPost = this.sanitizePost(post);

      const prompt = `You are an expert sales analyst for an AI Interview Preparation SaaS product that helps people practice mock interviews with AI.

Analyze this Reddit post and determine if the poster is a good lead to pitch our AI Interview Prep tool to:

**Post Title:** ${cleanPost.title}

**Post Content:** ${cleanPost.content || "No content, just title"}

**Subreddit:** r/${cleanPost.subreddit}

**Author:** u/${cleanPost.author}

**Engagement:** ${cleanPost.score} upvotes, ${cleanPost.numComments} comments

Provide a JSON response with:
1. "score" (0-100): How good of a lead is this? 
   - 90-100: Excellent lead (explicitly asking for interview prep help)
   - 70-89: Good lead (interview-related, likely to be interested)
   - 50-69: Moderate lead (tangentially related)
   - 0-49: Poor lead (not relevant)

2. "reasoning" (1-2 sentences): Why this score?

3. "recommendation" (1-2 sentences): How should you pitch to this person?

4. "shouldReach" ("yes" | "maybe" | "no"): Should you reach out?

5. "painPoints" (array): What specific pain points did they mention?

6. "urgency" ("high" | "medium" | "low"): How urgent is their need?

Respond ONLY with valid JSON, no other text.`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
      });

      const text = response.text;

      // Clean up the response - remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const analysis = JSON.parse(cleanedText);

      return {
        score: analysis.score || 50,
        reasoning: analysis.reasoning || "",
        recommendation: analysis.recommendation || "",
        shouldReach: analysis.shouldReach || "maybe",
        painPoints: analysis.painPoints || [],
        urgency: analysis.urgency || "medium",
      };
    } catch (error) {
      console.error("Gemini analysis error:", error.message);
      return {
        score: 50,
        reasoning: `Analysis failed: ${error.message}`,
        recommendation: "Manual review recommended",
        shouldReach: "unknown",
        painPoints: [],
        urgency: "medium",
      };
    }
  }

  async analyzeBatch(posts, onProgress = null) {
    if (!this.enabled) {
      console.log("AI analysis disabled - skipping batch analysis");
      return posts.map((post) => ({
        ...post,
        aiAnalysis: {
          score: 50,
          reasoning: "AI analysis disabled",
          recommendation: "Configure Gemini API key",
          shouldReach: "unknown",
          painPoints: [],
          urgency: "medium",
        },
      }));
    }

    const analyzed = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      // Add delay to respect rate limits (Gemini free tier: 30 requests/minute)
      if (i > 0) {
        await this.delay(2100); // ~2 seconds between requests for 30 RPM
      }

      const analysis = await this.analyzePost(post);
      analyzed.push({
        ...post,
        aiAnalysis: analysis,
      });

      if (onProgress) {
        onProgress(i + 1, posts.length);
      }
    }

    // Sort by AI score (highest first)
    return analyzed.sort((a, b) => b.aiAnalysis.score - a.aiAnalysis.score);
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = GeminiService;
