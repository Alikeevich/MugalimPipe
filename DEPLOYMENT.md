# Deployment Guide for Vercel

## Quick Start

1. Push your code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

## Detailed Instructions

### Step 1: Prepare Your Repository

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." -> "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it as a Vite project

### Step 3: Configure Environment Variables

In Vercel dashboard, go to your project settings:
1. Click "Settings" tab
2. Click "Environment Variables" in the sidebar
3. Add the following variables:

**Required for Yandex SpeechKit:**
- `YANDEX_API_KEY` - Your Yandex Cloud API key
- `YANDEX_FOLDER_ID` - Your Yandex Cloud folder ID

**Required for Google Gemini AI:**
- `GEMINI_API_KEY` - Your Google AI Studio API key

**Note:** Without these keys, the app will use mock data for demonstrations.

### Step 4: Deploy

Click "Deploy" button. Vercel will:
1. Install dependencies
2. Build the project
3. Deploy serverless functions to `/api/*`
4. Deploy static files

## Getting API Keys

### Yandex SpeechKit API

1. Go to [Yandex Cloud Console](https://console.cloud.yandex.ru)
2. Create a service account
3. Assign role `ai.speechkit-stt.user`
4. Create API key
5. Copy API key and Folder ID

### Google Gemini AI API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API key"
3. Create new API key
4. Copy the key

## Vercel Serverless Functions

The following API endpoints will be automatically created:

- `https://your-app.vercel.app/api/yandex-transcribe` - Speech recognition
- `https://your-app.vercel.app/api/gemini-analyze` - AI analysis

## Troubleshooting

### 404 Error on API Routes

- Ensure `api/` folder exists in your repository
- Check that TypeScript files are properly compiled
- Verify environment variables are set

### Build Fails

```bash
# Test build locally
npm run build

# If successful, push and redeploy
```

### Functions Timeout

Vercel Hobby plan has 10s timeout for functions. For longer videos:
- Use Vercel Pro plan (60s timeout)
- Or optimize video processing

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull

# Run dev server
vercel dev
```

## Production URL

After deployment, your app will be available at:
```
https://your-project-name.vercel.app
```
