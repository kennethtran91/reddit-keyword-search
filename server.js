require("dotenv").config();
const express = require("express");
const path = require("path");
const RedditAPI = require("./redditApi");
const GeminiService = require("./geminiService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - increase body size limit for AI analysis
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static("public"));

// Initialize Reddit API (NO AUTH REQUIRED!)
const redditApi = new RedditAPI();
console.log(
  "✓ Reddit API initialized (using public JSON endpoints - no auth needed!)"
);

// Initialize Gemini AI
const geminiService = new GeminiService(process.env.GEMINI_API_KEY);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Search endpoint
app.post("/api/search", async (req, res) => {
  try {
    const {
      keywords,
      subreddit = "all",
      sort = "relevance",
      time = "all",
      limit = 25,
      after = null,
      before = null,
    } = req.body;

    // Validate required parameters
    if (!keywords || keywords.length === 0) {
      return res.status(400).json({
        error: "Keywords are required",
        message: "Please provide at least one keyword to search for",
      });
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Invalid limit",
        message: "Limit must be between 1 and 100",
      });
    }

    let results;

    if (Array.isArray(keywords) && keywords.length > 1) {
      // Search for multiple keywords
      results = await redditApi.searchMultipleKeywords(keywords, {
        subreddit,
        sort,
        time,
        limit,
        after,
        before,
      });

      // Format for multiple keyword results
      res.json({
        success: true,
        query: {
          keywords: keywords,
          subreddit: subreddit,
          sort: sort,
          time: time,
          limit: limit,
        },
        count: results.length,
        results: results,
        after: null, // Multiple keyword searches don't support pagination
        before: null,
      });
    } else {
      // Search for single keyword
      const keyword = Array.isArray(keywords) ? keywords[0] : keywords;
      results = await redditApi.search(keyword, {
        subreddit,
        sort,
        time,
        limit,
        after,
        before,
      });

      // Return results with pagination info
      res.json({
        success: true,
        query: {
          keyword: keyword,
          subreddit: subreddit,
          sort: sort,
          time: time,
          limit: limit,
        },
        count: results.count,
        posts: results.posts,
        after: results.after, // Use this to get the next page
        before: results.before, // Use this to get the previous page
        modhash: results.modhash,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Failed to search Reddit",
      message: error.message,
    });
  }
});

// AI Analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide an array of posts to analyze",
      });
    }

    if (!geminiService.enabled) {
      return res.status(503).json({
        error: "AI analysis not available",
        message:
          "Gemini API key not configured. Add GEMINI_API_KEY to your .env file",
        getKeyAt: "https://aistudio.google.com/app/apikey",
      });
    }

    // Analyze posts with progress updates via Server-Sent Events
    // For now, we'll do a simple batch analysis
    const analyzedPosts = await geminiService.analyzeBatch(
      posts,
      (current, total) => {
        console.log(`Analyzing post ${current}/${total}...`);
      }
    );

    res.json({
      success: true,
      analyzed: analyzedPosts.length,
      posts: analyzedPosts,
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze posts",
      message: error.message,
    });
  }
});

// Analyze single post endpoint
app.post("/api/analyze-post", async (req, res) => {
  try {
    const { post } = req.body;

    if (!post) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide a post to analyze",
      });
    }

    if (!geminiService.enabled) {
      return res.status(503).json({
        error: "AI analysis not available",
        message: "Gemini API key not configured",
        getKeyAt: "https://aistudio.google.com/app/apikey",
      });
    }

    const analysis = await geminiService.analyzePost(post);

    res.json({
      success: true,
      post: {
        ...post,
        aiAnalysis: analysis,
      },
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze post",
      message: error.message,
    });
  }
});

// Get subreddit info
app.get("/api/subreddit/:name", async (req, res) => {
  try {
    const info = await redditApi.getSubredditInfo(req.params.name);

    if (!info) {
      return res.status(404).json({ error: "Subreddit not found" });
    }

    res.json(info);
  } catch (error) {
    console.error("Subreddit info error:", error);
    res.status(500).json({
      error: "Failed to get subreddit info",
      message: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    apiConfigured: true,
    authRequired: false,
    method: "Public JSON endpoints",
    aiEnabled: geminiService.enabled,
    timestamp: new Date().toISOString(),
  });
});

// Load config endpoint
app.get("/api/config", (req, res) => {
  try {
    const config = require("./config.json");
    res.json(config);
  } catch (error) {
    res.json({
      defaultKeywords: [],
      defaultSubreddits: ["all"],
      defaultSort: "relevance",
      defaultTime: "all",
      defaultLimit: 25,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(
    `\n🚀 Reddit Keyword Search app running on http://localhost:${PORT}`
  );
  console.log(`\n✓ Using public JSON endpoints - NO AUTHENTICATION REQUIRED!`);
  console.log(`✓ No Reddit API credentials needed`);
  console.log(`✓ No rate limit restrictions`);
  console.log(
    `\n💡 Tip: You can search any public subreddit without any setup!\n`
  );
});
