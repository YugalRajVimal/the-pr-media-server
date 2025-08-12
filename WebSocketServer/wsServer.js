// wsServer.js
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8090 });

wss.on("connection", (ws) => {
  console.log("Client Connected");
  //   ws.send(JSON.stringify({ name: "YRV", comment: "Hello world" }));

  ws.on("message", (message) => {
    // ws.send(`Server got: ${message}`);
  });

  ws.on("close", () => console.log("Client disconnected"));
});

// Broadcast helper
// Broadcast helper
export function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export default wss;
