# the-chart

A 3D "who's connected to who" web, with data shared across everyone who opens the link (not per-browser).

## Deploy (Vercel)

1. Import this repo into Vercel (New Project -> Import Git Repository).
2. In the project's **Storage** tab, add the **Upstash for Redis** integration and connect it to this project. That automatically sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables the API needs.
3. Redeploy (Vercel usually triggers this for you after adding storage; if not, trigger a redeploy from the Deployments tab).
4. Open the deployed URL — everyone who visits it reads and writes the same connection list.

## Access / passwords

The site is locked behind a single password field on load:

- Entering the **regular password** unlocks view-only access — the chart is visible, but the whole control panel (add/edit, export/import, clear, people/connections lists) is hidden.
- Entering the **admin password** in that same field unlocks the full panel with editing.

This is enforced both in the UI and on the server (`api/connections.js` rejects reads without a valid password and rejects writes without the admin one), so it's not just a UI hide.

Defaults (used if you don't set anything): regular password is `password`, admin password is `adminpassword`.

**To change the passwords:**

1. In the Vercel dashboard, open this project → **Settings** → **Environment Variables**.
2. Add a variable: Key = `APP_PASSWORD`, Value = whatever you want the regular password to be. Leave environments as Production + Preview (+ Development if you want) checked, then Save.
3. Add another: Key = `APP_ADMIN_PASSWORD`, Value = your new admin password. Save.
4. Go to **Deployments** → latest deployment → **⋯** → **Redeploy** (environment variable changes don't apply automatically — they only take effect on the next deployment).

Once redeployed, the old defaults stop working and only your new values do.

## Import / Export

The admin panel's **Export** button downloads the current connection list as `connections.json`. **Import** loads a JSON file back in, adding to whatever's already there (use **Clear all** first for a clean slate).

The expected format is a JSON array of two-item arrays — each pair is one connection:

```json
[
  ["Christina", "Engel"],
  ["Engel", "Marcus"],
  ["Christina", "Priya"],
  ["Priya", "Shane"],
  ["Shane", "Carmen"]
]
```

Notes on parsing: extra items beyond the first two in a pair are ignored, and duplicate or reversed-duplicate pairs (e.g. `["A","B"]` and `["B","A"]`) are automatically skipped. The easiest way to get a valid starting file is to click Export first and edit that.

## Structure

- `index.html` — the 3D visualization, control panel, and password gate (Three.js).
- `api/connections.js` — serverless function (GET/POST) that reads and writes the shared connection list in Redis; requires the password header on every request.
- `api/auth.js` — serverless function that checks a submitted password and reports whether it grants `user` or `admin` access.

## Local development

`vercel dev` will run both the static site and the API function locally, as long as the same Redis env vars are available in a `.env.local` file.
