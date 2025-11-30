# TimeOS Ultimate - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 Default Credentials

**Admin Login:**
- Access Code: `admin123`

## 📋 Common Tasks

### 1. First Time Setup

```bash
# 1. Clone repository
git clone https://github.com/wahidullahr/Time_tracker.git
cd Time_tracker

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Firebase and Gemini credentials

# 4. Start development
npm run dev
```

### 2. Creating Your First Employee

1. Login as admin (`admin123`)
2. Go to "Companies" tab
3. Add a company (e.g., "Acme Corp")
4. Go to "Employees" tab
5. Click "Add Employee"
6. Fill form:
   - Name: "John Doe"
   - Title: "Senior Consultant"
   - Check "Acme Corp"
7. Note the 6-digit access code
8. Share code with employee

### 3. Employee Time Tracking Workflow

```
Login → Select Company → Enter Description → [Optional: AI Enhance] → Start Timer → Work → Stop Timer
```

### 4. Generating Reports

1. Login as admin
2. Go to "Reports" tab
3. Select company filter (or "All Companies")
4. Click "AI Summary" for insights
5. Click "Export CSV" for data file

## 🎨 Customization Guide

### Changing Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#3B82F6',    // Change blue
      success: '#10B981',    // Change green
      danger: '#EF4444',     // Change red
    }
  }
}
```

### Modifying Timer Intervals

Edit `src/components/EmployeeTracker.jsx`:

```javascript
// Line 45 - Change from 100ms to 1000ms (1 second)
intervalRef.current = setInterval(() => {
  // ...
}, 1000); // Change this value
```

### Adding Custom Fields to Time Entries

1. Update Firestore schema in `src/services/firebase.js`
2. Add field to `createTimeEntry()` function
3. Update `EditEntryModal.jsx` to include field
4. Modify CSV export in `src/utils/csvExport.js`

## 🔧 Troubleshooting

### Issue: "Firebase not initialized"
**Solution:**
```bash
# Check .env file exists and has correct values
cat .env

# Restart dev server
# Press Ctrl+C to stop
npm run dev
```

### Issue: "Gemini API error"
**Solution:**
1. Verify `VITE_GEMINI_API_KEY` in `.env`
2. Check quota at https://makersuite.google.com
3. Try again in 1 minute (rate limit)

### Issue: Timer not persisting
**Solution:**
```javascript
// Open browser console (F12)
localStorage.clear()
location.reload()
```

### Issue: Build fails
**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (not supported)

## ⚡ Performance Tips

### Optimizing Firestore Reads
```javascript
// Instead of real-time listeners
// Use one-time fetches
const data = await getDocs(collection);
```

### Reducing Bundle Size
```javascript
// Use specific imports
import { Play, Square } from 'lucide-react';

// Instead of
import * as Icons from 'lucide-react';
```

### Improving Load Time
```javascript
// Add to vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        firebase: ['firebase/app', 'firebase/firestore'],
        react: ['react', 'react-dom'],
      }
    }
  }
}
```

## 🎯 Feature Flags

### Disable AI Features
In `src/components/EmployeeTracker.jsx`:
```javascript
// Line 256 - Comment out AI button
{/* <button onClick={handleEnhanceDescription} ... /> */}
```

In `src/components/AdminDashboard.jsx`:
```javascript
// Line 410 - Comment out AI summary button
{/* <button onClick={handleGenerateSummary} ... /> */}
```

### Enable Real-time Updates
In `src/services/firebase.js`:
```javascript
import { onSnapshot } from 'firebase/firestore';

// Replace getDocs with onSnapshot
export const subscribeToTimeEntries = (callback) => {
  return onSnapshot(collection(db, 'time_entries'), (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(entries);
  });
};
```

## 📊 Analytics Integration

### Add Google Analytics

1. Install package:
```bash
npm install react-ga4
```

2. Initialize in `src/main.jsx`:
```javascript
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
ReactGA.send('pageview');
```

3. Track events:
```javascript
// In components
ReactGA.event({
  category: 'Timer',
  action: 'Start',
  label: companyName
});
```

## 🔐 Security Checklist

- [ ] Configure `.env` with real credentials
- [ ] Never commit `.env` to Git
- [ ] Enable Firestore security rules
- [ ] Set up Firebase App Check (production)
- [ ] Enable HTTPS only (production)
- [ ] Monitor API usage regularly
- [ ] Rotate API keys quarterly
- [ ] Set up billing alerts

## 📝 Development Workflow

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... code ...

# 3. Test locally
npm run dev
# Manual testing

# 4. Build and verify
npm run build
npm run preview

# 5. Commit
git add .
git commit -m "feat: Add new feature"

# 6. Push
git push origin feature/new-feature

# 7. Create Pull Request on GitHub
```

### Code Style Guidelines

```javascript
// ✅ Good
const handleSave = async () => {
  try {
    await createTimeEntry(data);
  } catch (error) {
    console.error('Error:', error);
    setError('Failed to save');
  }
};

// ❌ Bad
const handleSave = async () => {
  createTimeEntry(data);  // No error handling
};
```

## 🧪 Testing Examples

### Manual Test Script

```
Test Case 1: Admin Login
1. Open http://localhost:5173
2. Enter "admin123"
3. Click "Sign In"
Expected: Admin Dashboard loads

Test Case 2: Timer Persistence
1. Login as employee
2. Start timer
3. Refresh page (F5)
Expected: Timer continues running

Test Case 3: AI Enhancement
1. Enter description: "fixed css"
2. Click sparkle icon
3. Wait for response
Expected: Professional description appears
```

## 🌐 Deployment Checklist

### Pre-deployment
- [ ] Test all features locally
- [ ] Build without errors
- [ ] Update `.env` with production credentials
- [ ] Test production build locally
- [ ] Review console for warnings

### Vercel Deployment
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Add environment variables in Vercel dashboard
# 5. Redeploy
vercel --prod
```

### Firebase Hosting
```bash
# 1. Install Firebase CLI
npm i -g firebase-tools

# 2. Login
firebase login

# 3. Initialize
firebase init hosting

# 4. Build
npm run build

# 5. Deploy
firebase deploy
```

## 📞 Support & Resources

- **Documentation**: README.md, SETUP.md, PROJECT_STRUCTURE.md
- **GitHub Issues**: https://github.com/wahidullahr/Time_tracker/issues
- **Firebase Docs**: https://firebase.google.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com/docs

## 💡 Tips & Tricks

### Keyboard Shortcuts (in development)
- `h + Enter`: Show Vite help
- `r + Enter`: Restart server
- `u + Enter`: Show server URL
- `o + Enter`: Open in browser
- `q + Enter`: Quit server

### Browser DevTools
- `Ctrl/Cmd + Shift + J`: Open console
- Application tab → Local Storage: View persisted data
- Network tab: Monitor API calls
- React DevTools: Inspect component tree

### Useful Commands
```bash
# Check Firebase CLI version
firebase --version

# List Firebase projects
firebase projects:list

# Check Node/npm versions
node --version
npm --version

# Clear npm cache
npm cache clean --force

# Update all dependencies
npm update
```

## 🎓 Learning Resources

- **React Patterns**: https://reactpatterns.com
- **Firebase Best Practices**: https://firebase.google.com/support/guides
- **Tailwind Components**: https://tailwindui.com
- **Git Workflow**: https://www.atlassian.com/git/tutorials

---

**Keep this guide handy for quick reference during development!**
