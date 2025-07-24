import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://server.rretrocar.ge');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Fetch initial chat history
    fetch('https://server.rretrocar.ge/messages')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch messages');
        return res.json();
      })
      .then((data) => setMessages(data))
      .catch((error) => console.error('Error fetching messages:', error));

    // Handle real-time messages
    socket.on('chat message', (data) => {
      setMessages((prev) => {
        // Avoid duplicates by checking if message ID already exists
        if (prev.some((msg) => msg.id === data.id)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    // Cleanup socket listener
    return () => socket.off('chat message');
  }, []);

  const sendMessage = () => {
    if (input.trim()) {
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