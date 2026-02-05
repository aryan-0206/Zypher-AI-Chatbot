# 🚀 Complete Installation & Setup Guide

## Prerequisites to Install on Your Computer

### 1. Install Python (Required for Backend)

**Windows:**
1. Go to https://www.python.org/downloads/
2. Download Python 3.8 or higher (Latest: Python 3.12)
3. **IMPORTANT**: During installation, check "Add Python to PATH"
4. Click "Install Now"
5. Verify installation:
   ```cmd
   python --version
   ```

**Mac:**
```bash
# Using Homebrew (recommended)
brew install python3

# Or download from python.org
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

### 2. Install Node.js (Required for Frontend)

**All Platforms:**
1. Go to https://nodejs.org/
2. Download LTS version (v18 or higher)
3. Run installer with default settings
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 3. Install Git (Optional but Recommended)

**Windows:**
- Download from https://git-scm.com/download/win

**Mac:**
```bash
brew install git
```

**Linux:**
```bash
sudo apt install git
```

### 4. Install a Code Editor (Optional)

- **VS Code**: https://code.visualstudio.com/ (Recommended)
- **Sublime Text**: https://www.sublimetext.com/
- **Atom**: https://atom.io/

---

## Step-by-Step Installation

### Step 1: Extract the ZIP File

1. Download `ai-chatbot.zip`
2. Extract to a location like:
   - Windows: `C:\Users\YourName\Projects\ai-chatbot`
   - Mac/Linux: `~/Projects/ai-chatbot`

### Step 2: Open Terminal/Command Prompt

**Windows:**
- Press `Win + R`
- Type `cmd` and press Enter
- Or use PowerShell (Win + X → Windows PowerShell)

**Mac:**
- Press `Cmd + Space`
- Type "Terminal" and press Enter

**Linux:**
- Press `Ctrl + Alt + T`

### Step 3: Navigate to Project Folder

```bash
# Windows
cd C:\Users\YourName\Projects\ai-chatbot

# Mac/Linux
cd ~/Projects/ai-chatbot
```

### Step 4: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (Command Prompt):
venv\Scripts\activate

# Windows (PowerShell):
venv\Scripts\Activate.ps1

# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file (optional for basic usage)
copy .env.example .env     # Windows
cp .env.example .env       # Mac/Linux
```

### Step 5: Setup Frontend

Open a **NEW terminal/command prompt** (keep backend terminal open):

```bash
# Navigate to frontend folder
cd ai-chatbot/frontend

# Install dependencies (this may take 2-3 minutes)
npm install
```

---

## Running the Application

### Method 1: Run Both Servers Manually

**Terminal 1 - Backend Server:**
```bash
cd backend
# Activate virtual environment first
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Run server
python app.py
```

You should see:
```
* Running on http://0.0.0.0:5000
* Running on http://127.0.0.1:5000
```

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**Open your browser and go to:** `http://localhost:3000`

### Method 2: Using Setup Script (Mac/Linux Only)

```bash
cd ai-chatbot
chmod +x setup.sh
./setup.sh

# Then run both servers as shown in Method 1
```

---

## Testing the Application

1. **Open Browser**: Navigate to `http://localhost:3000`

2. **You should see**: 
   - "AI-Powered Chatbot" header
   - Welcome message
   - Three suggestion buttons
   - Chat input box at bottom

3. **Try these messages**:
   - "Hello"
   - "What can you do?"
   - "Thank you"
   - "Goodbye"

4. **Check if it's working**:
   - Bot should respond within 1 second
   - Messages appear with timestamps
   - Typing indicator shows briefly

---

## Common Issues & Solutions

### Issue 1: "Python not found"
**Solution:**
```bash
# Try python3 instead of python
python3 --version
# If this works, use python3 instead of python in all commands
```

### Issue 2: "pip not found"
**Solution:**
```bash
# Windows
python -m pip install --upgrade pip

# Mac/Linux
python3 -m pip install --upgrade pip
```

### Issue 3: "Port 5000 already in use"
**Solution:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Issue 4: "Port 3000 already in use"
**Solution:**
Edit `frontend/vite.config.js` and change port:
```javascript
server: {
  port: 3001,  // Changed from 3000
  ...
}
```

### Issue 5: "Cannot activate virtual environment on Windows"
**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned
# Then try activating again
```

### Issue 6: "npm install fails"
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s node_modules                   # Windows
del package-lock.json                   # Windows

# Install again
npm install
```

### Issue 7: "CORS Error" in browser
**Solution:**
- Make sure backend is running on port 5000
- Check browser console for specific error
- Verify backend terminal shows no errors

### Issue 8: "Module not found" errors
**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
npm install
```

---

## Stopping the Application

### Stop Backend Server:
- Press `Ctrl + C` in the backend terminal
- Type `deactivate` to exit virtual environment

### Stop Frontend Server:
- Press `Ctrl + C` in the frontend terminal

---

## File Structure After Installation

```
ai-chatbot/
├── backend/
│   ├── venv/                    # Virtual environment (created after setup)
│   ├── app.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── node_modules/            # Dependencies (created after npm install)
│   ├── src/
│   ├── package.json
│   └── package-lock.json        # Created after npm install
│
└── Documentation files...
```

---

## Customization Guide

### Change Port Numbers

**Backend Port (default: 5000):**
Edit `backend/app.py`, last line:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Changed to 5001
```

**Frontend Port (default: 3000):**
Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 3001,  // Changed to 3001
}
```

**Remember**: If you change backend port, update frontend API calls!

### Change Chatbot Responses

Edit `backend/app.py`, find `load_intents()` method:
```python
def load_intents(self):
    return {
        'greeting': {
            'patterns': ['hello', 'hi'],
            'responses': [
                'Hello! I am your custom bot!'  # Custom message
            ]
        },
        # Add your own intents here
    }
```

### Change UI Colors

Edit `frontend/src/App.css`:
```css
/* Line 17 - Main gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to blue gradient: */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

/* Change to green gradient: */
background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
```

---

## Next Steps After Installation

1. **✅ Test Basic Functionality**: Send messages and verify responses

2. **🎨 Customize Appearance**: Change colors, add your branding

3. **🤖 Add AI Integration**: 
   - Sign up for OpenAI API: https://platform.openai.com/
   - Or Anthropic API: https://console.anthropic.com/
   - Add API key to `.env` file
   - Update `backend/app.py` with API integration

4. **🗄️ Add Database**:
   - Install PostgreSQL or MongoDB
   - Update backend to use database instead of memory

5. **🚀 Deploy Online**:
   - See `DEPLOYMENT.md` for detailed instructions
   - Options: Heroku, AWS, Docker, etc.

---

## Getting Help

### Check These Resources:
1. **README.md** - Complete project documentation
2. **DEPLOYMENT.md** - Deployment instructions
3. **API_TESTING.md** - API testing examples
4. **ARCHITECTURE.md** - System architecture

### Still Having Issues?

1. **Check Terminal Output**: Look for error messages
2. **Browser Console**: Press F12, check Console tab
3. **Verify Prerequisites**: Ensure Python and Node.js are installed
4. **Try Clean Install**: Delete `venv/` and `node_modules/`, reinstall

---

## Quick Reference Commands

### Start Application:
```bash
# Terminal 1 - Backend
cd backend
venv\Scripts\activate    # Windows
source venv/bin/activate # Mac/Linux
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Stop Application:
```bash
# Both terminals
Ctrl + C
```

### Reinstall Dependencies:
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

### Update Dependencies:
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

---

## System Requirements

**Minimum:**
- OS: Windows 10, macOS 10.15, Ubuntu 20.04
- RAM: 4GB
- Storage: 500MB free space
- Internet: Required for installation

**Recommended:**
- RAM: 8GB+
- Storage: 1GB free space
- Modern browser (Chrome, Firefox, Safari, Edge)

---

## Success Checklist

- [ ] Python installed and in PATH
- [ ] Node.js and npm installed
- [ ] Project extracted from ZIP
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Chatbot responds to messages
- [ ] No errors in terminal or browser console

---

**🎉 Congratulations! Your AI Chatbot is now running!**

Visit `http://localhost:3000` and start chatting!
