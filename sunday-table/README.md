# 🍽️ Sunday Table — Family Dinner Planner

Real-time multi-user web app for Imran & Rachana, Rahul & Leena, and Iqbal & Zarpheen.

## What it does
- Mark availability for upcoming Sundays — syncs instantly across all devices
- Auto-picks best Sundays based on who's available
- Confirms dinners and rotates hosting fairly
- AI-powered meal suggestions (adapted for 5 kids aged 1–6)
- Meal log — track what you cooked, recipes, ratings, notes
- Works offline, syncs when back online

---

## Setup (takes ~15 minutes)

### Step 1 — Get the code running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — you'll see an error until Firebase is connected.

---

### Step 2 — Create a free Firebase project

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `sunday-table` → click through the prompts
3. On the project dashboard, click the **`</>`** (Web) icon to add a web app
4. Register it with the nickname `sunday-table`
5. **Copy the `firebaseConfig` object** that appears

---

### Step 3 — Paste your Firebase config

Open `src/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",       // ← your real values here
  authDomain:        "sunday-table-xxx.firebaseapp.com",
  projectId:         "sunday-table-xxx",
  storageBucket:     "sunday-table-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
}
```

---

### Step 4 — Enable Firestore database

1. In Firebase Console → left sidebar → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows anyone with the link to read/write — fine for a private family app)
4. Pick any region (e.g. `us-central1`) → click **Enable**

---

### Step 5 — Deploy to Vercel (free, takes 2 minutes)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → sign up free with GitHub
3. Click **"New Project"** → import your repo
4. Vercel auto-detects Vite → click **Deploy**
5. Done! You get a URL like `https://sunday-table-xxx.vercel.app`

**Share that URL with all three families** — everyone opens it on their phone or computer and it stays in sync automatically.

---

## Updating families or rotation

To change family names, emojis, or rotation order, edit `src/constants.js`:

```js
export const FAMILIES = [
  { id: 'f1', name: 'Imran & Rachana',  emoji: '🌙', color: '#c17f5e' },
  { id: 'f2', name: 'Rahul & Leena',    emoji: '🌸', color: '#7a9e7e' },
  { id: 'f3', name: 'Iqbal & Zarpheen', emoji: '⭐', color: '#8b6f9e' },
]
```

**Important:** If you change families after the app has been used, clear the Firestore `config/app` document in the Firebase console so it re-initialises with the new families.

---

## How the data works

| Firestore path       | What's stored                                      |
|----------------------|----------------------------------------------------|
| `config/app`         | Families list, host rotation, last host index      |
| `dinners/YYYY-MM-DD` | Available, declined, confirmed, host, meal log     |

All three families see the same data in real time. Changes appear within ~1 second on all devices.

---

## Bookmark tip

On iPhone/Android: open the URL in Safari/Chrome → Share → **"Add to Home Screen"** — it looks and feels like a native app.
