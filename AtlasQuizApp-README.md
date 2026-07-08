# Atlas Quiz — iPhone App Setup

## What this actually is

I can't compile and submit a real App Store app from here — that needs
Xcode, a Mac, and an Apple Developer account ($99/yr), none of which I
have access to. What I *can* build, and what's in this zip, is a
**Progressive Web App (PWA)**: a real, installable app that:

- adds an icon to your Home Screen
- opens full-screen with no Safari address bar
- works offline after the first load
- feels and behaves like a native app

This is the same technique used by things like Twitter Lite, Starbucks,
and many other "add to home screen" apps. The only real limitation
versus a native app: it can't be distributed through the App Store, and
it doesn't get things like push notifications or deep OS integration
(this app doesn't need any of that anyway).

If you do eventually want a real App Store submission, the code is
already in clean React — it would port to React Native with moderate
effort, and I'm happy to help with that if you get there. But you'd
still need a Mac + Xcode + Apple Developer account to actually ship it,
since Apple requires builds to be signed and uploaded from Xcode.

## Step 1 — Put these files somewhere with a real URL

iPhones require an HTTPS URL to install a PWA (won't work by just
double-clicking `index.html`). Easiest free options, no coding needed:

**Netlify Drop (fastest — no account needed)**
1. Go to https://app.netlify.com/drop on your computer
2. Unzip this file, then drag the whole folder onto the page
3. You'll instantly get a URL like `random-name-123.netlify.app`

**GitHub Pages (free, more permanent, needs a GitHub account)**
1. Create a new repo, upload all the unzipped files to it
2. Repo Settings → Pages → set source to the main branch
3. Your app will be live at `yourusername.github.io/repo-name`

**Vercel** works the same way as Netlify if you prefer it.

## Step 2 — Install it on your iPhone

1. Open the URL from Step 1 in **Safari** (must be Safari — Chrome and
   other browsers on iOS can't add PWAs to the Home Screen)
2. Tap the **Share** button (square with an arrow, in the bottom bar)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**

You'll now have an "Atlas Quiz" icon on your home screen. Tapping it
opens the app full-screen, no browser UI. It'll also work with no
internet connection after that first visit.

## Files in this zip

- `index.html` — the app shell
- `app.bundle.js` — the whole quiz app (React + map data), bundled and minified
- `manifest.json` — tells iOS/Android how to install it
- `sw.js` — service worker, caches everything for offline use
- `icons/` — home screen icons at the sizes iOS wants

Keep the folder structure intact when uploading (don't rename or move
files out of `icons/`) since `index.html` and `manifest.json` reference
them by relative path.
