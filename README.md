<!DOCTYPE html>
<html lang="en">
<head>
  
</head>
<body>
  <h1>🤖 AI-Powered Chatbot - Full Stack Application</h1>
  <p>
    A modern, full-stack chatbot application built with Python Flask backend and React frontend,<br>
    featuring natural language processing capabilities and a beautiful, responsive UI.
  </p>

  <h2>📋 Table of Contents</h2>
  <p>
    - <a href="#features">Features</a><br>
    - <a href="#tech-stack">Tech Stack</a><br>
    - <a href="#installation">Installation</a><br>
    - <a href="#running-the-application">Running the Application</a><br>
    - <a href="#api-documentation">API Documentation</a>
  </p>

  <h2 id="features">✨ Features</h2>
  <p>
    - Real-time conversational AI chatbot<br>
    - Natural language processing with pattern matching<br>
    - Conversation history tracking<br>
    - Beautiful, modern UI with gradient design<br>
    - Fully responsive (mobile, tablet, desktop)<br>
    - Session management<br>
    - Clear chat functionality
  </p>

  <h2 id="tech-stack">🛠️ Tech Stack</h2>

  <h3>Backend</h3>
  <p>
    - Python 3.8+<br>
    - Flask<br>
    - Flask-CORS
  </p>

  <h3>Frontend</h3>
  <p>
    - React 18<br>
    - Vite<br>
    - CSS3
  </p>

  <h2>📁 Project Structure</h2>
  <pre><code>ai-chatbot/
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   └── package.json
└── README.md
</code></pre>

  <h2 id="installation">🚀 Installation</h2>

  <h3>Prerequisites</h3>
  <p>
    - Python 3.8+<br>
    - Node.js 16+
  </p>

  <h3>Backend Setup</h3>
  <p>
    1. cd backend<br>
    2. python -m venv venv<br>
    3. activate venv<br>
    4. pip install -r requirements.txt
  </p>

  <h3>Frontend Setup</h3>
  <p>
    1. cd frontend<br>
    2. npm install
  </p>

  <h2 id="running-the-application">🏃 Running the Application</h2>

  <h3>Start Backend</h3>
  <p>
    cd backend<br>
    python app.py
  </p>

  <h3>Start Frontend</h3>
  <p>
    cd frontend<br>
    npm run dev
  </p>

  <p>
    Access at http://localhost:3000
  </p>

  <h2 id="api-documentation">📡 API Documentation</h2>
  <p>
    Base URL: http://localhost:5000/api<br><br>
    Endpoints:<br>
    - GET /api/health<br>
    - POST /api/chat<br>
    - GET /api/history/&lt;session_id&gt;<br>
    - DELETE /api/clear/&lt;session_id&gt;<br>
    - GET /api/sessions
  </p>

  <hr>

  <p><strong>Built with ❤️</strong></p>
</body>
</html>
