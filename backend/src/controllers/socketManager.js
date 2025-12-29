import { Server } from "socket.io";

// variables
const connections = {};
const messages = {};
const timeOnline = {};

    //socket server
    const connectToSocket = (server) => {
    const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // JOIN CALL
    socket.on("join-call", (path) => {
      console.log("User joining call:", socket.id, "Path:", path);
      
      if (!connections[path]) {
        connections[path] = [];
      }

      connections[path].push(socket.id);
      socket.room = path;
      timeOnline[socket.id] = new Date();

      console.log("Users in room:", connections[path]);
      connections[path].forEach((id) => {
        io.to(id).emit("user-joined", socket.id, connections[path]);
        console.log(`Sent user-joined to ${id}: new user=${socket.id}, all clients=${connections[path]}`);
      });
    });

    socket.on("signal", (toId, signalData) => {
      console.log("Signal from", socket.id, "to", toId);
      if (!toId) return;
      io.to(toId).emit("signal", socket.id, signalData);
    });

    // CHAT MESSAGE
    socket.on("chat-message", (data, sender) => {
      console.log("Chat message from", sender);
      const room = socket.room;
      if (!room) return;

      if (!messages[room]) {
        messages[room] = [];
      }

      messages[room].push({
        sender,
        data,
        socketId: socket.id,
      });

      connections[room]?.forEach((id) => {
        io.to(id).emit("chat-message", data, sender, socket.id);
      });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      const room = socket.room;
      if (!room || !connections[room]) return;

      connections[room] = connections[room].filter(
        (id) => id !== socket.id
      );

      console.log("Notifying remaining users:", connections[room]);
      connections[room].forEach((id) => {
        io.to(id).emit("user-left", socket.id);
      });

      if (connections[room].length === 0) {
        delete connections[room];
        delete messages[room];
        console.log("Deleted empty room:", room);
      }

      delete timeOnline[socket.id];
    });
  });

  return io;
};

export default connectToSocket;