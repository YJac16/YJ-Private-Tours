# KhayrCape Experiences

Full-stack web application for a private, Muslim-friendly tour guide business in Cape Town.

- **Frontend:** React, Vite, Tailwind CSS, React Router, Axios, React Icons  
- **Backend:** Node.js, Express, CORS, dotenv, Nodemailer, body-parser  

Project structure:

```
/
├── client/   (frontend — Vite + React)
└── server/   (backend — Express API)
```

---

## Setup

### 1. Backend (server)

```bash
cd server
npm install
```

Create a `.env` file in `server/` (see `server/.env` for placeholders):

- `PORT` — server port (default `5000`)
- `BUSINESS_EMAIL` — where enquiries are sent
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — email (Nodemailer)

For real email, use your SMTP provider (e.g. Gmail with App Password, SendGrid). The default `.env` uses placeholder SMTP; replace with real values for production.

Start the server:

```bash
npm run dev
# or: npm start
```

API runs at `http://localhost:5000`. Health check: `GET /health`. Enquiries: `POST /api/enquiry`.

### 2. Frontend (client)

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. In development, Vite proxies `/api` to the backend, so the form submits to the same origin.

### 3. Run both

From project root:

- Terminal 1: `cd server && npm run dev`
- Terminal 2: `cd client && npm run dev`

Then open `http://localhost:5173` in your browser.

---

## Environment variables

### Server (`server/.env`)

| Variable         | Description                          |
|------------------|--------------------------------------|
| `PORT`           | Server port (default `5000`)         |
| `FRONTEND_URL`   | Frontend origin for CORS (production)|
| `BUSINESS_EMAIL` | Recipient of enquiry emails          |
| `SMTP_*`         | Nodemailer SMTP config               |

### Client (production)

Set `VITE_API_URL` to your backend URL (e.g. `https://your-api.onrender.com`) so the enquiry form posts to the correct API. In dev, the Vite proxy is used and this is optional.

---

## Deployment

### Railway (recommended — single service)

From the **project root** (not `client` or `server`):

- **Build command:** `npm run build`  
  (installs and builds client, installs server deps)
- **Start command:** `npm start`  
  (runs Express; serves the built client and API on `PORT`)

Set env vars in Railway: `PORT` (set automatically), `BUSINESS_EMAIL`, `SMTP_*`, and any `FRONTEND_URL` if needed. No `VITE_API_URL` needed — frontend and API are on the same origin.

### Other options

- **Frontend (Vercel):** Connect the repo, set root to `client`, build command `npm run build`, output directory `dist`. Set `VITE_API_URL` to your backend URL.
- **Backend (Render / Fly.io):** Set root to `server`, start command `npm start`. Add env vars (`PORT`, `BUSINESS_EMAIL`, `SMTP_*`, `FRONTEND_URL`). Ensure `FRONTEND_URL` matches your frontend URL for CORS.

---

## API

### `POST /api/enquiry`

Submit an enquiry from the contact form.

**Body (JSON):**

- `name` (string, required)
- `email` (string, required)
- `tourInterest` (string, required)
- `phone` (string, optional)
- `message` (string, optional)

**Responses:**

- `200` — Enquiry sent; backend emails `BUSINESS_EMAIL`.
- `400` — Validation error (e.g. missing name/email/tourInterest).
- `500` — Server or email error.

---

## License

Private use. All rights reserved.
