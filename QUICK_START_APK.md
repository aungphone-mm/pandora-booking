# 🚀 Quick Start: Get Your APK in 5 Steps

## Prerequisites
- Android Studio installed
- Internet connection
- 30 minutes of time

---

## Step 1: Deploy Your Web App (5 minutes) ☁️

Your app needs a server because it uses API routes. Deploy it for FREE:

### Option A: Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

You'll get a URL like: `https://pandora-booking-xxx.vercel.app`

### Option B: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Save your URL! You'll need it in Step 2.**

---

## Step 2: Configure Mobile App (1 minute) 📱

Edit `capacitor.config.ts` and add your server URL:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pandora.booking',
  appName: 'Pandora Beauty Salon',
  webDir: 'out',

  server: {
    url: 'https://YOUR-APP-URL-HERE.vercel.app',  // 👈 Change this!
    cleartext: true
  },

  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ec4899',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff'
    }
  }
};

export default config;
```

---

## Step 3: Sync to Android (1 minute) 🔄

```bash
npx cap sync android
```

This creates the Android project with your web app inside.

---

## Step 4: Open Android Studio (1 minute) 💻

```bash
npx cap open android
```

Or run:
```bash
npm run android
```

Android Studio will open automatically.

---

## Step 5: Build APK (2 minutes) 🔨

In Android Studio:

1. Wait for Gradle sync to finish (bottom status bar)
2. Go to: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Wait for "Build completed" notification
4. Click **"locate"** in the notification
5. Your APK is ready! 🎉

**APK Location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Install on Your Phone 📲

### Method 1: Via File Manager
1. Copy `app-debug.apk` to your phone
2. Open the APK file
3. Allow "Install from unknown sources"
4. Install and enjoy!

### Method 2: Via ADB (if phone is connected)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎉 That's It!

You now have a working Android APK!

### What's Next?

- **Customize App Icon**: See `BUILD_APK_INSTRUCTIONS.md` Section "Customizing Your App"
- **Build Release APK**: For publishing to Play Store
- **Add Push Notifications**: Enhance user engagement
- **Publish to Play Store**: Reach millions of users

---

## 🐛 Troubleshooting

### "App shows white screen"
- Check your server URL in `capacitor.config.ts`
- Make sure your deployed server is working
- Check Android Studio Logcat for errors

### "Build failed in Android Studio"
```bash
cd android
./gradlew clean
./gradlew build
```

### "SDK not found"
Create `android/local.properties`:
```
sdk.dir=/path/to/your/Android/Sdk
```

On Mac: Usually `/Users/YOUR_USERNAME/Library/Android/sdk`
On Windows: Usually `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
On Linux: Usually `/home/YOUR_USERNAME/Android/Sdk`

---

## 📊 Summary

```bash
# Complete workflow in one go:

# 1. Deploy server
vercel --prod

# 2. Edit capacitor.config.ts with your URL

# 3. Sync and open Android Studio
npx cap sync android
npx cap open android

# 4. In Android Studio:
#    Build > Build APK

# 5. Done! 🎉
```

---

## 💰 Cost Breakdown

- ✅ **Vercel Hosting**: FREE (hobby plan)
- ✅ **Capacitor**: FREE (open source)
- ✅ **Android Studio**: FREE
- ✅ **APK Building**: FREE
- ✅ **Installing on own device**: FREE
- 💵 **Google Play Publishing**: $25 one-time (optional)

---

## 📞 Support

Need more details? Check `BUILD_APK_INSTRUCTIONS.md` for:
- Release APK building
- Play Store publishing
- Icon customization
- Advanced configuration
- Troubleshooting guide

---

**Ready to build?** Start with Step 1! 🚀
