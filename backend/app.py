from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
import os
from datetime import datetime
import json
import webbrowser
import time
import subprocess
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logger.error("CRITICAL: GEMINI_API_KEY not found in .env file!")
else:
    client = genai.Client(api_key=api_key)

app = Flask(__name__)
CORS(app)

# In-memory conversation storage
conversations = {}

class ChatbotEngine:
    def __init__(self):
        self.model_name = 'gemini-2.5-flash' # Default model
        self.chat_sessions = {}
        self.client = client
        self._initialize_model()

    def _initialize_model(self):
        try:
            # List available models
            models_response = self.client.models.list()
            models = [m.name for m in models_response if 'generateContent' in m.supported_generation_methods]
            logger.info(f"Available models: {models}")

            # Priority list for models
            priority = ['models/gemini-2.5-flash', 'models/gemini-2.5-pro', 'models/gemini-2.0-flash', 'models/gemini-1.5-flash', 'models/gemini-1.5-pro']
            for p in priority:
                if p in models:
                    self.model_name = p
                    break
            else:
                if models:
                    self.model_name = models[0] # Just take the first one if priority fails

            logger.info(f"Successfully locked Nexus AI to: {self.model_name}")
        except Exception as e:
            logger.warning(f"Model scanning failed, using hardcoded fallback. Error: {e}")
            self.model_name = 'models/gemini-2.5-flash'

    def get_chat_session(self, session_id):
        if session_id not in self.chat_sessions:
            logger.info(f"Starting new chat session for: {session_id}")
            self.chat_sessions[session_id] = []
        return self.chat_sessions[session_id]
    
    def get_response(self, user_message, session_id='default'):
        try:
            history = self.get_chat_session(session_id)
            
            # Build chat messages from history
            contents = []
            for msg in history:
                contents.append(types.Content(role=msg['role'], parts=[types.Part(text=msg['text'])]))
            
            # Add current user message
            contents.append(types.Content(role='user', parts=[types.Part(text=user_message)]))
            
            # Generate response
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=2048,
                    safety_settings=[
                        types.SafetySetting(
                            category='HARM_CATEGORY_HARASSMENT',
                            threshold='BLOCK_NONE'
                        ),
                        types.SafetySetting(
                            category='HARM_CATEGORY_HATE_SPEECH',
                            threshold='BLOCK_NONE'
                        ),
                        types.SafetySetting(
                            category='HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold='BLOCK_NONE'
                        ),
                        types.SafetySetting(
                            category='HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold='BLOCK_NONE'
                        )
                    ]
                )
            )
            
            if response.text:
                # Update history
                history.append({'role': 'user', 'text': user_message})
                history.append({'role': 'model', 'text': response.text})
                return response.text
            else:
                return "The AI generated an empty response. This might be due to safety filters."
                
        except Exception as e:
            logger.error(f"Gemini API Error: {str(e)}")
            # If session is corrupted, reset it
            if "blocked" in str(e).lower() or "finish_reason" in str(e).lower():
                return "I'm sorry, I couldn't process that message due to safety guidelines."
            
            if session_id in self.chat_sessions:
                del self.chat_sessions[session_id]
            
            return f"Service Interruption: {str(e)}"

# Initialize chatbot engine
chatbot = ChatbotEngine()

@app.route('/api/health', methods=['GET'])
def health_check():
    # Verify API key works with a tiny test
    api_status = "unconfigured"
    if api_key:
        try:
            response = client.models.generate_content(
                model='models/gemini-2.5-flash',
                contents=[types.Content(role='user', parts=[types.Part(text='ping')])],
                config=types.GenerateContentConfig(max_output_tokens=1)
            )
            api_status = "active"
        except Exception as e:
            api_status = f"error: {str(e)}"

    return jsonify({
        'status': 'healthy',
        'api_status': api_status,
        'model': chatbot.model_name,
        'timestamp': datetime.now().isoformat()
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
        bot_response = chatbot.get_response(user_message, session_id)
        duration = time.time() - start_time
        
        # Log to global history
        if session_id not in conversations:
            conversations[session_id] = []
        
        timestamp = datetime.now().isoformat()
        conversations[session_id].append({
            'user': user_message,
            'bot': bot_response,
            'timestamp': timestamp,
            'latency': f"{duration:.2f}s"
        })
        
        logger.info(f"[{session_id}] Reply sent in {duration:.2f}s")
        
        return jsonify({
            'response': bot_response,
            'timestamp': timestamp,
            'session_id': session_id,
            'processing_time': f"{duration:.2f}s"
        })
    
    except Exception as e:
        logger.error(f"Request Error: {e}")
        return jsonify({'error': 'The neural link is unstable. Try again.'}), 500

@app.route('/api/history/<session_id>', methods=['GET'])
def get_history(session_id):
    return jsonify({
        'session_id': session_id,
        'history': conversations.get(session_id, []),
        'count': len(conversations.get(session_id, []))
    })

@app.route('/api/clear/<session_id>', methods=['DELETE'])
def clear_history(session_id):
    if session_id in conversations:
        del conversations[session_id]
    if session_id in chatbot.chat_sessions:
        del chatbot.chat_sessions[session_id]
    return jsonify({'message': 'Memory purged.'})

@app.route('/api/sessions', methods=['GET'])
def list_sessions():
    """List all active sessions"""
    return jsonify({
        'sessions': list(conversations.keys()),
        'total': len(conversations)
    })

def start_frontend():
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': return
    try:
        frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
        subprocess.Popen(['cmd', '/c', f'cd /d {frontend_dir} && npm run dev'],
                        shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        logger.info("Frontend bridge established.")
    except Exception as e:
        logger.error(f"Frontend failed: {e}")

def open_browser():
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true': return
    time.sleep(5)
    webbrowser.open('http://localhost:3000')

if __name__ == '__main__':
    # Start auxiliary services only in the main thread
    start_frontend()
    
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    
    logger.info("Zypher AI Core Online. Listening on Port 5000.")
    app.run(debug=True, host='0.0.0.0', port=5000)
