import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended socket interface with user data
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

// Store connected users and their socket IDs
const connectedUsers = new Map<string, string>(); // userId -> socketId

export const initializeSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
      const decoded = jwt.verify(token as string, jwtSecret) as {
        userId: string;
        name: string;
      };

      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userName} (${socket.userId})`);

    // Store user's socket connection
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);

      // Broadcast user's online status to their matches
      broadcastUserStatus(io, socket.userId, true);
    }

    // Join match room for private messaging
    socket.on("join_match", async (matchId: string) => {
      try {
        if (!socket.userId) return;

        // Verify user is part of this match
        const match = await prisma.match.findFirst({
          where: {
            id: matchId,
            OR: [{ user1_id: socket.userId }, { user2_id: socket.userId }],
          },
        });

        if (!match) {
          socket.emit("error", {
            message: "Not authorized to join this match",
          });
          return;
        }

        socket.join(`match:${matchId}`);
        console.log(`👥 User ${socket.userName} joined match room: ${matchId}`);

        // Notify other user in the match that someone joined
        socket.to(`match:${matchId}`).emit("user_joined", {
          userId: socket.userId,
          userName: socket.userName,
          matchId,
        });
      } catch (error) {
        console.error("Join match error:", error);
        socket.emit("error", { message: "Failed to join match room" });
      }
    });

    // Leave match room
    socket.on("leave_match", (matchId: string) => {
      socket.leave(`match:${matchId}`);
      console.log(`👋 User ${socket.userName} left match room: ${matchId}`);

      socket.to(`match:${matchId}`).emit("user_left", {
        userId: socket.userId,
        userName: socket.userName,
        matchId,
      });
    });

    // Handle typing indicators
    socket.on("typing", (data: { matchId: string; isTyping: boolean }) => {
      socket.to(`match:${data.matchId}`).emit("typing", {
        userId: socket.userId,
        userName: socket.userName,
        isTyping: data.isTyping,
      });
    });

    // Handle sending messages
    socket.on(
      "send_message",
      async (data: { matchId: string; content: string; tempId?: string }) => {
        try {
          if (!socket.userId) {
            socket.emit("error", { message: "Not authenticated" });
            return;
          }

          const { matchId, content } = data;

          // Verify user is part of this match
          const match = await prisma.match.findFirst({
            where: {
              id: matchId,
              OR: [{ user1_id: socket.userId }, { user2_id: socket.userId }],
            },
          });

          if (!match) {
            socket.emit("error", { message: "Match not found" });
            return;
          }

          // Create message in database
          const message = await prisma.message.create({
            data: {
              match_id: matchId,
              sender_id: socket.userId,
              content: content.trim(),
            },
            include: {
              sender: {
                select: { id: true, name: true, avatar: true },
              },
            },
          });

          // Broadcast message to all users in the match room
          io.to(`match:${matchId}`).emit("new_message", message);

          // Send confirmation to sender
          socket.emit("message_sent", {
            messageId: message.id,
            tempId: data.tempId,
          });

          console.log(
            `💬 Message sent in match ${matchId} by ${socket.userName}`,
          );
        } catch (error) {
          console.error("Send message error:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    // Handle message read status
    socket.on(
      "mark_read",
      async (data: { messageId: string; matchId: string }) => {
        try {
          if (!socket.userId) return;

          const { messageId, matchId } = data;

          // Verify the message exists and user is part of the match
          const message = await prisma.message.findFirst({
            where: {
              id: messageId,
              match_id: matchId,
              match: {
                OR: [{ user1_id: socket.userId }, { user2_id: socket.userId }],
              },
            },
          });

          if (!message) {
            socket.emit("error", { message: "Message not found" });
            return;
          }

          // Don't mark own messages as read
          if (message.sender_id === socket.userId) {
            return;
          }

          // Update message as read
          await prisma.message.update({
            where: { id: messageId },
            data: { is_read: true },
          });

          // Broadcast read status to the match room
          io.to(`match:${matchId}`).emit("message_read", {
            messageId,
            readBy: socket.userId,
          });

          console.log(
            `👁️ Message ${messageId} marked as read by ${socket.userName}`,
          );
        } catch (error) {
          console.error("Mark read error:", error);
          socket.emit("error", { message: "Failed to mark message as read" });
        }
      },
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(
        `🔌 User disconnected: ${socket.userName} (${socket.userId})`,
      );

      if (socket.userId) {
        connectedUsers.delete(socket.userId);

        // Broadcast user's offline status
        broadcastUserStatus(io, socket.userId, false);
      }
    });
  });

  return io;
};

// Helper function to broadcast user online/offline status
async function broadcastUserStatus(
  io: SocketIOServer,
  userId: string,
  isOnline: boolean,
) {
  try {
    // Find all matches where this user is a participant
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1_id: userId }, { user2_id: userId }],
      },
    });

    // Broadcast status to all match rooms
    matches.forEach((match) => {
      const otherUserId =
        match.user1_id === userId ? match.user2_id : match.user1_id;
      io.to(`match:${match.id}`).emit("user_status", {
        userId,
        isOnline,
        otherUserId,
      });
    });
  } catch (error) {
    console.error("Broadcast status error:", error);
  }
}

// Helper function to get connected users count
export const getConnectedUsersCount = (): number => {
  return connectedUsers.size;
};

// Helper function to check if a user is online
export const isUserOnline = (userId: string): boolean => {
  return connectedUsers.has(userId);
};
