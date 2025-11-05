# Quick Vercel Setup Guide

## 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

## 2. Set Environment Variables in Vercel Dashboard

Go to your project settings and add:

```
YANDEX_API_KEY=your_actual_key
YANDEX_FOLDER_ID=your_actual_folder_id
GEMINI_API_KEY=your_actual_key
```

## 3. Deploy

### Option A: GitHub Auto-Deploy (Recommended)
1. Push to GitHub
2. Import to Vercel
3. Vercel will auto-deploy on every push

### Option B: Manual Deploy
```bash
vercel --prod
```

## 4. Verify Deployment

Check these URLs after deployment:

**Main App:**
```
https://your-project.vercel.app
```

**API Test (Yandex):**
```bash
curl -X POST https://your-project.vercel.app/api/yandex-transcribe \
  -H "Content-Type: application/json" \
  -d '{"action":"test-connection"}'
```

**API Test (Gemini):**
```bash
curl -X POST https://your-project.vercel.app/api/gemini-analyze \
  -H "Content-Type: application/json" \
  -d '{"action":"test-connection"}'
```

## 5. Expected Response

Both endpoints should return:
```json
{
  "success": true,
  "message": "... connection successful"
}
```

## Troubleshooting

### 404 on /api/* routes
- Check `api/` folder exists
- Verify `.ts` files are present
- Redeploy

### Build fails
```bash
# Test locally first
npm run build

# If successful, commit and push
git add .
git commit -m "Fix build"
git push
```

### Functions timeout
- Hobby plan: 10s limit
- Upgrade to Pro for 60s

## Success!

Your app is now running on Vercel with:
- Secure API keys (server-side only)
- Global CDN
- Automatic HTTPS
- Preview deployments on PRs
