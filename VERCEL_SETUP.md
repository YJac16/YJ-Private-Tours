# Deploy KhayrCape Experiences to Vercel

This guide gets the **frontend** (the website visitors see) live on Vercel. The **backend** (enquiry form API) must be deployed separately (e.g. Render, Railway) and its URL is set in Vercel as an environment variable.

---

## Do this once (about 2 minutes)

1. **Push your code** to GitHub (or GitLab/Bitbucket) if you haven’t already.
2. Open **[vercel.com/new](https://vercel.com/new)** and sign in with GitHub.
3. **Import** your repository (e.g. `YJ Private Tours` or your repo name).
4. Before clicking Deploy, set **Root Directory** to **`client`**:
   - Click **Edit** next to “Root Directory”.
   - Enter **`client`** and confirm.
5. (Optional) Add **Environment Variable**: name **`VITE_API_URL`**, value = your backend URL (only needed for the enquiry form).
6. Click **Deploy**. Your site will be live at `https://your-project.vercel.app`.

**Or use the CLI:** run `npx vercel login`, then from the repo root run **`npm run deploy`** to deploy the client to Vercel.

---

## What this app is

- **Repo:** Monorepo with two parts:
  - **`client/`** — Frontend: React + Vite + Tailwind. This is what you deploy to **Vercel**.
  - **`server/`** — Backend: Node + Express (enquiry form API). Deploy this to **Render**, **Railway**, or **Fly.io** and use its URL in the frontend env.

- **Vercel** only deploys the **client**. You point Vercel at the `client` folder and use the settings below.

---

## Vercel settings (step-by-step)

### 1. Connect the repo

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub/GitLab/Bitbucket).
2. Click **Add New…** → **Project**.
3. Import your repository (e.g. the one containing `client` and `server`).

### 2. Configure the project

When Vercel asks for settings, use:

| Setting | Value |
|--------|--------|
| **Root Directory** | `client` |
| **Framework Preset** | Vite (or leave as Auto) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

- **Root Directory** is the most important: set it to **`client`** so Vercel builds the frontend, not the repo root.
- If you don’t see “Root Directory”, click **Configure** or **Edit** next to the project and set it under **Root Directory**.

### 3. Environment variables (frontend)

The site uses one optional variable for production:

| Name | Value | Required? |
|------|--------|-----------|
| `VITE_API_URL` | Full URL of your **backend API** (no trailing slash), e.g. `https://your-app.onrender.com` | Only if you use the enquiry form |

- **Without `VITE_API_URL`:** The enquiry form will try to call `/api` on the same domain, which fails on Vercel (there is no API there). The rest of the site will work.
- **With `VITE_API_URL`:** Set it to your deployed backend URL so the form submits to your real API.

**In Vercel:**

1. Project → **Settings** → **Environment Variables**.
2. Add:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://your-backend-url.com` (your actual backend URL)
   - **Environment:** Production (and Preview if you want).

### 4. Deploy

Click **Deploy**. Vercel will run `npm install` and `npm run build` inside `client` and serve the `dist` folder. You’ll get a URL like `https://your-project.vercel.app`.

---

## Summary: what goes where

| Item | Value |
|------|--------|
| **What you deploy on Vercel** | Frontend only (`client` folder) |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Env var for production API** | `VITE_API_URL` = your backend URL |

---

## Backend (to make the form work online)

1. Deploy the **server** to Render / Railway / Fly.io (see main README).
2. Set the backend URL in Vercel as **`VITE_API_URL`** (e.g. `https://your-api.onrender.com`).
3. On the backend, set **`FRONTEND_URL`** to your Vercel URL (e.g. `https://your-project.vercel.app`) for CORS.

---

## If local build fails (EPERM / Permission denied)

If you see **Permission denied** when building locally (often on Windows when something is using the `dist` folder):

1. Close any app that might be using `client/dist` (e.g. File Explorer, another terminal, VS Code preview).
2. Delete the `dist` folder manually:  
   `client/dist` (or run from `client`: `npx rimraf dist`).
3. Run again:  
   `cd client && npm run build`.

The build script now runs `rimraf dist` before building, which usually avoids this. If it still fails, something is still locking files in `dist`.
