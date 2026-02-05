# ⚡ QUICK START - Read This First!

## 📦 What You Need to Install (One-Time Setup)

### 1. Python (Backend Language)
- **Download**: https://www.python.org/downloads/
- **Version**: 3.8 or higher
- **Windows Important**: Check "Add Python to PATH" during installation
- **Test it works**: Open terminal/cmd, type: `python --version`

### 2. Node.js (Frontend Tool)
- **Download**: https://nodejs.org/
- **Version**: 16 or higher (Get the LTS version)
- **Test it works**: Open terminal/cmd, type: `node --version`

---

## 🚀 3 Simple Steps to Run

### Step 1: Extract ZIP
- Extract `ai-chatbot.zip` to your Desktop or Documents folder
- Remember this location!

### Step 2: Setup (First Time Only)

**Open Terminal/Command Prompt:**
- Windows: Press `Win + R`, type `cmd`, press Enter
- Mac: Press `Cmd + Space`, type "Terminal", press Enter

**Run these commands:**
```bash
# Go to project folder (change path if needed)
cd Desktop/ai-chatbot

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate              # Windows
source venv/bin/activate           # Mac/Linux
pip install -r requirements.txt
cd ..

# Setup frontend
cd frontend
npm install
cd ..
```

### Step 3: Run the App

**You need TWO terminals/command prompts open!**

**Terminal 1 - Backend:**
```bash
cd Desktop/ai-chatbot/backend
venv\Scripts\activate              # Windows
source venv/bin/activate           # Mac/Linux
python app.py
```
✅ You should see: "Running on http://127.0.0.1:5000"

**Terminal 2 - Frontend:**
```bash
cd Desktop/ai-chatbot/frontend
npm run dev
```
✅ You should see: "Local: http://localhost:3000/"

**Open your browser:** Go to `http://localhost:3000` 🎉

---

## 🎯 Every Time You Want to Use It

Just repeat Step 3 (run both terminals)!

---

## ❌ Something Not Working?

### Problem: "Python not found"
- Make sure you installed Python
- Windows: Restart computer after installing Python
- Try `python3` instead of `python`

### Problem: "npm not found"
- Make sure you installed Node.js
- Restart your terminal/command prompt
- Restart computer if needed

### Problem: "Port 5000 already in use"
- Close all terminals and try again
- Restart your computer

### Problem: Nothing appears in browser
- Make sure BOTH terminals are running
- Check for red error messages in terminals
- Try refreshing browser (F5)

---

## 📖 Need More Help?

Read these files in order:
1. **INSTALLATION_GUIDE.md** ← Detailed step-by-step instructions
2. **README.md** ← Complete documentation
3. **PROJECT_SUMMARY.md** ← Overview and features

---

## 🎨 Quick Customization

### Change the greeting message:
1. Open `backend/app.py` in any text editor
2. Find line 35: `'responses': ['Hello! How can I assist you today?',`
3. Change the text to anything you want!
4. Save file and restart backend server

### Change the colors:
1. Open `frontend/src/App.css` in any text editor
2. Find line 17: `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`
3. Change color codes (search "gradient generator" online)
4. Save file and refresh browser

---

## ✅ Success Checklist

After installation, you should be able to:
- [ ] Open http://localhost:3000 in browser
- [ ] See "AI-Powered Chatbot" header
- [ ] Type a message and get a response
- [ ] See messages appear in chat window
- [ ] Click "Clear Chat" button

---

## 📁 Project Files Overview

```
ai-chatbot/
├── QUICK_START.md          ← You are here!
├── INSTALLATION_GUIDE.md   ← Detailed instructions
├── README.md               ← Full documentation
├── PROJECT_SUMMARY.md      ← Features overview
│
├── backend/                ← Python/Flask server
│   ├── app.py             ← Main code (chatbot logic)
│   └── requirements.txt   ← Dependencies list
│
└── frontend/              ← React web interface
    ├── src/               ← Source code
    │   ├── App.jsx       ← Main app
    │   └── components/   ← UI pieces
    └── package.json      ← Dependencies list
```

---

## 🎓 What This Chatbot Does

- ✅ Responds to greetings (hello, hi, hey)
- ✅ Responds to goodbyes (bye, goodbye)
- ✅ Responds to thanks (thank you, thanks)
- ✅ Answers "what can you do" questions
- ✅ Generates contextual responses for other questions
- ✅ Remembers conversation during session
- ✅ Works on mobile phones too!

---

## 🚀 Make It Smarter (Optional)

Want to connect it to real AI like ChatGPT?

1. Get API key from https://platform.openai.com/
2. Add to `backend/.env` file
3. See README.md "Future Enhancements" section

---

## 💡 Pro Tips

- Keep both terminal windows open while using
- Don't close terminals with X - use Ctrl+C first
- Bookmark http://localhost:3000 in your browser
- Changes to backend: Restart backend server (Ctrl+C, then run again)
- Changes to frontend: Browser auto-refreshes!

---

**Ready? Let's go! Start with Step 1 above! 🚀**

**Having issues? Read INSTALLATION_GUIDE.md for detailed help.**
