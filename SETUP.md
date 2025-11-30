# Firebase & Gemini API Setup Guide

## Step 1: Firebase Setup

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `timeos-ultimate`
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Enable Firestore Database
1. In Firebase Console, click "Firestore Database"
2. Click "Create Database"
3. Select "Start in production mode"
4. Choose a location (closest to your users)
5. Click "Enable"

### Enable Authentication
1. In Firebase Console, click "Authentication"
2. Click "Get Started"
3. Click "Sign-in method" tab
4. Click "Anonymous"
5. Toggle "Enable"
6. Click "Save"

### Get Firebase Configuration
1. In Firebase Console, click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon (`</>`)
4. Register app name: `TimeOS`
5. Copy the configuration values:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

### Configure Firestore Security Rules (Optional but Recommended)
1. In Firestore Database, click "Rules" tab
2. Replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - read/write for authenticated users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Companies collection - read/write for authenticated users
    match /companies/{companyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Time entries - read/write for authenticated users
    match /time_entries/{entryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

## Step 2: Google Gemini API Setup

### Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select "Create API key in new project" or choose existing project
5. Copy your API key (starts with `AIza...`)

### Important Notes
- Free tier includes: 60 requests per minute
- Keep your API key secure
- Do not commit it to Git

## Step 3: Configure Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` and paste your credentials:
```env
# Firebase Configuration (from Step 1)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=timeos-ultimate.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=timeos-ultimate
VITE_FIREBASE_STORAGE_BUCKET=timeos-ultimate.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Google Gemini API (from Step 2)
VITE_GEMINI_API_KEY=AIzaSyD...
```

3. Save the file

4. **NEVER** commit `.env` to Git (it's already in `.gitignore`)

## Step 4: Test the Application

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:5173

3. Login with admin code: `admin123`

4. Create a test company:
   - Go to "Companies" tab
   - Add "Test Company"

5. Create a test employee:
   - Go to "Employees" tab
   - Click "Add Employee"
   - Fill in details
   - Assign "Test Company"
   - Note the generated access code

6. Logout and test employee login with the access code

7. Test the timer:
   - Select "Test Company"
   - Enter a description
   - Click sparkle icon to test AI enhancement
   - Start and stop the timer

8. Test reports:
   - Login as admin
   - Go to "Reports" tab
   - Click "AI Summary" to test Gemini integration
   - Click "Export CSV" to download data

## Troubleshooting

### Firebase Not Connecting
- Check console for errors
- Verify all credentials in `.env`
- Ensure Anonymous auth is enabled in Firebase Console
- Check Firestore database is created

### Gemini API Errors
- Verify API key is correct
- Check you haven't exceeded free tier quota (60 req/min)
- Ensure API key has appropriate permissions
- Check network connection

### Timer Not Persisting
- Clear localStorage: `localStorage.clear()`
- Check browser console for errors
- Ensure cookies/localStorage are enabled

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Production Deployment

### Environment Variables in Production
When deploying to Vercel/Netlify/Firebase Hosting:

1. Add all environment variables in the hosting dashboard
2. Do NOT include `.env` file in deployment
3. Variables must start with `VITE_` to be accessible

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project
# Build directory: dist
# Single-page app: Yes
# Automatic builds: No

npm run build
firebase deploy
```

## Security Best Practices

1. ✅ Use environment variables for all API keys
2. ✅ Enable Firestore security rules
3. ✅ Never commit `.env` to Git
4. ✅ Rotate API keys regularly
5. ✅ Monitor Firebase usage for anomalies
6. ✅ Set up Firebase App Check (optional, for production)
7. ✅ Enable Firebase billing alerts

## Cost Estimates (Free Tiers)

### Firebase
- **Firestore**: 50K reads/day, 20K writes/day (FREE)
- **Authentication**: Unlimited anonymous sign-ins (FREE)
- **Storage**: 1GB (FREE)

### Google Gemini API
- **Free Tier**: 60 requests per minute
- **Rate Limits**: Generous for small teams

For a team of 10 employees:
- Estimated Firestore reads/day: ~500
- Estimated Gemini requests/day: ~50
- **Total Cost**: $0/month (well within free tier)

## Next Steps

1. ✅ Complete Firebase setup
2. ✅ Get Gemini API key
3. ✅ Configure `.env` file
4. ✅ Test the application
5. ✅ Create your first employees
6. ✅ Start tracking time!

For support, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- Project README.md
