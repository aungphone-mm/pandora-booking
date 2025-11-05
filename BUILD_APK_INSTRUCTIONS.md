# 📱 Building Android APK for Pandora Beauty Salon

## Important Note About API Routes

Your app uses **API routes** (`/api/*`) which require a server to run. There are **2 options** for building the mobile app:

---

## Option 1: Hybrid App (Recommended) ✅

**Use the mobile app as a native wrapper that connects to your live web server.**

### Advantages:
- ✅ Full functionality including analytics
- ✅ Easy updates (update server, app updates automatically)
- ✅ No code changes needed
- ✅ Smaller APK size

### Setup Steps:

#### Step 1: Deploy your web app to a server
```bash
# Deploy to Vercel (recommended - free tier available)
npm install -g vercel
vercel --prod

# You'll get a URL like: https://pandora-booking.vercel.app
```

Or deploy to:
- **Netlify**: https://www.netlify.com/
- **Railway**: https://railway.app/
- **Heroku**: https://www.heroku.com/
- **Your own VPS**

#### Step 2: Update Capacitor config
Edit `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pandora.booking',
  appName: 'Pandora Beauty Salon',
  webDir: 'out',

  server: {
    // 👇 Replace with your deployed URL
    url: 'https://pandora-booking.vercel.app',
    cleartext: true
  }
};

export default config;
```

#### Step 3: Sync and open Android Studio
```bash
npx cap sync android
npx cap open android
```

#### Step 4: Build APK in Android Studio
1. Open Android Studio
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Wait for build to complete
4. Click "locate" to find your APK
5. APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Option 2: Standalone App (More Complex) ⚠️

**Convert API routes to direct Supabase calls in components.**

This requires code refactoring:
1. Remove all `/api/*` routes
2. Call Supabase directly from components
3. Move analytics logic to client-side

### Time Required: 2-3 days of development

---

## 🚀 Quick Build Commands (After deploying server)

```bash
# 1. Deploy your server first (do this once)
vercel --prod

# 2. Update capacitor.config.ts with your URL

# 3. Build and open Android Studio
npx cap sync android
npx cap open android

# 4. In Android Studio: Build > Build APK
```

---

## 📦 Build Commands Reference

```bash
# Sync web code to native platforms
npm run cap:sync

# Open Android Studio
npm run cap:open:android

# Build and open in one command
npm run android

# Run on connected device/emulator
npm run cap:run:android
```

---

## 🔧 Android Studio Requirements

### Installation:
1. Download Android Studio: https://developer.android.com/studio
2. Install Android SDK (API 33 or higher recommended)
3. Install Java JDK 11 or higher

### Environment Variables (optional):
```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 📱 Testing Your APK

### Install on Android Device:

1. **Enable Developer Mode:**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times

2. **Enable USB Debugging:**
   - Go to Settings > Developer Options
   - Enable "USB Debugging"

3. **Install APK:**
   ```bash
   # Via ADB
   adb install android/app/build/outputs/apk/debug/app-debug.apk

   # Or transfer APK to phone and install directly
   ```

### Test on Emulator:
```bash
# Run on emulator
npm run cap:run:android
```

---

## 🎨 Customizing Your App

### Change App Icon:
1. Create icons in these sizes:
   - mdpi: 48x48
   - hdpi: 72x72
   - xhdpi: 96x96
   - xxhdpi: 144x144
   - xxxhdpi: 192x192

2. Place in: `android/app/src/main/res/mipmap-*/ic_launcher.png`

### Change App Name:
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Pandora Beauty Salon</string>
```

### Change Splash Screen:
Edit `android/app/src/main/res/values/styles.xml`

---

## 🔐 Building Release APK (For Production)

### Step 1: Generate Signing Key
```bash
cd android
./gradlew signingReport

# Or generate new keystore
keytool -genkey -v -keystore pandora-release-key.keystore \
  -alias pandora -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure Signing
Edit `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('pandora-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'pandora'
            keyPassword 'your-password'
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt')
        }
    }
}
```

### Step 3: Build Release APK
```bash
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📊 APK Size Optimization

### Current estimated size: ~15-25 MB

### To reduce size:
1. Enable ProGuard (minification)
2. Use Android App Bundle (.aab) instead of APK
3. Remove unused resources
4. Optimize images

```bash
# Build App Bundle (smaller download for users)
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## 🐛 Common Issues

### Issue: "SDK location not found"
**Solution:** Create `android/local.properties`:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Issue: "Gradle build failed"
**Solution:**
```bash
cd android
./gradlew clean
./gradlew build
```

### Issue: "App is blank/white screen"
**Solution:** Make sure server URL is correct in `capacitor.config.ts`

### Issue: "Network request failed"
**Solution:**
- Check internet permission in `android/app/src/main/AndroidManifest.xml`
- Ensure `cleartext: true` in capacitor.config.ts

---

## 📤 Publishing to Google Play Store

### Requirements:
- Google Play Developer Account ($25 one-time fee)
- Privacy Policy URL
- App screenshots (at least 2)
- App description

### Steps:
1. Create account at https://play.google.com/console
2. Create new application
3. Upload app-release.aab
4. Fill in store listing
5. Set up content rating
6. Set pricing & distribution
7. Submit for review

**Review time:** Usually 1-3 days

---

## 🎯 Next Steps

1. ✅ Deploy web app to Vercel/Netlify (get URL)
2. ✅ Update `capacitor.config.ts` with server URL
3. ✅ Install Android Studio
4. ✅ Run `npx cap sync android`
5. ✅ Run `npx cap open android`
6. ✅ Build APK in Android Studio
7. ✅ Test APK on your device

---

## 💡 Pro Tips

1. **Use Vercel for hosting**: Free tier, automatic deployments
2. **Test on real device**: Emulators can be slow
3. **Enable auto-updates**: Users get updates without reinstalling
4. **Monitor with Firebase**: Add analytics and crash reporting
5. **Test offline behavior**: Handle network failures gracefully

---

## 🆘 Need Help?

Check these resources:
- Capacitor Docs: https://capacitorjs.com/docs
- Android Studio: https://developer.android.com/studio
- Vercel Deployment: https://vercel.com/docs

---

**Generated:** 2025-10-31
**Project:** Pandora Beauty Salon Booking System
**Version:** 2.0.0
