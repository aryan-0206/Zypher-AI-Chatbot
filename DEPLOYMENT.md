# 🚀 Deployment Guide

This guide covers multiple deployment options for the AI Chatbot application.

## Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Considerations](#production-considerations)

## Local Development

### Quick Start
```bash
# Run the setup script
chmod +x setup.sh
./setup.sh

# Terminal 1 - Backend
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed

### Build and Run
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

Visit `http://localhost`

### Useful Docker Commands
```bash
# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Rebuild a specific service
docker-compose up --build backend
```

## Cloud Deployment

### Option 1: Heroku

#### Backend Deployment
```bash
cd backend

# Create Procfile
echo "web: python app.py" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Initialize git and deploy
git init
heroku create your-chatbot-backend
git add .
git commit -m "Initial commit"
git push heroku main
```

#### Frontend Deployment
```bash
cd frontend

# Build the app
npm run build

# Install serve
npm install -g serve

# Create Procfile
echo "web: serve -s dist -l $PORT" > Procfile

# Deploy
git init
heroku create your-chatbot-frontend
git add .
git commit -m "Initial commit"
git push heroku main
```

### Option 2: AWS EC2

#### Setup EC2 Instance
1. Launch an EC2 instance (Ubuntu 22.04)
2. Configure security groups (ports 80, 443, 5000)
3. SSH into the instance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv nodejs npm nginx

# Clone your repository
git clone <your-repo-url>
cd ai-chatbot

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Setup frontend
cd ../frontend
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/chatbot
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/ai-chatbot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Run Backend with Gunicorn
```bash
cd backend
source venv/bin/activate
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Setup as System Service
Create `/etc/systemd/system/chatbot.service`:

```ini
[Unit]
Description=AI Chatbot Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/path/to/ai-chatbot/backend
Environment="PATH=/path/to/ai-chatbot/backend/venv/bin"
ExecStart=/path/to/ai-chatbot/backend/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable chatbot
sudo systemctl start chatbot
```

### Option 3: DigitalOcean App Platform

1. Push code to GitHub
2. Create new app in DigitalOcean
3. Connect your repository
4. Configure build settings:
   - Backend: Python, Command: `gunicorn app:app`
   - Frontend: Node.js, Build: `npm run build`, Output: `dist`

### Option 4: Vercel (Frontend) + Render (Backend)

#### Deploy Frontend to Vercel
```bash
cd frontend
npm install -g vercel
vercel
```

#### Deploy Backend to Render
1. Connect your GitHub repository
2. Select backend folder
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`

## Production Considerations

### Security

#### Environment Variables
Never commit sensitive data. Use environment variables:

```python
# backend/app.py
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')
```

#### CORS Configuration
Update allowed origins in production:

```python
# backend/app.py
CORS(app, origins=[
    'https://yourdomain.com',
    'https://www.yourdomain.com'
])
```

#### HTTPS
Always use HTTPS in production:
- Use Let's Encrypt for free SSL certificates
- Configure Nginx for SSL termination

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Database

Replace in-memory storage with a database:

#### PostgreSQL Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb chatbot_db
```

```python
# backend/app.py
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)
```

### Performance

#### Backend Optimization
- Use Gunicorn with multiple workers
- Implement caching with Redis
- Add rate limiting

```bash
pip install gunicorn redis flask-limiter

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 app:app
```

#### Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement code splitting

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
})
```

### Monitoring

#### Application Monitoring
```bash
# Install monitoring tools
pip install prometheus-flask-exporter

# Add to backend/app.py
from prometheus_flask_exporter import PrometheusMetrics
metrics = PrometheusMetrics(app)
```

#### Logging
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

### Scaling

#### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Deploy multiple backend instances
- Implement sticky sessions

#### Database Scaling
- Use read replicas
- Implement connection pooling
- Add database indexes

### Backup

```bash
# Database backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump chatbot_db > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

### Health Checks

Add health check endpoints:

```python
@app.route('/health')
def health():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}

@app.route('/ready')
def ready():
    # Check database connection
    return {'status': 'ready'}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :5000
# Kill process
kill -9 <PID>
```

#### Permission Denied
```bash
sudo chmod +x setup.sh
```

#### Module Not Found
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Getting Help

- Check application logs
- Review error messages
- Consult documentation
- Open an issue on GitHub

## Maintenance

### Regular Updates
```bash
# Update Python packages
pip list --outdated
pip install --upgrade <package>

# Update Node packages
npm outdated
npm update
```

### Security Patches
```bash
# Check for vulnerabilities
pip check
npm audit

# Fix vulnerabilities
npm audit fix
```

---

**Remember:** Always test deployments in a staging environment before pushing to production!
