# FilePass26 - Render Deployment Guide

## 🚀 Deployment Architecture

- **Frontend:** Vercel (filepass26.vercel.app)
- **Backend:** Render (render.com)

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

### 1.4 Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

- **Key:** `NODE_ENV`
- **Value:** `production`

### 1.5 Deploy

Click **"Create Web Service"** and wait for deployment (2-5 minutes)

**Your backend URL will be:** `https://filepass26-backend.onrender.com`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update Environment

Create `.env.production` in your project:

```env
VITE_API_URL=https://filepass26-backend.onrender.com
```

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

Visit: `https://filepass26.vercel.app`

---

## 🔗 Important Notes

1. **File Persistence:**
   - Render's free tier resets files every 15 minutes
   - For production, upgrade to **Render Pro** ($7/month) for persistent storage
   - OR use external storage (AWS S3, etc.)

2. **Sleep Mode:**
   - Free services spin down after 15 mins of inactivity
   - Add "Keep Alive" service: [koyeb.com](https://koyeb.com) or cron job

3. **Database:**
   - Current: JSON file (db.json)
   - For production: Use MongoDB Atlas (free tier available)

4. **Upload Limits:**
   - Render: 100MB per request (configurable)
   - Current app: 5GB limit
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

Add to backend [backend/app.ts](backend/app.ts):

```typescript
app.use(
  cors({
    origin: ["https://filepass26.vercel.app", "http://localhost:3000"],
    credentials: true,
  }),
);
```

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
