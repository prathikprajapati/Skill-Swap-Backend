import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/app/contexts/AuthContext";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  sendMessage: (matchId: string, content: string, tempId?: string) => void;
  sendTyping: (matchId: string, isTyping: boolean) => void;
  markMessageAsRead: (messageId: string, matchId: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsConnected(false);
      return;
    }

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("🔌 Socket connected");
      setIsConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("join_match", matchId);
    }
  }, []);

  const leaveMatch = useCallback((matchId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_match", matchId);
    }
  }, []);

  const sendMessage = useCallback(
    (matchId: string, content: string, tempId?: string) => {
      if (socketRef.current) {
        socketRef.current.emit("send_message", { matchId, content, tempId });
      }
    },
    [],
  );

  const sendTyping = useCallback((matchId: string, isTyping: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit("typing", { matchId, isTyping });
    }
  }, []);

  const markMessageAsRead = useCallback(
    (messageId: string, matchId: string) => {
      if (socketRef.current) {
        socketRef.current.emit("mark_read", { messageId, matchId });
      }
    },
    [],
  );

  return {
    socket: socketRef.current,
    isConnected,
    joinMatch,
    leaveMatch,
    sendMessage,
    sendTyping,
    markMessageAsRead,
  };
};
