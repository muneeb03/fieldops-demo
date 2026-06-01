import { createServer } from "http";
import { Server } from "socket.io";

const PORT = Number(process.env.PORT) || 4000;
// Comma-separated, e.g. http://localhost:3000,https://fieldops-demo.vercel.app
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

let counter = 0;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
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

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.io server listening on port ${PORT}`);
  console.log(`CORS origins: ${corsOrigins.join(", ")}`);
});
