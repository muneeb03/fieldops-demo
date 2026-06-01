import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 4000;
const CORS_ORIGIN = "http://localhost:3000";

let counter = 0;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.emit("counter-updated", counter);

  socket.on("increment-counter", () => {
    counter += 1;
    io.emit("counter-updated", counter);
    console.log(`Counter incremented to ${counter}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io server listening on http://localhost:${PORT}`);
});
