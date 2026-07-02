# 🚀 Render Deployment Guide

This guide provides step-by-step instructions to deploy the Zypher AI Chatbot on Render.com.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Deployment Steps](#deployment-steps)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Before You Start
1. **GitHub Account** - Create one at [github.com](https://github.com)
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Gemini API Key** - Get one at [makersuite.google.com](https://makersuite.google.com)
4. **Git Installed** - Download from [git-scm.com](https://git-scm.com)

### Required Dependencies Versions
- Python 3.8+
- Node.js 16+
- npm 8+

---

## Deployment Steps

### Step 1: Prepare Your Project for GitHub

#### 1.1 Initialize Git (if not already done)
```bash
cd "e:\Projects\Zypher AI Chatbot"
git init
git add .
git commit -m "Initial commit: Zypher AI Chatbot project"
```

#### 1.2 Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `zypher-ai-chatbot`
3. Make it **Public** for easy sharing
4. Do NOT initialize with README (we have one)

#### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/zypher-ai-chatbot.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Render

#### 2.1 Deploy Backend API
1. **Go to Render Dashboard**: [render.com/dashboard](https://render.com/dashboard)
2. **Click "New +" → "Web Service"**
3. **Connect GitHub Repository**:
   - Select your `zypher-ai-chatbot` repository
   - Click "Connect"

4. **Configure Backend Service**:
   - **Name**: `zypher-ai-backend`
   - **Environment**: `Python 3`
   - **Region**: Choose closest to you
   - **Build Command**:
     ```bash
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     cd backend && python app.py
     ```

5. **Add Environment Variables**:
   - **FLASK_ENV**: `production`
   - **FLASK_DEBUG**: `False`
   - **GEMINI_API_KEY**: [Paste your Gemini API key]
   - **CORS_ORIGINS**: `https://zypher-ai-frontend.onrender.com`

6. **Click "Create Web Service"**

7. **Wait for Deployment** (Usually takes 3-5 minutes)

---

#### 2.2 Deploy Frontend
1. **Go to Render Dashboard** and click **"New +" → "Static Site"**
2. **Connect GitHub Repository** (same as backend)

3. **Configure Frontend Service**:
   - **Name**: `zypher-ai-frontend`
   - **Region**: Same as backend (recommended)
   - **Build Command**:
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory**: `frontend/dist`

4. **Add Environment Variables**:
   - **VITE_API_URL**: `https://zypher-ai-backend.onrender.com`
     (Replace with your actual backend URL from Step 2.1)

5. **Click "Create Static Site"**

6. **Wait for Deployment** (Usually takes 2-3 minutes)

---

### Step 3: Verify Deployment

#### 3.1 Check Services
- Backend should be at: `https://zypher-ai-backend.onrender.com`
- Frontend should be at: `https://zypher-ai-frontend.onrender.com`

#### 3.2 Test the Application
1. Open frontend URL in browser
2. Try sending a message to the chatbot
3. Check that responses are working

#### 3.3 Check Backend Logs (if issues occur)
1. Go to Render Dashboard
2. Click on `zypher-ai-backend` service
3. Go to "Logs" tab to see any errors

---

## Configuration

### Environment Variables Reference

#### Backend (.env file)
```env
FLASK_ENV=production
FLASK_DEBUG=False
GEMINI_API_KEY=your-api-key-here
CORS_ORIGINS=https://zypher-ai-frontend.onrender.com
```

#### Frontend (Vite)
```env
VITE_API_URL=https://zypher-ai-backend.onrender.com
```

### Custom Domain (Optional)
1. Go to your Render service settings
2. Click "Custom Domain"
3. Enter your domain (e.g., `mychatbot.com`)
4. Update DNS records as shown in Render instructions

---

## Troubleshooting

### Backend Service Won't Start
**Symptoms**: Backend service shows "Deploy failed"

**Solutions**:
1. Check "Logs" tab for errors
2. Verify all environment variables are set
3. Ensure `requirements.txt` has all dependencies
4. Check Python version compatibility

```bash
# Test locally first
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend Not Connecting to Backend
**Symptoms**: "Network Error" messages in browser console

**Solutions**:
1. Verify `VITE_API_URL` environment variable
2. Check backend service is running
3. Verify CORS settings match frontend URL
4. Check browser console for detailed errors

### API Key Issues
**Symptoms**: "CRITICAL: GEMINI_API_KEY not found" in logs

**Solutions**:
1. Copy your Gemini API key from [makersuite.google.com](https://makersuite.google.com)
2. Go to Render service settings
3. Add/update the `GEMINI_API_KEY` environment variable
4. Redeploy the service

### Build Fails with "dependencies not found"
**Symptoms**: Build log shows "command not found: npm" or similar

**Solutions**:
1. Check `package.json` exists in `frontend/` directory
2. Verify `requirements.txt` exists in `backend/` directory
3. Ensure build commands are correct in Render settings
4. Check file paths are relative to project root

---

## Monitoring & Maintenance

### View Service Status
1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Check the status indicator (green = running, red = failed)

### View Logs
- **Backend**: Go to service → Logs tab
- **Frontend**: Go to service → Logs tab

### Redeploy After Changes
```bash
# Make changes locally
git add .
git commit -m "Your commit message"
git push origin main

# Render automatically redeploys when you push
# Monitor deployment in Render Dashboard
```

### Monitor Resource Usage
1. Go to your service settings
2. Check the "Metrics" tab for CPU, Memory, Requests

### Update Environment Variables
1. Go to service settings
2. Click "Environment" or "Env Variables"
3. Edit variables as needed
4. Click "Save"

---

## Performance Optimization

### Reduce Cold Start Time
- Use `Standard` tier (paid) for guaranteed availability
- Free tier services spin down after 15 minutes of inactivity

### Optimize Frontend Build
- CSS is already minified in `vite.config.js`
- Build automatically removes unused code
- Check build size: `frontend/dist/` should be < 500KB

### Optimize Backend
- Ensure `FLASK_DEBUG=False` in production
- Frontend is served as static site (most performant)
- API responses are typically < 5 seconds

---

## Security Best Practices

1. **Never commit .env file** - Use `.env.example` as template
2. **Use strong API keys** - Generate new keys regularly
3. **Enable HTTPS** - Render does this automatically
4. **CORS Configuration** - Only allow your frontend domain
5. **Keep dependencies updated** - Regularly update `requirements.txt` and `package.json`

---

## Useful Links

- [Render Documentation](https://render.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Render service logs
3. Verify all environment variables
4. Check GitHub repository issues
5. Visit Render support: [render.com/support](https://render.com/support)

---

**Last Updated**: 2024
**Tested On**: Render Free & Premium Tiers
