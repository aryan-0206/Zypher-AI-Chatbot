# API Testing Examples

This file contains examples for testing the chatbot API endpoints.

## Using cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, chatbot!",
    "session_id": "test_session_123"
  }'
```

### Get History
```bash
curl http://localhost:5000/api/history/test_session_123
```

### Clear History
```bash
curl -X DELETE http://localhost:5000/api/clear/test_session_123
```

### List Sessions
```bash
curl http://localhost:5000/api/sessions
```

## Using Python Requests

```python
import requests

BASE_URL = "http://localhost:5000/api"

# Health check
response = requests.get(f"{BASE_URL}/health")
print(response.json())

# Send message
response = requests.post(
    f"{BASE_URL}/chat",
    json={
        "message": "Tell me about AI",
        "session_id": "python_session"
    }
)
print(response.json())

# Get history
response = requests.get(f"{BASE_URL}/history/python_session")
print(response.json())
```

## Using JavaScript (Fetch)

```javascript
const BASE_URL = 'http://localhost:5000/api';

// Send message
async function sendMessage(message, sessionId) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      session_id: sessionId
    })
  });
  
  const data = await response.json();
  console.log(data);
  return data;
}

// Get history
async function getHistory(sessionId) {
  const response = await fetch(`${BASE_URL}/history/${sessionId}`);
  const data = await response.json();
  console.log(data);
  return data;
}

// Usage
sendMessage('Hello!', 'js_session');
```

## Testing Scenarios

### Scenario 1: Basic Conversation
```bash
# Message 1
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "scenario1"}'

# Message 2
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you do?", "session_id": "scenario1"}'

# Check history
curl http://localhost:5000/api/history/scenario1
```

### Scenario 2: Multiple Sessions
```bash
# Session 1
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi", "session_id": "user1"}'

# Session 2
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "user2"}'

# List all sessions
curl http://localhost:5000/api/sessions
```

### Scenario 3: Error Handling
```bash
# Empty message (should return 400)
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "", "session_id": "test"}'

# Non-existent session (should return 404)
curl -X DELETE http://localhost:5000/api/clear/nonexistent
```

## Expected Responses

### Successful Chat Response
```json
{
  "response": "Hello! How can I assist you today?",
  "timestamp": "2024-01-30T12:00:00",
  "session_id": "test_session"
}
```

### History Response
```json
{
  "session_id": "test_session",
  "history": [
    {
      "user": "Hello",
      "bot": "Hi there!",
      "timestamp": "2024-01-30T12:00:00"
    }
  ],
  "message_count": 1
}
```

### Error Response
```json
{
  "error": "Message cannot be empty"
}
```

## Load Testing

### Using Apache Bench
```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 -p message.json -T application/json \
  http://localhost:5000/api/chat
```

### Using Python
```python
import concurrent.futures
import requests
import time

def send_test_message(i):
    response = requests.post(
        'http://localhost:5000/api/chat',
        json={'message': f'Test message {i}', 'session_id': f'load_test_{i}'}
    )
    return response.status_code

# Run 100 concurrent requests
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(send_test_message, i) for i in range(100)]
    results = [f.result() for f in concurrent.futures.as_completed(futures)]

print(f"Successful requests: {results.count(200)}/{len(results)}")
```
