const cron = require("node-cron");
const RedditAPI = require("./redditApi");
const GeminiService = require("./geminiService");
const RedditDatabase = require("./db");

class MonitoringService {
  constructor() {
    this.redditApi = new RedditAPI();
    this.geminiService = new GeminiService(process.env.GEMINI_API_KEY);
    this.db = new RedditDatabase();
    this.isRunning = false;
    this.config = this.loadConfig();
    this.onNewLead = null; // Callback for real-time updates

    console.log("✓ Monitoring Service initialized");
  }

  loadConfig() {
    try {
      const config = require("./config.json");
      return {
        keywords: config.monitoringKeywords ||
          config.defaultKeywords || ["interview preparation", "mock interview"],
        subreddits: config.monitoringSubreddits ||
          config.defaultSubreddits || ["cscareerquestions", "jobs"],
        interval: config.monitoringInterval || "*/30 * * * *", // Default: every 30 minutes
        limit: config.defaultLimit || 25,
        minScore: config.minScoreThreshold || 60,
      };
    } catch (error) {
      console.error("Error loading config:", error.message);
      return {
        keywords: [
          "interview preparation",
          "mock interview",
          "coding interview",
        ],
        subreddits: [
          "cscareerquestions",
          "jobs",
          "careerguidance",
          "recruitinghell",
        ],
        interval: "*/30 * * * *",
        limit: 25,
        minScore: 60,
      };
    }
  }

  async searchAndAnalyze() {
    if (this.isRunning) {
      console.log("⏸️  Search already running, skipping...");
      return;
    }

    this.isRunning = true;
    console.log("\n🔍 Starting automated search and analysis...");
    console.log(`Keywords: ${this.config.keywords.join(", ")}`);
    console.log(`Subreddits: ${this.config.subreddits.join(", ")}`);

    try {
      let totalNewLeads = 0;

      // Search each subreddit
      for (const subreddit of this.config.subreddits) {
        console.log(`\n📍 Searching r/${subreddit}...`);

        // Search for all keywords in this subreddit
        for (const keyword of this.config.keywords) {
          try {
            // Search Reddit
            const results = await this.redditApi.search(keyword, {
              subreddit,
              sort: "new", // Get latest posts
              time: "day", // Last 24 hours
              limit: this.config.limit,
            });

            if (!results.posts || results.posts.length === 0) {
              console.log(`  ℹ️  No posts found for "${keyword}"`);
              continue;
            }

            console.log(
              `  Found ${results.posts.length} posts for "${keyword}"`
            );

            // Filter out posts we've already seen
            const newPosts = results.posts.filter((post) => {
              const existing = this.db.getPost(post.id);
              return !existing;
            });

            if (newPosts.length === 0) {
              console.log(`  ℹ️  All posts already in database`);
              continue;
            }

            console.log(`  📝 ${newPosts.length} new posts to analyze`);

            // Save posts to database
            this.db.savePosts(newPosts, keyword);

            // Analyze with AI if enabled
            if (this.geminiService.enabled) {
              for (let i = 0; i < newPosts.length; i++) {
                const post = newPosts[i];

                // Rate limiting: ~2 seconds between requests
                if (i > 0) {
                  await this.delay(2100);
                }

                console.log(
                  `  🤖 Analyzing post ${i + 1}/${newPosts.length}...`
                );

                const analysis = await this.geminiService.analyzePost(post);
                this.db.updateAnalysis(post.id, analysis);

                // If this is a good lead, trigger callback for real-time update
                if (analysis.score >= this.config.minScore && this.onNewLead) {
                  const leadData = {
                    ...post,
                    aiAnalysis: analysis,
                  };
                  this.onNewLead(leadData);
                  totalNewLeads++;
                  console.log(`  ✨ Good lead found! Score: ${analysis.score}`);
                }
              }
            } else {
              console.log(`  ⚠️  AI analysis disabled - skipping analysis`);
            }

            // Small delay between keywords
            await this.delay(1000);
          } catch (error) {
            console.error(`  ❌ Error searching "${keyword}":`, error.message);
          }
        }

        // Delay between subreddits
        await this.delay(2000);
      }

      const stats = this.db.getStats();
      console.log("\n✅ Search complete!");
      console.log(
        `📊 Database stats: ${stats.total} total posts, ${stats.analyzed} analyzed`
      );
      console.log(`✨ New leads found: ${totalNewLeads}\n`);
    } catch (error) {
      console.error("❌ Monitoring error:", error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start the cron job
  start() {
    console.log(`\n🚀 Starting monitoring service...`);
    console.log(`⏰ Schedule: ${this.config.interval}`);
    console.log(
      `📍 Monitoring subreddits: ${this.config.subreddits.join(", ")}`
    );
    console.log(`🔑 Keywords: ${this.config.keywords.join(", ")}`);

    // Run immediately on start
    console.log("\n🏃 Running initial search...");
    this.searchAndAnalyze();

    // Schedule recurring searches
    this.job = cron.schedule(this.config.interval, () => {
      console.log(
        `\n⏰ Scheduled search triggered at ${new Date().toLocaleString()}`
      );
      this.searchAndAnalyze();
    });

    console.log("✓ Monitoring service started!\n");
  }

  // Stop the cron job
  stop() {
    if (this.job) {
      this.job.stop();
      console.log("⏹️  Monitoring service stopped");
    }
  }

  // Run search manually
  async runManual() {
    console.log("🔄 Running manual search...");
    await this.searchAndAnalyze();
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log("✓ Configuration updated");
  }

  // Set callback for new leads
  setNewLeadCallback(callback) {
    this.onNewLead = callback;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.db.getStats(),
      aiEnabled: this.geminiService.enabled,
    };
  }
}

module.exports = MonitoringService;
