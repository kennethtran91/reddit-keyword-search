# 🚀 Setup Guide

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- Gemini API key (free from Google)

## Step-by-Step Setup

### 1. Clone or Download the Project

```bash
cd reddit-keyword-search
```

### 2. Install All Dependencies

Run this single command to install both backend and frontend dependencies:

```bash
npm run install-all
```

Or manually:

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd client && npm install && cd ..
```

### 3. Get Your Gemini API Key

1. **Visit**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click**: "Create API Key"
4. **Copy** the generated key

The free tier includes:

- 15 requests per minute
- 1,500 requests per day
- Perfect for this use case!

### 4. Create Environment File

Create a file named `.env` in the root directory:

```bash
touch .env
```

Add your API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3001
```

### 5. Configure Monitoring (Optional)

Edit `config.json` to customize what the system searches for:

```json
{
  "monitoringKeywords": [
    "interview preparation",
    "mock interview",
    "coding interview",
    "technical interview prep"
  ],
  "monitoringSubreddits": [
    "cscareerquestions",
    "jobs",
    "careerguidance",
    "careeradvice",
    "interviews"
  ],
  "monitoringInterval": "*/30 * * * *",
  "minScoreThreshold": 60
}
```

**Keywords**: What terms to search for on Reddit
**Subreddits**: Which subreddits to monitor
**Interval**: How often to search (cron format)
**Threshold**: Minimum AI score to consider a good lead (0-100)

### 6. Run the Application

**Option A: Development Mode** (Recommended for testing)

Runs both backend and frontend with hot reload:

```bash
npm run dev
```

This will:

- Start the backend server on http://localhost:3001
- Start the React frontend on http://localhost:3000
- Open your browser automatically

**Option B: Production Mode**

Terminal 1 - Backend:

```bash
npm start
```

Terminal 2 - Frontend:

```bash
cd client
npm start
```

### 7. Access the Application

Open your browser and navigate to:

**Dashboard**: http://localhost:3000

You should see:

- The Reddit Lead Finder dashboard
- Statistics showing 0 total posts (initially)
- Monitoring status indicator
- A "Manual Search" button

### 8. Verify Everything Works

1. **Check Monitoring Status**:

   - Look for the blue status box on the dashboard
   - Should show "Monitoring: Running" with a green pulse

2. **Trigger Manual Search**:

   - Click the "Manual Search" button
   - Check the backend console/terminal for search activity
   - New leads should appear in the dashboard automatically

3. **Check Backend Health**:

   ```bash
   curl http://localhost:3001/api/health
   ```

   Should return:

   ```json
   {
     "status": "ok",
     "monitoring": { ... },
     "timestamp": "..."
   }
   ```

## 🎯 What Happens Next?

### Automatic Monitoring

Once started, the system will:

1. **Immediately** run a search for all configured keywords and subreddits
2. **Every 30 minutes** (by default), repeat the search
3. **Analyze** new posts with Gemini AI
4. **Save** high-scoring leads to the database
5. **Notify** you in real-time via WebSocket when good leads are found

### First Search

The initial search will:

- Search the last 24 hours of posts
- Analyze each post with AI
- Take ~2 seconds per post (due to AI rate limits)
- Display progress in the backend console

**Be patient!** If you're searching 5 keywords across 5 subreddits with a limit of 25 posts each, that's potentially 125 posts to analyze. At 2 seconds each, this could take 4-5 minutes.

### Viewing Leads

As leads are found and analyzed:

- They appear in the dashboard automatically
- Sorted by AI score (highest first)
- Color-coded by score:
  - 🟢 Green (80-100): Excellent leads
  - 🟡 Yellow (60-79): Good leads
  - ⚪ Gray (<60): Moderate leads

## 🔧 Customization

### Changing Search Frequency

Edit `monitoringInterval` in `config.json`:

```json
{
  "monitoringInterval": "*/15 * * * *" // Every 15 minutes
}
```

**Cron syntax examples:**

- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 9 * * *` - Daily at 9 AM

### Changing AI Sensitivity

Edit `minScoreThreshold` in `config.json`:

```json
{
  "minScoreThreshold": 70 // Only notify for leads scored 70+
}
```

Lower = more leads, higher = fewer but better quality

### Adapting for Your Product

To use this for a different product/service:

1. **Update keywords** in `config.json` to match your target customers' problems
2. **Update subreddits** to where your customers hang out
3. **Customize AI prompt** in `geminiService.js` to analyze for your specific product
4. **Update dashboard title** in `client/src/App.js`

## 📊 Monitoring & Logs

### Backend Console Logs

Watch for:

```
✓ Monitoring Service initialized
🚀 Server running on http://localhost:3001
🔌 WebSocket server ready
Starting automated search and analysis...
📍 Searching r/cscareerquestions...
  Found 15 posts for "interview preparation"
  📝 10 new posts to analyze
  🤖 Analyzing post 1/10...
  ✨ Good lead found! Score: 85
✅ Search complete!
```

### Database

Check the SQLite database directly:

```bash
# Install sqlite3 if you don't have it
brew install sqlite3  # macOS
# or
sudo apt-get install sqlite3  # Linux

# Query the database
sqlite3 reddit_leads.db "SELECT COUNT(*) FROM posts;"
sqlite3 reddit_leads.db "SELECT title, ai_score FROM posts WHERE ai_score > 70 ORDER BY ai_score DESC LIMIT 5;"
```

## 🐛 Troubleshooting

### "AI analysis disabled"

**Problem**: Gemini API key not configured

**Solution**:

1. Check `.env` file exists in root directory
2. Verify `GEMINI_API_KEY=your_key_here` is present
3. Restart the backend server

### "No new leads appearing"

**Possible causes:**

1. **All posts already analyzed**

   - The system only analyzes new posts
   - Wait for the next scheduled search
   - Or search different subreddits/keywords

2. **AI scores are too low**

   - Lower `minScoreThreshold` in `config.json`
   - Check backend console for actual scores

3. **No matching posts found**
   - Try broader keywords
   - Add more subreddits
   - Increase the time range in `monitoringService.js` (currently "day")

### "WebSocket disconnected"

**Problem**: Frontend can't connect to backend

**Solution**:

1. Ensure backend is running on port 3001
2. Check `client/.env` has correct `REACT_APP_WS_URL`
3. Refresh the frontend page

### Rate Limit Errors

**Problem**: Too many AI requests

**Solution**:

- Gemini free tier: 15 requests/minute
- The system waits 2.1 seconds between requests
- Reduce the number of keywords or subreddits
- Increase the monitoring interval

## 🚀 Next Steps

1. **Let it run**: Leave the system running and check back in a few hours
2. **Review leads**: Check the dashboard for new high-scoring leads
3. **Take action**: Use the "View on Reddit" and "Message" buttons to reach out
4. **Track progress**: Update lead status as you contact them
5. **Optimize**: Adjust keywords and thresholds based on lead quality

## 💡 Pro Tips

1. **Start with manual search**: Click "Manual Search" to test your configuration before waiting for the scheduled search

2. **Monitor the console**: Keep the backend terminal visible to see what's happening

3. **Be specific with keywords**: "need help with interviews" is better than just "interview"

4. **Target niche subreddits**: Smaller communities often have more engaged users

5. **Respond fast**: Set up browser notifications or check the dashboard regularly

6. **A/B test keywords**: Try different keyword combinations and see which bring better leads

## 📞 Need Help?

If you encounter issues:

1. Check the backend console for error messages
2. Verify all environment variables are set
3. Ensure your Gemini API key is valid
4. Check that ports 3000 and 3001 are not in use

Happy lead hunting! 🎯
