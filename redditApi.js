const axios = require("axios");

class RedditAPI {
  constructor() {
    // No authentication needed! Using public JSON endpoints
    this.baseUrl = "https://www.reddit.com";
    this.userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";
  }

  // No authentication required for public JSON endpoints!

  /**
   * Search Reddit using public JSON endpoints (NO AUTH REQUIRED!)
   *
   * Reddit provides public JSON by adding .json to any URL
   * Example: https://www.reddit.com/r/all/search.json?q=keyword
   *
   * @param {string} keyword - Search query
   * @param {Object} options - Search parameters
   * @returns {Promise<Object>} Search results with pagination
   */
  async search(keyword, options = {}) {
    if (!keyword || keyword.length > 512) {
      throw new Error("Search query must be 1-512 characters");
    }

    const {
      subreddit = "all",
      sort = "relevance",
      time = "all",
      limit = 25,
      after = null,
      before = null,
    } = options;

    // Validate parameters
    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    try {
      // Use Reddit's public JSON endpoint - NO AUTH NEEDED!
      const url = `${this.baseUrl}/r/${subreddit}/search.json`;

      const params = {
        q: keyword,
        sort: sort,
        t: time,
        limit: limit,
        restrict_sr: subreddit !== "all",
      };

      // Add pagination if provided
      if (after) params.after = after;
      if (before) params.before = before;

      const response = await axios.get(url, {
        params: params,
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      return this.parseResults(response.data);
    } catch (error) {
      console.error("Search error:", error.response?.data || error.message);
      throw new Error(
        "Failed to search Reddit: " +
          (error.response?.statusText || error.message)
      );
    }
  }

  /**
   * Parse Reddit API listing response
   *
   * @param {Object} data - Reddit API response data
   * @returns {Object} Parsed results with pagination info
   */
  parseResults(data) {
    if (!data.data || !data.data.children) {
      return {
        posts: [],
        after: null,
        before: null,
        count: 0,
      };
    }

    const posts = data.data.children.map((child) => {
      const post = child.data;
      return {
        id: post.id,
        fullname: post.name, // Full ID like "t3_abc123"
        title: post.title,
        author: post.author,
        subreddit: post.subreddit,
        subredditFullname: post.subreddit_id,
        score: post.score,
        upvoteRatio: post.upvote_ratio,
        numComments: post.num_comments,
        created: new Date(post.created_utc * 1000).toISOString(),
        createdUtc: post.created_utc,
        url: `https://reddit.com${post.permalink}`,
        permalink: post.permalink,
        selftext: post.selftext || "",
        selftextHtml: post.selftext_html || null,
        link: post.url,
        domain: post.domain,
        thumbnail:
          post.thumbnail && post.thumbnail.startsWith("http")
            ? post.thumbnail
            : null,
        isVideo: post.is_video || false,
        isSelf: post.is_self || false,
        nsfw: post.over_18 || false,
        spoiler: post.spoiler || false,
        locked: post.locked || false,
        stickied: post.stickied || false,
        distinguished: post.distinguished || null, // moderator, admin, special, or null
        linkFlairText: post.link_flair_text || null,
        authorFlairText: post.author_flair_text || null,
        gilded: post.gilded || 0,
        awards: post.total_awards_received || 0,
      };
    });

    // Return results with pagination info
    return {
      posts: posts,
      after: data.data.after, // Use for next page
      before: data.data.before, // Use for previous page
      count: posts.length,
      modhash: data.data.modhash || null,
    };
  }

  async getSubredditInfo(subreddit) {
    try {
      // Use public JSON endpoint - NO AUTH NEEDED!
      const url = `${this.baseUrl}/r/${subreddit}/about.json`;

      const response = await axios.get(url, {
        headers: {
          "User-Agent": this.userAgent,
        },
      });

      const data = response.data.data;
      return {
        name: data.display_name,
        title: data.title,
        description: data.public_description,
        subscribers: data.subscribers,
        activeUsers: data.active_user_count,
      };
    } catch (error) {
      console.error(
        "Subreddit info error:",
        error.response?.data || error.message
      );
      return null;
    }
  }

  /**
   * Search for multiple keywords and combine results
   * Note: Pagination is not supported for multiple keyword searches
   *
   * @param {Array<string>} keywords - Array of keywords to search for
   * @param {Object} options - Search options (same as search())
   * @returns {Promise<Array>} Combined and deduplicated results sorted by score
   */
  async searchMultipleKeywords(keywords, options = {}) {
    const results = await Promise.all(
      keywords.map((keyword) =>
        this.search(keyword, options)
          .then((result) => result.posts) // Extract posts from new response format
          .catch((err) => {
            console.error(`Error searching for "${keyword}":`, err.message);
            return [];
          })
      )
    );

    // Combine and deduplicate results by post ID
    const allResults = results.flat();
    const uniqueResults = Array.from(
      new Map(allResults.map((item) => [item.id, item])).values()
    );

    // Sort by score descending
    return uniqueResults.sort((a, b) => b.score - a.score);
  }
}

module.exports = RedditAPI;
