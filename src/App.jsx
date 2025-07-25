import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';

const socket = io('https://server.rretrocar.ge');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  useEffect(() => {
  const handleOnlineUsers = (users) => {
    setOnlineUsers(users);
  };

  socket.on('online users', handleOnlineUsers);

  return () => {
    socket.off('online users', handleOnlineUsers);
  };
}, []);

  // handle input
  const handleTyping = () => {
    socket.emit('typing');
  };  

  // listen for typing
  useEffect(() => {
  const handleTypingEvent = (nickname) => {
    setTypingUser(nickname);
    setTimeout(() => setTypingUser(null), 4500); // fade out after 1.5s
  };

  socket.on('typing', handleTypingEvent);

  // Cleanup to prevent multiple listeners
  return () => {
    socket.off('typing', handleTypingEvent);
  };
}, []);

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

  useEffect(() => {
  const interval = setInterval(() => {
    const oneMinuteAgo = Date.now() - 60 * 1000;

    setMessages((prev) =>
      prev.filter((msg) => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime > oneMinuteAgo;
      })
    );
  }, 5000); // check every 5 seconds

  return () => clearInterval(interval);
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
      <div className="online-users">
        <strong>Online:</strong>{' '}
        {onlineUsers.length > 0 ? onlineUsers.join(', ') : 'No users'}
      </div>
      <div className="terminal-box">
        {messages.map((msg) => (
          <div key={msg.id} 
            className={`terminal-message ${
              msg.type === 'system' ? 'system-message' : ''
            }`}
          >
            {msg.type === 'system' ? (
      <em>{msg.message}</em>
    ) : (
      <>
        <div>
          <span className="terminal-ip">{msg.ip}:</span> {msg.message}
        </div>
        <div className="timestamp">
          &nbsp;:{formatDistanceToNow(new Date(msg.timestamp), {
            addSuffix: true,
          })}
        </div>
      </>
    )}
          </div>
          
        ))}
  
        {typingUser && (
          <div className="typing-indicator">{typingUser} is typing...</div>
        )}

      </div>
      <div className="terminal-input-box">
        <input
          className="terminal-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            handleTyping();
          }}
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