# 🔒 MugalimPipe - Secure Teaching Analysis Platform

## 🛡️ Security Features

This application now uses **Netlify Functions** to securely handle all API keys and sensitive operations:

### 🔐 API Keys Security
- ✅ **Yandex SpeechKit API Key** - Moved to server-side Netlify Function
- ✅ **Google Gemini AI API Key** - Moved to server-side Netlify Function  
- ✅ **No API keys in frontend code** - All sensitive data protected
- ✅ **Environment variables** - Stored securely in Netlify dashboard

### 🚀 Serverless Functions

#### `/netlify/functions/yandex-transcribe.ts`
- Handles all Yandex SpeechKit API calls
- Supports multilingual transcription
- Detects filler words ("эм", "ах", "ну", etc.)
- Auto-language detection for CIS region

#### `/netlify/functions/gemini-analyze.ts`  
- Handles all Google Gemini AI API calls
- Generates professional reports
- Creates personalized recommendations
- Supports Russian and Kazakh languages

### 🔧 Deployment Setup

1. **Set Environment Variables in Netlify Dashboard:**
   ```
   YANDEX_API_KEY=your-yandex-api-key
   YANDEX_FOLDER_ID=your-yandex-folder-id
   GEMINI_API_KEY=your-gemini-api-key
   ```

2. **Deploy to Netlify:**
   ```bash
   npm run build
   # Deploy dist/ folder and netlify/functions/ to Netlify
   ```

3. **Functions automatically available at:**
   - `/.netlify/functions/yandex-transcribe`
   - `/.netlify/functions/gemini-analyze`

### 🎯 Features

- **🎤 Multilingual Speech Recognition** - Russian, Kazakh, English
- **🤖 AI-Powered Analysis** - Google Gemini professional reports  
- **📊 Comprehensive Scoring** - 1000-point evaluation system
- **🔍 Filler Words Detection** - Identifies speech hesitations
- **🎥 Video Analysis** - MediaPipe pose, gesture, facial analysis
- **🛡️ Secure Architecture** - No API keys exposed to frontend

### 🌍 Supported Languages

- 🇷🇺 **Russian** (ru-RU) - Primary language
- 🇰🇿 **Kazakh** (kk-KZ) - Full support  
- 🇺🇸 **English** (en-US) - International support
- 🇺🇿 **Uzbek** (uz-UZ) - CIS region
- 🇰🇬 **Kyrgyz** (ky-KG) - CIS region
- 🇹🇯 **Tajik** (tg-TJ) - CIS region
- 🇦🇿 **Azerbaijani** (az-AZ) - CIS region
- 🇦🇲 **Armenian** (hy-AM) - CIS region
- 🇬🇪 **Georgian** (ka-GE) - CIS region

### 🔒 Security Benefits

1. **No API Keys in Build** - Keys never appear in `dist/` folder
2. **Server-Side Processing** - All sensitive operations on Netlify edge
3. **CORS Protection** - Proper headers and origin validation
4. **Environment Isolation** - Development and production keys separated
5. **Audit Trail** - All API calls logged on server side

This architecture ensures that your API keys remain secure while providing full functionality to end users.
