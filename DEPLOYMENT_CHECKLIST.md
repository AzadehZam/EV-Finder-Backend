# EV Finder Backend - Render Deployment Checklist

## ✅ Pre-Deployment (COMPLETED)
- [x] MongoDB Atlas cluster created and configured
- [x] Database user with proper privileges (atlasAdmin)
- [x] Network access configured (0.0.0.0/0)
- [x] Local data migrated to Atlas
- [x] Connection string tested and working
- [x] Code committed and pushed to GitHub

## 🚀 Render Deployment Steps

### 1. Create Web Service
1. Go to [Render Dashboard](https://render.com)
2. Click "New +" → "Web Service"
3. Connect GitHub: `AzadehZam/EV-Finder-Backend`
4. Select `main` branch

### 2. Basic Configuration
```
Name: ev-finder-backend
Environment: Node
Region: Oregon (US West) or closest to you
Branch: main
Build Command: npm install && npm run build
Start Command: npm start
```

### 3. Environment Variables
Add these in the "Environment" section:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://evfinder-user:VLg2brxbXlMEiOJk@ev-finder-cluster.ikn3e81.mongodb.net/ev-finder?retryWrites=true&w=majority&appName=ev-finder-cluster
JWT_SECRET=995b054767a8cde6f43be2a31c58e1b77717ebb9ec6834971f62a4f2fb9fb5419328782ace2a3a1cdf825248f1df8f3956401b70b12f1aa82935283c63e3009b
AUTH0_DOMAIN=dev-zrjqxip57a10h8fo.us.auth0.com
AUTH0_AUDIENCE=your-auth0-api-identifier
ALLOWED_ORIGINS=https://ev-finder-frontend-web.onrender.com,http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_VERSION=v1
```

### 4. Advanced Settings
- **Health Check Path:** `/health`
- **Auto-Deploy:** Yes (recommended)

### 5. Deploy
1. Click "Create Web Service"
2. Wait for build and deployment (3-5 minutes)
3. Your API will be available at: `https://ev-finder-backend.onrender.com`

## 🔍 Post-Deployment Testing

### Test Health Endpoint
```bash
curl https://your-app-name.onrender.com/health
```
Should return:
```json
{
  "success": true,
  "message": "EV Finder API is running",
  "timestamp": "2025-06-02T...",
  "environment": "production"
}
```

### Test Charging Stations Endpoint
```bash
curl https://your-app-name.onrender.com/api/v1/stations
```

### Test Reservations Endpoint (should require auth in production)
```bash
curl https://your-app-name.onrender.com/api/v1/reservations
```

## 🔧 Troubleshooting

If deployment fails, check:
1. **Build logs** in Render dashboard
2. **Runtime logs** for connection errors
3. **MongoDB Atlas** network access settings
4. **Environment variables** are set correctly

## 📝 Notes
- Your MongoDB Atlas connection string contains sensitive information
- JWT_SECRET is production-ready and secure
- CORS is configured for your frontend domain
- Authentication bypassed in development, enforced in production 