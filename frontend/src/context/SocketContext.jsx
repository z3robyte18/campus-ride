import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user) {
      socketRef.current = io('https://campus-ride-backend-9n9m.onrender.com', { transports: ['websocket'] });
      socketRef.current.on('connect', () => {
        setConnected(true);
        socketRef.current.emit('register', user._id);
      });
      socketRef.current.on('disconnect', () => setConnected(false));
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  const emit = (event, data) => {
    if (socketRef.current) socketRef.current.emit(event, data);
  };

  const on = (event, callback) => {
    if (socketRef.current) socketRef.current.on(event, callback);
  };

  const off = (event) => {
    if (socketRef.current) socketRef.current.off(event);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, emit, on, off, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
