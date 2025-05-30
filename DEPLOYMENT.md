# EV Finder Backend Deployment Guide

This guide will help you deploy your EV Finder backend to Render and set up MongoDB Atlas.

## Prerequisites

- GitHub account with your backend code
- MongoDB Atlas account
- Render account

## Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Verify your email

### 1.2 Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster: `ev-finder-cluster`
5. Click "Create Cluster"

### 1.3 Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `evfinder-user` (or your choice)
5. Generate a secure password and **save it**
6. Set privileges to "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "4.1 or later"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://evfinder-user:<password>@ev-finder-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `ev-finder` at the end:
   ```
   mongodb+srv://evfinder-user:yourpassword@ev-finder-cluster.xxxxx.mongodb.net/ev-finder?retryWrites=true&w=majority
   ```

## Step 2: Render Deployment

### 2.1 Create Render Account
1. Go to [Render](https://render.com)
2. Sign up using your GitHub account

### 2.2 Deploy Backend Service
1. Click "New +" and select "Web Service"
2. Connect your GitHub repository: `EV-Finder-Backend`
3. Configure the service:
   - **Name**: `ev-finder-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2.3 Set Environment Variables
In the Render dashboard, go to your service and add these environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://evfinder-user:yourpassword@ev-finder-cluster.xxxxx.mongodb.net/ev-finder?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=10000

# JWT (Generate a strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# CORS (Add your frontend URL when ready)
FRONTEND_URL=https://your-frontend-app.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API
API_VERSION=v1
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Your backend will be available at: `https://ev-finder-backend.onrender.com`

## Step 3: Verify Deployment

### 3.1 Test API Endpoints
Once deployed, test your API:

```bash
# Health check (if you have one)
curl https://ev-finder-backend.onrender.com/api/v1/health

# Test user registration
curl -X POST https://ev-finder-backend.onrender.com/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 3.2 Check Logs
- In Render dashboard, go to your service
- Click on "Logs" tab to see application logs
- Look for "MongoDB Connected" message

## Step 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional)
1. In Render dashboard, go to your service
2. Go to "Settings" tab
3. Add your custom domain if you have one

### 4.2 Environment-Specific Settings
- **Production**: Keep current settings
- **Staging**: Create another service for testing

### 4.3 Security Enhancements
1. **MongoDB Atlas**:
   - Restrict IP access to specific IPs instead of 0.0.0.0/0
   - Enable MongoDB Atlas monitoring

2. **Render**:
   - Enable health checks
   - Set up monitoring and alerts

## Step 5: Frontend Integration

When you deploy your frontend, update the `FRONTEND_URL` environment variable in Render with your actual frontend URL.

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Check build logs in Render

2. **Database Connection Fails**:
   - Verify MongoDB connection string
   - Check network access settings in Atlas
   - Ensure password doesn't contain special characters that need encoding

3. **App Crashes**:
   - Check Render logs
   - Verify all environment variables are set
   - Ensure PORT is set to 10000 (Render's default)

### Useful Commands

```bash
# Local testing with production environment
NODE_ENV=production npm start

# Check if TypeScript compiles
npm run build

# Test database connection locally
node -e "require('dotenv').config(); require('./dist/config/database.js').default()"
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `FRONTEND_URL` | Frontend application URL | `https://yourapp.com` |

## Support

- **Render Documentation**: [https://render.com/docs](https://render.com/docs)
- **MongoDB Atlas Documentation**: [https://docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **GitHub Repository**: [https://github.com/AzadehZam/EV-Finder-Backend](https://github.com/AzadehZam/EV-Finder-Backend)

---

**Note**: Remember to keep your environment variables secure and never commit them to your repository! 