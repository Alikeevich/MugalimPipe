# 🔒 MugalimPipe - Secure AI Teacher Performance Analyzer

## 🛡️ Security Features

This application uses **Vercel Serverless Functions** to securely handle all API keys and sensitive operations:

### 🔐 API Keys Security
- ✅ **Yandex SpeechKit API Key** - Moved to server-side Vercel Function
- ✅ **Google Gemini AI API Key** - Moved to server-side Vercel Function
- ✅ **No API keys in frontend code** - All sensitive data protected
- ✅ **Environment variables** - Stored securely in Vercel dashboard

### 🚀 Serverless Functions

#### `/api/yandex-transcribe.ts`
- Handles all Yandex SpeechKit API calls
- Supports multilingual transcription
- Detects filler words ("эм", "ах", "ну", etc.)
- Auto-language detection for CIS region

#### `/api/gemini-analyze.ts`
- Handles all Google Gemini AI API calls
- Generates professional reports
- Creates personalized recommendations
- Supports Russian and Kazakh languages

### 🔧 Deployment Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables in Vercel dashboard:**
   - `YANDEX_API_KEY` - Your Yandex SpeechKit API key
   - `YANDEX_FOLDER_ID` - Your Yandex Cloud folder ID
   - `GEMINI_API_KEY` - Your Google Gemini AI API key

3. **Deploy to Vercel:**
   ```bash
   npm run build
   vercel --prod
   ```

4. **Functions automatically available at:**
   - `/api/yandex-transcribe`
   - `/api/gemini-analyze`

### 🎯 Features

- **🎤 Multilingual Speech Recognition** - Russian, Kazakh, English
- **🤖 AI-Powered Analysis** - Google Gemini professional reports  
- **📊 Comprehensive Scoring** - 1000-point evaluation system
- **🔍 Filler Words Detection** - Identifies speech hesitations
- **🎥 Video Analysis** - MediaPipe pose, gesture, facial analysis

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
2. **Server-Side Processing** - All sensitive operations on Vercel edge
3. **CORS Protection** - Proper headers and origin validation
4. **Environment Isolation** - Development and production keys separated
5. **Audit Trail** - All API calls logged on server side

This architecture ensures that your API keys remain secure while providing full functionality to end users.

### 📝 Local Development

For local development without API keys, the application will use mock data for transcription and AI analysis.
