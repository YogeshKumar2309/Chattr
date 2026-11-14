import { createServer } from "http";
import { Server } from "socket.io";
import { registerSocket } from "./src/server/socket";

const port = Number(process.env.PORT || 4000);
const origins = process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()).filter(Boolean);

const httpServer = createServer((req, res) => {
  // Vercel API routes yahan se live "friends:update" trigger karte hain
  if (req.method === "POST" && req.url === "/notify") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 2000) req.destroy();
    });
    req.on("end", () => {
      try {
        const { uid, secret } = JSON.parse(body);
        if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET || typeof uid !== "string") {
          res.writeHead(403).end();
          return;
        }
        io.to(`user:${uid}`).emit("friends:update");
        res.writeHead(200).end("ok");
      } catch {
        res.writeHead(400).end();
      }
    });
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" }).end("stranger signaling ok");
});

const io = new Server(httpServer, {
  cors: { origin: origins?.length ? origins : true },
  maxHttpBufferSize: 64 * 1024,
});
registerSocket(io);

httpServer.listen(port, "0.0.0.0", () => console.log(`> signaling server on :${port}`));
