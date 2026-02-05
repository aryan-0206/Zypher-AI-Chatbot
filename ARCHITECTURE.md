# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                  │
│                    (Web Browser)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   FRONTEND                                    │
│                 (React + Vite)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  UI Components                                        │  │
│  │  - ChatMessage.jsx                                    │  │
│  │  - ChatInput.jsx                                      │  │
│  │  - App.jsx (Main Container)                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         │ REST API Calls                     │
│                         │ (Axios/Fetch)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Port 3000
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND                                    │
│                  (Flask + Python)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints                                        │  │
│  │  - POST /api/chat                                     │  │
│  │  - GET  /api/history/:id                              │  │
│  │  - DELETE /api/clear/:id                              │  │
│  │  - GET  /api/sessions                                 │  │
│  │  - GET  /api/health                                   │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │  ChatbotEngine (NLP)                                  │  │
│  │  - Intent Recognition                                 │  │
│  │  - Pattern Matching                                   │  │
│  │  - Response Generation                                │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │  Storage Layer                                        │  │
│  │  - In-Memory Dict (conversations)                     │  │
│  │  - Session Management                                 │  │
│  │  - [Future: Database Integration]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         │ Port 5000                          │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          │ [Optional Future Integrations]
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼────────┐              ┌──────────▼────────┐
│  OpenAI API    │              │  Anthropic API    │
│  (GPT-4)       │              │  (Claude)         │
└────────────────┘              └───────────────────┘
```

## Request Flow

### 1. User Sends Message
```
User Types Message → ChatInput Component → State Update
```

### 2. Frontend Processing
```
ChatInput.jsx
  ↓
  handleSubmit()
  ↓
  App.jsx sendMessage()
  ↓
  fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: userInput,
      session_id: sessionId
    })
  })
```

### 3. Backend Processing
```
Flask receives POST /api/chat
  ↓
  Extract message & session_id
  ↓
  ChatbotEngine.get_response(message)
  ↓
  ┌─ Check intent patterns
  │  - greeting?
  │  - goodbye?
  │  - help?
  │  - thanks?
  ├─ Match found → Return predefined response
  └─ No match → Generate contextual response
  ↓
  Store conversation in memory
  ↓
  Return JSON response
```

### 4. Response Display
```
Backend sends response
  ↓
  Frontend receives JSON
  ↓
  Create bot message object
  ↓
  Update messages state
  ↓
  ChatMessage component renders
  ↓
  User sees response
```

## Data Flow Diagram

```
┌────────────┐
│   User     │
│  (Browser) │
└──────┬─────┘
       │
       │ 1. Type message: "Hello"
       │
       ▼
┌──────────────┐
│  ChatInput   │
│  Component   │
└──────┬───────┘
       │
       │ 2. onSendMessage("Hello")
       │
       ▼
┌──────────────┐
│  App.jsx     │
│  (State)     │
└──────┬───────┘
       │
       │ 3. POST /api/chat
       │    { message: "Hello", session_id: "abc123" }
       │
       ▼
┌─────────────────────────────────────────┐
│          Flask Backend                   │
│  ┌─────────────────────────────────┐   │
│  │  @app.route('/api/chat')        │   │
│  │  def chat():                     │   │
│  │    message = request.json['msg']│   │
│  │    response = chatbot.get()     │   │
│  │    conversations[id].append()   │   │
│  │    return jsonify(response)     │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 │ 4. Response: { response: "Hi!", timestamp: "..." }
                 │
                 ▼
┌──────────────────┐
│  App.jsx         │
│  (Update State)  │
│  setMessages([   │
│    ...prev,      │
│    userMsg,      │
│    botMsg        │
│  ])              │
└────────┬─────────┘
         │
         │ 5. Re-render
         │
         ▼
┌────────────────┐
│  ChatMessage   │
│  Components    │
│  (Display)     │
└────────────────┘
```

## Component Architecture

### Frontend Components

```
App.jsx (Root)
  │
  ├─ State Management
  │    - messages: Message[]
  │    - isLoading: boolean
  │    - sessionId: string
  │
  ├─ Header
  │    └─ Clear Chat Button
  │
  ├─ Messages Container
  │    └─ ChatMessage[] (mapped)
  │         ├─ message-avatar (emoji)
  │         ├─ message-content
  │         │    ├─ message-text
  │         │    └─ message-time
  │         └─ CSS classes (user/bot)
  │
  └─ ChatInput
       ├─ textarea (input field)
       ├─ send button
       └─ onSubmit handler
```

### Backend Structure

```
app.py
  │
  ├─ Flask App Configuration
  │    - CORS setup
  │    - Port configuration
  │
  ├─ ChatbotEngine Class
  │    ├─ __init__()
  │    ├─ load_intents()
  │    ├─ get_response(message)
  │    └─ generate_contextual_response(message)
  │
  ├─ Data Storage
  │    └─ conversations: Dict[session_id, List[messages]]
  │
  └─ API Endpoints
       ├─ GET  /api/health
       ├─ POST /api/chat
       ├─ GET  /api/history/<id>
       ├─ DELETE /api/clear/<id>
       └─ GET  /api/sessions
```

## Technology Stack Details

### Frontend Stack
- **React 18**: Component library
- **Vite**: Build tool (faster than Webpack)
- **CSS3**: Styling with animations
- **Fetch API**: HTTP requests
- **ES6+ JavaScript**: Modern syntax

### Backend Stack
- **Flask 3.0**: Lightweight web framework
- **Flask-CORS**: Cross-origin support
- **Python 3.8+**: Programming language
- **JSON**: Data format for API

### Development Tools
- **npm/yarn**: Package management
- **pip**: Python package installer
- **Gunicorn**: Production server
- **Docker**: Containerization

## Deployment Architecture

### Docker Deployment
```
┌──────────────────────────────────────────┐
│         Docker Compose                    │
│  ┌────────────────┐  ┌────────────────┐ │
│  │  Frontend      │  │  Backend       │ │
│  │  (nginx:80)    │  │  (Flask:5000)  │ │
│  │                │←─│                │ │
│  │  - Serve dist/ │  │  - API routes  │ │
│  │  - Proxy /api  │  │  - NLP Engine  │ │
│  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────┘
           │
           │ Port Mapping
           ▼
    Host: localhost:80
```

### Production Deployment
```
┌─────────────────────────────────────────────┐
│              Load Balancer                   │
│              (nginx/HAProxy)                 │
└────────────┬───────────────────┬────────────┘
             │                   │
    ┌────────▼────────┐  ┌──────▼─────────┐
    │  Frontend       │  │  Backend       │
    │  Server 1       │  │  Server 1      │
    │  (React Build)  │  │  (Flask+Gunicorn)│
    └─────────────────┘  └────────┬───────┘
                                  │
                         ┌────────▼────────┐
                         │   Database      │
                         │   (PostgreSQL)  │
                         └─────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────┐
│         Security Layers                  │
│                                          │
│  1. HTTPS/SSL                            │
│     └─ Encrypt data in transit          │
│                                          │
│  2. CORS Configuration                   │
│     └─ Restrict allowed origins         │
│                                          │
│  3. Input Validation                     │
│     └─ Sanitize user input              │
│                                          │
│  4. Rate Limiting                        │
│     └─ Prevent abuse                    │
│                                          │
│  5. Environment Variables                │
│     └─ Hide sensitive data              │
│                                          │
│  6. Authentication (Future)              │
│     └─ JWT tokens                       │
└─────────────────────────────────────────┘
```

## Scaling Strategy

### Horizontal Scaling
```
        Load Balancer
              │
     ┌────────┼────────┐
     │        │        │
Frontend  Frontend  Frontend
  (x3)      (x3)      (x3)
     │        │        │
     └────────┼────────┘
              │
     ┌────────┼────────┐
     │        │        │
Backend   Backend   Backend
  (x5)      (x5)      (x5)
     │        │        │
     └────────┼────────┘
              │
          Database
         (Replicated)
```

This architecture supports:
- Easy horizontal scaling
- Microservices migration
- Cloud deployment
- Load balancing
- High availability
