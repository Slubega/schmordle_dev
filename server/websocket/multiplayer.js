const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const rooms = new Map(); // roomId -> Set of sockets

function broadcast(roomId, data) {
  const clients = rooms.get(roomId);
  if (!clients) return;

  const message = JSON.stringify(data);

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

exports.initWebsocket = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (socket) => {
    socket.id = uuidv4();

    socket.on("message", (msg) => {
      let data = {};
      try {
        data = JSON.parse(msg);
      } catch {
        return;
      }

      const { type, roomId, payload } = data;

      switch (type) {
        case "join-room":
          if (!rooms.has(roomId)) rooms.set(roomId, new Set());
          rooms.get(roomId).add(socket);
          socket.roomId = roomId;

          broadcast(roomId, {
            type: "player-joined",
            payload: { id: socket.id },
          });
          break;

        case "guess":
          broadcast(roomId, {
            type: "guess",
            payload,
          });
          break;

        case "leave-room":
          if (!rooms.has(roomId)) return;
          rooms.get(roomId).delete(socket);
          break;

        default:
          console.log("Unknown WS type:", type);
      }
    });

    socket.on("close", () => {
      const roomId = socket.roomId;
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket);
      }
    });
  });
};
