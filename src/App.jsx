import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://server.rretrocar.ge', {
  withCredentials: true,
  transports: ['websocket', 'polling'], // Prefer WebSocket, fallback to polling
  reconnection: true, // Enable auto-reconnection
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Fetch initial chat history
    const fetchMessages = () => {
      fetch('https://server.rretrocar.ge/messages', {
        method: 'GET',
        credentials: 'include',
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          console.log('Fetched messages:', data);
          setMessages(data);
        })
        .catch((error) => console.error('Error fetching messages:', error));
    };

    fetchMessages();

    // Fallback polling for missed messages
    const pollInterval = setInterval(fetchMessages, 30000); // Poll every 30 seconds

    // Handle real-time messages
    socket.on('chat message', (data) => {
      console.log('Received message:', data);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === data.id)) {
          console.log('Duplicate message ignored:', data.id);
          return prev;
        }
        return [...prev, data];
      });
    });

    // Log connection status
    socket.on('connect', () => console.log('Socket.IO connected'));
    socket.on('connect_error', (error) => console.error('Socket.IO error:', error));
    socket.on('reconnect', (attempt) => console.log(`Socket.IO reconnected after ${attempt} attempts`));
    socket.on('reconnect_error', (error) => console.error('Socket.IO reconnect error:', error));

    // Cleanup
    return () => {
      socket.off('chat message');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('reconnect');
      socket.off('reconnect_error');
      clearInterval(pollInterval);
    };
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
      console.log('Sending message:', input);
      socket.emit('chat message', input);
      setInput('');
    }
  };

  return (
    <div className="terminal-container">
      <h1 className="terminal-header">TERMINAL v1.0</h1>
      <div className="terminal-box">
        {messages.map((msg) => (
          <div key={msg.id} className="terminal-message">
            <span className="terminal-ip">{msg.ip}:</span> {msg.message}
          </div>
        ))}
      </div>
      <div className="terminal-input-box">
        <input
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button className="terminal-button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;