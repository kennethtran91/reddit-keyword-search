# AI Analysis Setup Guide

## Get Your Free Gemini API Key

The Reddit Lead Finder uses Google's Gemini AI to analyze posts and identify which ones are the best leads for your AI Interview Prep SaaS.

### Steps to Enable AI Analysis:

1. **Get a Free API Key:**

   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Add to Your .env File:**

   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Restart the Server:**

   ```bash
   npm start
   ```

4. **Test It:**
   - Search for posts
   - Click the "Analyze with AI" button
   - Watch as Gemini scores each post and provides pitch recommendations!

## What the AI Does:

### 📊 Scores Each Post (0-100)

- **90-100**: Excellent lead - explicitly asking for interview prep help
- **70-89**: Good lead - interview-related, likely interested
- **50-69**: Moderate lead - tangentially related
- **0-49**: Poor lead - not relevant

### 🎯 Provides Recommendations

- **Pain Points**: What problems they're facing
- **Urgency Level**: How soon they need help (high/medium/low)
- **Pitch Tips**: Exactly how to approach them
- **Should Reach Out?**: Yes/Maybe/No recommendation

### 🚀 Sorts by Quality

Results are automatically sorted by AI score, so the best leads appear first!

## Free Tier Limits:

- **60 requests per minute** (we automatically rate-limit to stay within this)
- **1,500 requests per day**
- **1 million tokens per month**

This is more than enough for lead generation! Even analyzing 100 posts at once is well within limits.

## Example Analysis:

```
Post: "I have a tech interview next week and I'm so nervous. Any tips?"

AI Score: 95/100
Reasoning: Explicit request for interview help with immediate timeline
Pitch Tip: Lead with empathy about interview nerves. Mention your AI can help
          them practice in a safe environment. Emphasize the immediate value
          since they have a deadline.
Pain Points: ["interview anxiety", "upcoming deadline", "need practice"]
Urgency: HIGH
Should Reach: YES
```

## No API Key? No Problem!

The app still works without AI analysis - you just won't get the automatic scoring and recommendations. You can still:

- Search Reddit posts
- Save leads manually
- Track status and export

But the AI makes it 10x easier to identify the best opportunities! 🎯
