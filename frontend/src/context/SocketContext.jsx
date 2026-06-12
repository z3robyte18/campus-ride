import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Re-register on every connect/reconnect so server always knows this user's socket
      socket.emit('register', user._id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('reconnect', () => {
      setConnected(true);
      socket.emit('register', user._id);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const emit = (event, data) => {
    if (socketRef.current?.connected) socketRef.current.emit(event, data);
  };

  const on = (event, callback) => {
    if (socketRef.current) socketRef.current.on(event, callback);
  };

  const off = (event, callback) => {
    if (socketRef.current) socketRef.current.off(event, callback);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, emit, on, off, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
