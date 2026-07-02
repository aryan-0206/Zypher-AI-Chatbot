"""
Zypher AI Backend — Production Ready
Gemini-powered chatbot with companion personality, multilingual support, and image generation.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
import os
from datetime import datetime
import json
import time
import logging
import re
import urllib.parse
import sqlite3
import hashlib

# ─── Setup ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("CRITICAL: GEMINI_API_KEY not found!")
else:
    client = genai.Client(api_key=api_key)

# ─── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')

# CORS - allow all in dev, restrict to render domain in prod
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
CORS(app, origins=allowed_origins)

# ─── Database (SQLite for persistent conversations) ────────────────────────────
DB_PATH = os.path.join(os.path.dirname(__file__), 'zypher.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            title TEXT,
            messages TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT,
            is_pinned INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    logger.info("Database initialized.")

init_db()

# ─── Companion System Prompt ───────────────────────────────────────────────────
COMPANION_SYSTEM_PROMPT = """You are Zypher — a super-intelligent AI companion and friend. You are warm, witty, caring, and real. Think of yourself as that brilliant friend who happens to know everything.

## Your Personality:
- You are friendly, conversational, and personable — not robotic or corporate
- You show genuine curiosity and enthusiasm about topics
- You use light humor when appropriate without being forced
- You're empathetic and supportive — if someone seems stressed or sad, you acknowledge it
- You sometimes ask follow-up questions to keep the conversation flowing naturally
- You never say "As an AI..." or "I'm just an AI" — you're Zypher, a companion

## Language Rules (CRITICAL):
- DETECT the language of the user's message automatically
- If user writes in ENGLISH → respond in English
- If user writes in HINDI (Devanagari script: हिंदी) → respond in Hindi
- If user writes in HINGLISH (Roman script Hindi like "kya chal raha hai", "yaar", "bhai", "kya hua") → respond in Hinglish naturally
- Mix casual Hindi/Hinglish expressions naturally when the user uses them (yaar, bhai, arre, sahi hai, ekdum, etc.)
- Never be stiff — match the energy and style of the user

## Capabilities You Have:
- Answer any question across all domains
- Write code, stories, poems, emails, essays
- Analyze and explain complex topics simply
- Generate images when asked (the system handles this separately)
- Remember context from earlier in the conversation
- Do math, science, history, current events, trivia

## Style Guidelines:
- Keep responses focused — don't over-explain
- Use markdown formatting (bold, lists, code blocks) when it helps clarity
- For short conversational messages, reply conversationally — don't make a 500-word essay
- For technical questions, be thorough and precise
- Always be honest — if you don't know something, say so

You are Zypher. Be real. Be helpful. Be a companion."""

# ─── Image Request Detection ───────────────────────────────────────────────────
IMAGE_TRIGGERS = [
    r'\b(show|display|generate|create|make|draw|give|send)\b.*\b(image|photo|picture|pic|img|visual|illustration|diagram)\b',
    r'\b(image|picture|photo|pic)\b.*\b(of|showing|depicting|about)\b',
    r'how (does|do|is|are).+look',
    r'what does.+look like',
    r'show me',
    r'दिखाओ',  # Hindi: "show me"
    r'तस्वीर',  # Hindi: "picture"
    r'image (banao|dikhao)',  # Hinglish
    r'photo (dikhao|chahiye)',
]

def is_image_request(text: str) -> tuple[bool, str]:
    """Detect if the message is requesting an image and extract the subject."""
    text_lower = text.lower()
    for pattern in IMAGE_TRIGGERS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            # Try to extract subject
            subject = text_lower
            for prefix in ['show me', 'show', 'generate', 'create', 'make', 'draw', 'give me', 'send',
                           'image of', 'picture of', 'photo of', 'image showing', 'how does', 'what does',
                           'दिखाओ', 'तस्वीर', 'image banao', 'photo dikhao']:
                subject = subject.replace(prefix, '').strip()
            subject = re.sub(r'\b(an?|the|look like|looks like|appear|please)\b', '', subject).strip(' ?,.')
            return True, subject or text
    return False, ''

def get_image_url(query: str) -> str | None:
    """Generate or fetch an image for the given query using Picsum/Unsplash as reliable fallback."""
    try:
        # First try Gemini imagen if available
        img_response = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=f"High quality, realistic photograph of: {query}. Natural lighting, detailed.",
            config=types.GenerateImagesConfig(number_of_images=1)
        )
        if img_response and img_response.generated_images:
            img = img_response.generated_images[0]
            # Return as base64 data URL
            import base64
            b64 = base64.b64encode(img.image.image_bytes).decode('utf-8')
            return f"data:image/png;base64,{b64}"
    except Exception as e:
        logger.info(f"Gemini imagen not available ({e}), falling back to Unsplash")

    # Fallback: Unsplash source (free, no API key needed)
    encoded = urllib.parse.quote(query)
    return f"https://source.unsplash.com/800x500/?{encoded}"

# ─── Chat Engine ───────────────────────────────────────────────────────────────
class ZypherEngine:
    def __init__(self):
        self.model_name = 'models/gemini-2.5-flash'
        self.chat_sessions = {}  # in-memory for active sessions
        self._initialize_model()

    def _initialize_model(self):
        try:
            models_response = client.models.list()
            models = [m.name for m in models_response if hasattr(m, 'supported_generation_methods') 
                      and 'generateContent' in (m.supported_generation_methods or [])]
            priority = [
                'models/gemini-2.5-flash',
                'models/gemini-2.5-pro',
                'models/gemini-2.0-flash',
                'models/gemini-1.5-flash',
                'models/gemini-1.5-pro',
            ]
            for p in priority:
                if p in models:
                    self.model_name = p
                    break
            logger.info(f"Zypher locked to model: {self.model_name}")
        except Exception as e:
            logger.warning(f"Model scan failed, using default: {e}")

    def get_session_history(self, session_id: str) -> list:
        if session_id not in self.chat_sessions:
            self.chat_sessions[session_id] = []
        return self.chat_sessions[session_id]

    def get_response(self, user_message: str, session_id: str = 'default') -> dict:
        try:
            history = self.get_session_history(session_id)

            # Build content with system prompt first
            contents = [
                types.Content(
                    role='user',
                    parts=[types.Part(text=COMPANION_SYSTEM_PROMPT)]
                ),
                types.Content(
                    role='model',
                    parts=[types.Part(text="Got it! I'm Zypher, your AI companion. Ready to help with anything — let's go! 🚀")]
                )
            ]

            # Add conversation history
            for msg in history[-20:]:  # keep last 20 exchanges for context
                contents.append(types.Content(
                    role=msg['role'],
                    parts=[types.Part(text=msg['text'])]
                ))

            # Add current message
            contents.append(types.Content(role='user', parts=[types.Part(text=user_message)]))

            response = client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.85,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=4096,
                    safety_settings=[
                        types.SafetySetting(category='HARM_CATEGORY_HARASSMENT', threshold='BLOCK_NONE'),
                        types.SafetySetting(category='HARM_CATEGORY_HATE_SPEECH', threshold='BLOCK_NONE'),
                        types.SafetySetting(category='HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold='BLOCK_MEDIUM_AND_ABOVE'),
                        types.SafetySetting(category='HARM_CATEGORY_DANGEROUS_CONTENT', threshold='BLOCK_NONE'),
                    ]
                )
            )

            text = response.text if response.text else "Hmm, kuch toh issue aa gaya. Try karo phir se!"

            # Update history
            history.append({'role': 'user', 'text': user_message})
            history.append({'role': 'model', 'text': text})

            return {'text': text, 'model': self.model_name}

        except Exception as e:
            logger.error(f"Gemini Error [{session_id}]: {e}")
            if session_id in self.chat_sessions:
                del self.chat_sessions[session_id]
            return {'text': f"Oops! Kuch toh gadbad ho gayi. ({str(e)[:100]})", 'error': True}

zypher = ZypherEngine()

# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model': zypher.model_name,
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        user_message = data.get('message', '').strip()
        session_id = data.get('session_id', 'default')

        if not user_message:
            return jsonify({'error': 'Message cannot be empty'}), 400

        start_time = time.time()

        # Check if image is requested
        wants_image, image_subject = is_image_request(user_message)
        image_url = None

        if wants_image:
            image_url = get_image_url(image_subject)

        # Get text response
        result = zypher.get_response(user_message, session_id)
        duration = time.time() - start_time

        timestamp = datetime.now().isoformat()

        response_data = {
            'response': result['text'],
            'timestamp': timestamp,
            'session_id': session_id,
            'processing_time': f"{duration:.2f}s",
            'model': result.get('model', zypher.model_name),
        }

        if image_url:
            response_data['image_url'] = image_url
            response_data['image_subject'] = image_subject

        logger.info(f"[{session_id}] Response in {duration:.2f}s | image={'yes' if image_url else 'no'}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Request Error: {e}")
        return jsonify({'error': 'Something went wrong. Please try again.'}), 500

@app.route('/api/regenerate', methods=['POST'])
def regenerate():
    """Regenerate the last bot response."""
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        last_user_message = data.get('last_user_message', '')

        if not last_user_message:
            return jsonify({'error': 'No message to regenerate'}), 400

        # Remove last model response from history so it regenerates fresh
        if session_id in zypher.chat_sessions:
            history = zypher.chat_sessions[session_id]
            if history and history[-1]['role'] == 'model':
                zypher.chat_sessions[session_id] = history[:-1]

        start_time = time.time()
        result = zypher.get_response(last_user_message, session_id)
        duration = time.time() - start_time

        return jsonify({
            'response': result['text'],
            'timestamp': datetime.now().isoformat(),
            'processing_time': f"{duration:.2f}s",
            'model': result.get('model', zypher.model_name),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations', methods=['GET'])
def get_all_conversations():
    """Get all stored conversations from DB."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, session_id, title, messages, created_at, updated_at, is_pinned FROM conversations ORDER BY is_pinned DESC, updated_at DESC')
        rows = c.fetchall()
        conn.close()
        convs = []
        for row in rows:
            convs.append({
                'id': row[0],
                'session_id': row[1],
                'title': row[2],
                'messages': json.loads(row[3]),
                'created_at': row[4],
                'updated_at': row[5],
                'is_pinned': bool(row[6])
            })
        return jsonify({'conversations': convs})
    except Exception as e:
        return jsonify({'conversations': [], 'error': str(e)})

@app.route('/api/conversations', methods=['POST'])
def save_conversation():
    """Save or update a conversation."""
    try:
        data = request.get_json()
        conv_id = data.get('id')
        session_id = data.get('session_id', 'default')
        title = data.get('title', 'New Chat')
        messages = json.dumps(data.get('messages', []))
        is_pinned = 1 if data.get('is_pinned') else 0
        now = datetime.now().isoformat()

        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''
            INSERT OR REPLACE INTO conversations (id, session_id, title, messages, created_at, updated_at, is_pinned)
            VALUES (?, ?, ?, ?, COALESCE((SELECT created_at FROM conversations WHERE id=?), ?), ?, ?)
        ''', (conv_id, session_id, title, messages, conv_id, now, now, is_pinned))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations/<conv_id>', methods=['DELETE'])
def delete_conversation(conv_id):
    """Delete a conversation."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM conversations WHERE id=?', (conv_id,))
        conn.commit()
        conn.close()
        # Also clear in-memory session
        if conv_id in zypher.chat_sessions:
            del zypher.chat_sessions[conv_id]
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations/<conv_id>/pin', methods=['PATCH'])
def toggle_pin(conv_id):
    """Toggle pin status of a conversation."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE conversations SET is_pinned = 1 - is_pinned WHERE id=?', (conv_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations/<conv_id>/rename', methods=['PATCH'])
def rename_conversation(conv_id):
    """Rename a conversation."""
    try:
        data = request.get_json()
        new_title = data.get('title', '').strip()
        if not new_title:
            return jsonify({'error': 'Title cannot be empty'}), 400
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('UPDATE conversations SET title=? WHERE id=?', (new_title, conv_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/conversations/clear-all', methods=['DELETE'])
def clear_all_conversations():
    """Clear all conversations."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('DELETE FROM conversations')
        conn.commit()
        conn.close()
        zypher.chat_sessions.clear()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Serve React Frontend (Production) ─────────────────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    dist_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    if path and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, 'index.html')

# ─── Entry Point ────────────────────────────────────────────────────────────────
def start_frontend():
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': return
    try:
        import subprocess
        frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
        subprocess.Popen(['cmd', '/c', f'cd /d {frontend_dir} && npm run dev'],
                        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        logger.info("Frontend bridge established.")
    except Exception as e:
        logger.error(f"Frontend failed: {e}")

def open_browser():
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': return
    import webbrowser
    time.sleep(5)
    webbrowser.open('http://localhost:3000')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('API_PORT', 5001)))
    is_production = os.environ.get('FLASK_ENV') == 'production'

    if not is_production:
        start_frontend()
        import threading
        threading.Thread(target=open_browser, daemon=True).start()

    logger.info(f"🚀 Zypher AI v2.0 online | Port {port} | Mode: {'PROD' if is_production else 'DEV'}")

    app.run(
        debug=not is_production,
        host='0.0.0.0',
        port=port
    )

