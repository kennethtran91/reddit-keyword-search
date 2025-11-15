const Database = require("better-sqlite3");
const path = require("path");

class RedditDatabase {
  constructor(dbPath = "./reddit_leads.db") {
    this.db = new Database(dbPath);
    this.initDatabase();
    console.log("✓ Database initialized:", dbPath);
  }

  initDatabase() {
    // Create posts table with enhanced lead tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        selftext TEXT,
        author TEXT,
        subreddit TEXT,
        score INTEGER,
        num_comments INTEGER,
        created_utc INTEGER,
        url TEXT,
        permalink TEXT,
        search_query TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        analyzed INTEGER DEFAULT 0,
        ai_score INTEGER,
        ai_reasoning TEXT,
        ai_recommendation TEXT,
        ai_should_reach TEXT,
        ai_pain_points TEXT,
        ai_urgency TEXT,
        analyzed_at DATETIME,
        lead_status TEXT DEFAULT 'new',
        lead_notes TEXT,
        contacted_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_analyzed ON posts(analyzed);
      CREATE INDEX IF NOT EXISTS idx_ai_score ON posts(ai_score);
      CREATE INDEX IF NOT EXISTS idx_search_query ON posts(search_query);
      CREATE INDEX IF NOT EXISTS idx_subreddit ON posts(subreddit);
      CREATE INDEX IF NOT EXISTS idx_lead_status ON posts(lead_status);
      CREATE INDEX IF NOT EXISTS idx_created_at ON posts(created_at DESC);
    `);
  }

  // Save a single post
  savePost(post, searchQuery = null) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO posts (
        id, title, selftext, author, subreddit, score, 
        num_comments, created_utc, url, permalink, search_query
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        post.id,
        post.title,
        post.selftext || "",
        post.author,
        post.subreddit,
        post.score,
        post.numComments,
        post.created,
        post.url,
        post.permalink,
        searchQuery
      );
      return result.changes > 0; // Returns true only if new post was inserted
    } catch (error) {
      console.error("Error saving post:", error.message);
      return false;
    }
  }

  // Save multiple posts
  savePosts(posts, searchQuery = null) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO posts (
        id, title, selftext, author, subreddit, score, 
        num_comments, created_utc, url, permalink, search_query
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((posts) => {
      let inserted = 0;
      for (const post of posts) {
        const result = stmt.run(
          post.id,
          post.title,
          post.selftext || "",
          post.author,
          post.subreddit,
          post.score,
          post.numComments,
          post.created,
          post.url,
          post.permalink,
          searchQuery
        );
        if (result.changes > 0) inserted++;
      }
      return inserted;
    });

    try {
      const insertedCount = insertMany(posts);
      return insertedCount;
    } catch (error) {
      console.error("Error saving posts:", error.message);
      return 0;
    }
  }

  // Get unanalyzed posts (for AI processing)
  getUnanalyzedPosts(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE analyzed = 0 
      ORDER BY created_at DESC 
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  // Get all posts with optional filters
  getPosts(filters = {}) {
    let query = "SELECT * FROM posts WHERE 1=1";
    const params = [];

    if (filters.analyzed !== undefined) {
      query += " AND analyzed = ?";
      params.push(filters.analyzed);
    }

    if (filters.searchQuery) {
      query += " AND search_query = ?";
      params.push(filters.searchQuery);
    }

    if (filters.subreddit) {
      query += " AND subreddit = ?";
      params.push(filters.subreddit);
    }

    if (filters.minScore !== undefined) {
      query += " AND ai_score >= ?";
      params.push(filters.minScore);
    }

    query += " ORDER BY created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Update post with AI analysis
  updateAnalysis(postId, analysis) {
    const stmt = this.db.prepare(`
      UPDATE posts 
      SET analyzed = 1,
          ai_score = ?,
          ai_reasoning = ?,
          ai_recommendation = ?,
          ai_should_reach = ?,
          ai_pain_points = ?,
          ai_urgency = ?,
          analyzed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    try {
      stmt.run(
        analysis.score,
        analysis.reasoning,
        analysis.recommendation,
        analysis.shouldReach,
        JSON.stringify(analysis.painPoints || []),
        analysis.urgency,
        postId
      );
      return true;
    } catch (error) {
      console.error("Error updating analysis:", error.message);
      return false;
    }
  }

  // Get post by ID
  getPost(postId) {
    const stmt = this.db.prepare("SELECT * FROM posts WHERE id = ?");
    const post = stmt.get(postId);
    return post ? this.parsePainPoints(post) : null;
  }

  // Get analyzed posts sorted by score
  getAnalyzedPosts(limit = 100, minScore = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE analyzed = 1 AND ai_score >= ?
      ORDER BY ai_score DESC, created_at DESC
      LIMIT ?
    `);

    const posts = stmt.all(minScore, limit);
    return posts.map(this.parsePainPoints);
  }

  // Get statistics
  getStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN analyzed = 1 THEN 1 ELSE 0 END) as analyzed,
        SUM(CASE WHEN analyzed = 0 THEN 1 ELSE 0 END) as pending,
        AVG(CASE WHEN analyzed = 1 THEN ai_score END) as avg_score
      FROM posts
    `);

    return stmt.get();
  }

  // Clear all posts (for testing)
  clearAll() {
    this.db.exec("DELETE FROM posts");
    return true;
  }

  // Close database connection
  close() {
    this.db.close();
  }

  // Update lead status
  updateLeadStatus(postId, status, notes = null) {
    const stmt = this.db.prepare(`
      UPDATE posts 
      SET lead_status = ?,
          lead_notes = COALESCE(?, lead_notes),
          contacted_at = CASE WHEN ? = 'contacted' THEN CURRENT_TIMESTAMP ELSE contacted_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    try {
      stmt.run(status, notes, status, postId);
      return true;
    } catch (error) {
      console.error("Error updating lead status:", error.message);
      return false;
    }
  }

  // Get leads by status
  getLeadsByStatus(status, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM posts 
      WHERE lead_status = ? AND analyzed = 1
      ORDER BY ai_score DESC, created_at DESC
      LIMIT ?
    `);

    const posts = stmt.all(status, limit);
    return posts.map(this.parsePainPoints);
  }

  // Helper to parse pain points JSON
  parsePainPoints(post) {
    if (post && post.ai_pain_points) {
      try {
        post.ai_pain_points = JSON.parse(post.ai_pain_points);
      } catch (e) {
        post.ai_pain_points = [];
      }
    }
    return post;
  }
}

module.exports = RedditDatabase;
