import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';


const socket = io('https://server.rretrocar.ge');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch('https://server.rretrocar.ge/messages')
      .then(res => res.json())
      .then(data => setMessages(data));

    socket.on('chat message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

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
        {messages.map((msg, i) => (
          <div key={i} className="terminal-message">
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
        <button
          className="terminal-button"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;