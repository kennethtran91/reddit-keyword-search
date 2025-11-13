# Reddit Lead Finder 🎯

A web application for finding potential customers on Reddit - **powered by AI analysis!**

## 🎉 Zero Setup Required!

This app uses Reddit's **public JSON endpoints** - no authentication, no API keys, no waiting for approval!

## Features

### Core Features

- 🚀 **No Authentication** - Works immediately, no Reddit API credentials needed
- 🔍 **Keyword Search** - Search for single or multiple keywords
- 🎯 **Subreddit Filtering** - Search specific subreddits or all of Reddit
- 📊 **Sort Options** - Sort by relevance, hot, top, new
- ⏰ **Time Filters** - Filter by hour, day, week, month, year, all time

### Lead Generation Features

- 🤖 **AI-Powered Analysis** - Gemini AI scores posts and identifies best leads
- 💼 **Lead Management** - Save, track, and organize potential customers
- 📝 **Status Tracking** - Track leads through: New → Contacted → Interested/Not Interested
- 📊 **Smart Scoring** - AI ranks posts 0-100 based on likelihood to convert
- � **Pitch Recommendations** - AI suggests how to approach each lead
- 🎯 **Pain Point Detection** - AI identifies specific problems mentioned
- 📈 **Urgency Detection** - Know which leads need immediate attention
- 📤 **CSV Export** - Export all leads with notes for follow-up
- 🎨 **Modern UI** - Clean, responsive Tailwind CSS interface

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. (Optional) Enable AI Analysis

Get a free Gemini API key from https://aistudio.google.com/app/apikey

Add to `.env`:

```
GEMINI_API_KEY=your_api_key_here
```

See [AI_SETUP.md](./AI_SETUP.md) for detailed instructions.

### 3. Run the App

```bash
npm start
```

That's it! Open http://localhost:3000 and start finding leads!

## How It Works

### Reddit Public JSON

Reddit provides **public JSON feeds** for all public content by simply adding `.json` to any URL:

- Regular URL: `https://www.reddit.com/r/all/search?q=keyword`
- JSON API: `https://www.reddit.com/r/all/search.json?q=keyword`

No authentication required! This app uses these public endpoints to search Reddit.

### AI Analysis (Optional)

When you add a Gemini API key, the app analyzes each post to determine:

1. **Lead Quality Score (0-100)** - How likely they are to be interested
2. **Pain Points** - Specific problems they mentioned
3. **Urgency Level** - How soon they need help
4. **Pitch Recommendation** - Exactly how to approach them

## Use Case: AI Interview Prep SaaS

This tool was built to find leads for an AI Interview Preparation SaaS. Here's the workflow:

1. **Search** for keywords like "interview preparation", "mock interview", "coding interview"
2. **Analyze** posts with AI to find people actively seeking help
3. **Save** promising leads with high AI scores
4. **Track** who you've contacted and their status
5. **Export** to CSV for CRM or follow-up system
6. **Reach out** with personalized pitches based on AI recommendations

### Best Subreddits for Interview Prep Leads:

- r/cscareerquestions
- r/jobs
- r/careeradvice
- r/careerguidance
- r/interviews

## Configuration

Edit `config.json` to customize default settings:

```json
{
  "defaultKeywords": ["problem with", "looking for solution", "need help with"],
  "defaultSubreddits": ["all", "AskReddit", "webdev"],
  "defaultSort": "relevance",
  "defaultTime": "week",
  "defaultLimit": 25
}
```

## API Usage

### Search Endpoint

**POST** `/api/search`

```javascript
{
  "keywords": ["keyword1", "keyword2"], // or single string
  "subreddit": "all",                    // or specific subreddit name
  "sort": "relevance",                   // relevance, hot, top, new, comments
  "time": "all",                         // hour, day, week, month, year, all
  "limit": 25,                           // 1-100
  "type": "link",                        // link, sr, user
  "after": null,                         // For pagination
  "before": null,                        // For pagination
  "count": 0,                            // Items already seen
  "restrict_sr": true,                   // Restrict to subreddit
  "include_facets": false,               // Include facet data
  "category": null                       // Category filter
}
```

**Response:**

```javascript
{
  "success": true,
  "query": {
    "keyword": "search term",
    "subreddit": "all",
    "sort": "relevance",
    "time": "all",
    "limit": 25
  },
  "count": 25,
  "posts": [ /* array of post objects */ ],
  "after": "t3_abc123",  // Use for next page
  "before": null,
  "modhash": ""
}
```

### Other Endpoints

- `GET /api/health` - Check API status
- `GET /api/config` - Get app configuration
- `GET /api/subreddit/:name` - Get subreddit info

## Project Structure

```
reddit-keyword-search/
├── server.js           # Express server
├── redditApi.js        # Reddit API client (OAuth2)
├── config.json         # App configuration
├── package.json        # Dependencies
├── .env               # Environment variables (create this)
├── public/
│   ├── index.html     # Frontend HTML
│   ├── app.js         # Frontend JavaScript
│   └── styles.css     # Styling
└── README.md          # This file
```

## Use Cases

- **Market Research**: Find what problems people are discussing
- **Product Validation**: See if your solution addresses real needs
- **Content Ideas**: Discover trending topics in your niche
- **Customer Discovery**: Understand pain points in communities
- **Competitive Analysis**: See what alternatives people mention

## Rate Limits

Reddit's API has rate limits:

- **OAuth**: 60 requests per minute
- This app uses OAuth2 client credentials flow
- Implement delays between requests for multiple keywords

## Development

### Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **API**: Reddit OAuth2 API
- **HTTP Client**: Axios

### API Documentation

- Official API: https://www.reddit.com/dev/api/
- OAuth2: https://github.com/reddit/reddit/wiki/OAuth2
- Search endpoint: https://www.reddit.com/dev/api/#GET_search

## Troubleshooting

### Authentication Errors

- Verify your client ID and secret are correct
- Check that your user agent is properly formatted
- Ensure you're using the correct OAuth2 flow (client credentials)

### No Results

- Try different keywords or time filters
- Check if the subreddit name is spelled correctly
- Verify the subreddit exists and is public

### API Rate Limits

- Reduce the number of concurrent searches
- Implement delays between requests
- Use larger limit values to get more results per request

## License

MIT

## Contributing

Pull requests welcome! Please ensure your code follows the existing style and includes appropriate documentation.

## Disclaimer

This application uses Reddit's API and must comply with:

- [Reddit API Rules](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki)
- [Reddit User Agreement](https://www.reddit.com/help/useragreement)
- [Reddit API Terms](https://www.reddit.com/wiki/api)

Please use responsibly and respect rate limits.

## Features

- Search Reddit posts and comments for specific keywords
- Filter by subreddit, time range, and sorting options
- View results with links to original posts
- Analyze potential customer pain points and discussions

## Getting Reddit API Credentials

Follow these steps to get your Reddit API credentials:

1. **Log in to Reddit**

   - Go to https://www.reddit.com and log in with your account
   - If you don't have an account, create one first

2. **Create an App**

   - Navigate to https://www.reddit.com/prefs/apps
   - Scroll down and click "create another app..." or "are you a developer? create an app..."

3. **Fill in the App Details**

   - **Name**: Give your app a name (e.g., "Keyword Search Tool")
   - **App type**: Select "script"
   - **Description**: Optional, describe what your app does
   - **About URL**: Leave blank or add your website
   - **Redirect URI**: Enter `http://localhost:3000` (required even though we don't use it)
   - Click "create app"

4. **Get Your Credentials**

   - After creating the app, you'll see it listed
   - **Client ID**: The string under your app name (looks like: `AbCdEf123456`)
   - **Client Secret**: The string labeled "secret" (looks like: `aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`)

5. **Save Your Credentials**
   - Copy `.env.example` to `.env`
   - Add your credentials to the `.env` file:
     ```
     REDDIT_CLIENT_ID=your_client_id_here
     REDDIT_CLIENT_SECRET=your_client_secret_here
     REDDIT_USER_AGENT=MyApp/1.0
     ```

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up your environment variables:

   ```bash
   cp .env.example .env
   # Then edit .env with your Reddit API credentials
   ```

3. Configure your keywords in `config.json`

## Usage

1. Start the server:

   ```bash
   npm start
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:3000
   ```

3. Enter keywords to search Reddit and view results

## Configuration

Edit `config.json` to customize:

- Default search keywords
- Default subreddits to search
- Time ranges and result limits

## API Rate Limits

Reddit's API has rate limits:

- 60 requests per minute for authenticated requests
- Be mindful of these limits when running searches

## License

MIT
