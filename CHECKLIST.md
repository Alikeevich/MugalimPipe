# Vercel Deployment Checklist

## Pre-Deployment

- [x] Netlify Functions converted to Vercel Serverless Functions
- [x] Updated API URLs from `/.netlify/functions/*` to `/api/*`
- [x] Removed `@netlify/functions` dependency
- [x] Added `@vercel/node` dependency
- [x] Created `vercel.json` configuration
- [x] Fixed `axios.isAxiosError` error in client code
- [x] Added data validation in `ScoringService.ts`
- [x] Build succeeds without errors
- [x] Removed `netlify.toml` and `netlify/` folder
- [x] Updated README.md with Vercel instructions

## Deployment Steps

### 1. Prepare Repository
- [ ] Commit all changes
- [ ] Push to GitHub main branch
- [ ] Verify all files are pushed

### 2. Vercel Setup
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Add New Project"
- [ ] Import your GitHub repository
- [ ] Vercel auto-detects Vite framework

### 3. Environment Variables
Go to Project Settings > Environment Variables and add:

- [ ] `YANDEX_API_KEY` - Your Yandex SpeechKit API key
- [ ] `YANDEX_FOLDER_ID` - Your Yandex Cloud folder ID
- [ ] `GEMINI_API_KEY` - Your Google Gemini AI API key

**Get API Keys:**
- Yandex: [console.cloud.yandex.ru](https://console.cloud.yandex.ru)
- Gemini: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 4. Deploy
- [ ] Click "Deploy" button in Vercel
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check deployment logs for errors

### 5. Verification
- [ ] Visit `https://your-project.vercel.app`
- [ ] Test video upload functionality
- [ ] Check browser console for errors
- [ ] Test API endpoints:

```bash
# Test Yandex endpoint
curl -X POST https://your-project.vercel.app/api/yandex-transcribe \
  -H "Content-Type: application/json" \
  -d '{"action":"test-connection"}'

# Test Gemini endpoint
curl -X POST https://your-project.vercel.app/api/gemini-analyze \
  -H "Content-Type: application/json" \
  -d '{"action":"test-connection"}'
```

Expected responses:
```json
{"success": true, "message": "...connection successful"}
```

## Post-Deployment

### Testing
- [ ] Upload test video (10-15 minutes)
- [ ] Verify video analysis completes
- [ ] Check all 6 analysis steps run
- [ ] Review generated AI report
- [ ] Test multilingual transcription
- [ ] Verify filler words detection
- [ ] Test results dashboard

### Performance
- [ ] Page loads in < 3 seconds
- [ ] API responses in < 2 seconds
- [ ] Video analysis completes successfully
- [ ] No console errors or warnings

### Security
- [ ] API keys not exposed in browser
- [ ] Check Network tab for API key leaks
- [ ] Verify CORS headers working
- [ ] Test from different domains

## Troubleshooting

### Common Issues

**404 on /api/* routes**
- Check `api/` folder exists in repo
- Verify `.ts` files are present
- Redeploy from Vercel dashboard

**Build fails**
```bash
npm run build  # Test locally
# Fix errors, commit, push
```

**Functions timeout**
- Reduce video size
- Optimize processing
- Upgrade to Vercel Pro (60s timeout)

**API keys not working**
- Verify keys in Vercel dashboard
- Check key format (no quotes needed)
- Redeploy after adding keys

## Success Criteria

- [x] Build completes without errors
- [ ] All API endpoints return 200 OK
- [ ] Video upload works
- [ ] Analysis completes successfully
- [ ] AI reports generate correctly
- [ ] No console errors
- [ ] API keys remain secure

## Rollback Plan

If deployment fails:

```bash
# Option 1: Redeploy previous version
# In Vercel dashboard, find previous deployment
# Click "..." > "Promote to Production"

# Option 2: Revert code changes
git revert HEAD
git push
```

## Documentation

Read these files for more info:
- `VERCEL_SETUP.md` - Quick setup guide
- `DEPLOYMENT.md` - Detailed deployment guide
- `MIGRATION_FROM_NETLIFY.md` - What changed
- `README.md` - Project overview

## Support

Need help?
1. Check Vercel Function logs
2. Review browser console errors
3. Test API endpoints with curl
4. Check environment variables

---

**Status:** Ready for deployment
**Last Updated:** 2025-11-05
**Migration:** Netlify → Vercel (Complete)
