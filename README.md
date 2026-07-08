# the-chart

A 3D "who's connected to who" web, with data shared across everyone who opens the link (not per-browser).

## Deploy (Vercel)

1. Import this repo into Vercel (New Project -> Import Git Repository).
2. In the project's **Storage** tab, add the **Upstash for Redis** integration and connect it to this project. That automatically sets the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables the API needs.
3. Redeploy (Vercel usually triggers this for you after adding storage; if not, trigger a redeploy from the Deployments tab).
4. Open the deployed URL — everyone who visits it reads and writes the same connection list.

## Structure

- `index.html` — the 3D visualization and control panel (Three.js).
- `api/connections.js` — serverless function (GET/POST) that reads and writes the shared connection list in Redis.

## Local development

`vercel dev` will run both the static site and the API function locally, as long as the same Redis env vars are available in a `.env.local` file.
