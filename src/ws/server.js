import { WebSocket, WebSocketServer } from "ws";

const sendJson = (socket, payload) => {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(payload));
};

const broadcast = (wss, payload) => {
  for (const clients of wss.clients) {
    if (clients.readyState !== WebSocket.OPEN) return;

    clients.send(JSON.stringify(payload));
  }
};

export const attachWebSocketServer = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendJson(socket, { type: "welcome" });

    socket.on("error", console.error);
  });

  const broadcastMatchCreated = (match) => {
    broadcast(wss, { type: "match_create", data: match });
  };
  return { broadcastMatchCreated };
};
