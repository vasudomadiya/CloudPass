# FilePass26 - Render Deployment Guide

## 🚀 Deployment Architecture

- **Frontend:** Vercel (cloud-pass.vercel.app)
- **Backend:** Render (render.com)

## Deployment Architecture

- **Frontend:** Vercel
- **Backend and file storage:** Render
- **API URL:** `https://filepass26-backend.onrender.com`

The frontend must use the Render API URL in production. Set `VITE_API_URL` in
Vercel before deploying, or keep the value in `vercel.json` if the Render
service keeps this exact hostname.

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account

- Go to [render.com](https://render.com)
- Sign up with GitHub

### 1.2 Connect GitHub Repository

1. Click **"New +"** → **"Web Service"**
2. Select your GitHub repository
3. Choose **"Connect"**

### 1.3 Configure Service

Fill in the form:

- **Name:** `filepass26-backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Plan:** `Free` (or Pro if needed)

If the service was created manually in the Render dashboard, set these values
in **Settings** → **Build & Deploy**. The repository also includes an
`index.js` compatibility entry point, so the old `node index.js` command can
start the service, but `npm run start` remains the preferred command.

### 1.4 Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

- **Key:** `NODE_ENV`
- **Value:** `production`
- **Key:** `VITE_API_URL`
- **Value:** `https://filepass26-backend.onrender.com`

### 1.5 Deploy

Click **"Create Web Service"** and wait for deployment (2-5 minutes)

**Your backend URL will be:** `https://filepass26-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Configure Environment Variables

In the Vercel project settings, add this variable for **Production** and
**Preview** environments:

```env
VITE_API_URL=https://filepass26-backend.onrender.com
```

`vercel.json` also contains this value for deployments that use the default
service hostname.

### 2.2 Deploy to Vercel

```bash
# Option 1: Via Vercel Dashboard
# 1. Go to vercel.com
# 2. Import your GitHub repo
# 3. Add Environment Variable:
#    VITE_API_URL = https://filepass26-backend.onrender.com

# Option 2: Via CLI
npm i -g vercel
vercel deploy --prod
```

---

## Step 3: Verify Deployment

### Test Backend Health

```bash
curl https://filepass26-backend.onrender.com/api/health
```

Expected response:

```json
{ "status": "ok", "time": "2026-07-09T..." }
```

### Test Admin Stats

```bash
curl https://filepass26-backend.onrender.com/api/admin/stats
```

### Test Frontend

Visit: `https://cloud-pass.vercel.app`

### Vercel SSO / manifest.json CORS Error

If the browser reports a CORS error for `/manifest.json` and shows a redirect
to `vercel.com/sso-api`, the Vercel deployment is protected by Authentication.
This is not an Express CORS issue: Vercel redirects the manifest request before
the application can respond.

In Vercel, open **Project Settings** → **Deployment Protection** and disable
Vercel Authentication for the public production deployment. Alternatively,
open the public production domain instead of a protected preview URL. Keep the
`<link rel="manifest" href="/manifest.json" />` entry in `index.html`.

---

## 🔗 Important Notes

1. **File Persistence:**
   - Render's local filesystem is ephemeral across redeploys and service restarts
   - Use a persistent disk or external object storage such as S3 for production
   - Do not use the Vercel API route for uploads; serverless request and filesystem limits apply

2. **Sleep Mode:**
   - Free services spin down after 15 mins of inactivity
   - Add "Keep Alive" service: [koyeb.com](https://koyeb.com) or cron job

3. **Database:**
   - Current: JSON file (`db.json`)
   - For production: Use MongoDB Atlas or another persistent database

4. **Upload Limits:**
   - The application is configured for up to 5GB, but the hosting proxy and plan may impose lower limits
   - Consider cloud storage (S3) for large files

---

## 📊 Monitoring

### Render Dashboard

- View logs: https://dashboard.render.com
- Monitor CPU/Memory
- View build history

### Vercel Dashboard

- View analytics: https://vercel.com/analytics
- Core Web Vitals (from @vercel/analytics)
- Deployment history

---

## 🆘 Troubleshooting

### 502 Bad Gateway on Render

- Check logs: `Settings` → `Logs`
- Likely cause: `npm run start` is failing
- Solution: Check that `dist/server.cjs` was built

### CORS Errors

The backend allowlist in [backend/app.ts](backend/app.ts) includes the
production domain, Vercel preview domains, and local development ports. After
changing it, redeploy the Render service so the new middleware is running.
If the response still has no `Access-Control-Allow-Origin` header, Render is
serving an older deployment or the service is not running the repository's
current start command.

### 503 Service Unavailable (Free Tier)

- Render spins down after 15 minutes of inactivity
- Service wakes up slowly on first request
- Upgrade to Pro or use external keep-alive service

---

## 💡 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. Add MongoDB for persistent database
4. Add AWS S3 for file storage
5. Set up monitoring/alerts
6. Configure custom domain

---

**Questions?** Check Render docs: https://render.com/docs
