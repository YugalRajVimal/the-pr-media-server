import CustomerModel from "../Schema/customer.schema.js";

// websocket.js
export function initWebSocket(wss, app) {
  const onlineUsers = new Map();

  wss.broadcastMessage = (customerId, message) => {
    const customerSocket = onlineUsers.get(customerId);
    if (customerSocket) {
      customerSocket.send(
        JSON.stringify({ type: "new_message", customerId, message })
      );
    }
    const adminSocket = onlineUsers.get("admin");
    if (adminSocket) {
      adminSocket.send(
        JSON.stringify({ type: "new_message", customerId, message })
      );
    }
  };

  wss.on("connection", (ws, req) => {
    console.log("New WS connection");

    ws.on("message", async (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.type === "private_message") {
          console.log("message - revieving");
          const customerId = ws.userKey;
          const message = {
            sender: "customer",
            text: data.message.text,
            timestamp: new Date(),
          };

          await CustomerModel.findByIdAndUpdate(customerId, {
            $push: { privateChats: message },
          });

          wss.broadcastMessage(customerId, message);
        }

        if (data.type === "mark_read") {
          console.log("hit");
          try {
            await CustomerModel.updateOne(
              { _id: data.customerId },
              { $set: { "privateChats.$[elem].read": true } },
              {
                arrayFilters: [
                  { "elem.read": false, "elem.sender": "customer" },
                ],
              } // ✅ fix: mark *customer* messages read
            );

            // notify admin to clear badge
            const adminSocket = onlineUsers.get("admin");
            if (adminSocket) {
              adminSocket.send(
                JSON.stringify({
                  type: "messages_read",
                  customerId: data.customerId,
                })
              );
            }
          } catch (err) {
            console.error("Failed to mark messages read:", err);
          }
        }

        if (data.type === "register") {
          const key = data.role === "admin" ? "admin" : data.id;
          onlineUsers.set(key, ws);
          ws.userKey = key;

          if (data.role === "customer" && onlineUsers.get("admin")) {
            onlineUsers
              .get("admin")
              .send(
                JSON.stringify({ type: "customer_online", customerId: data.id })
              );
          }
        }

        if (data.type === "typing") {
          const adminSocket = onlineUsers.get("admin");
          if (adminSocket) {
            adminSocket.send(
              JSON.stringify({ type: "typing", customerId: data.customerId })
            );
          }
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    });

    ws.on("close", () => {
      if (ws.userKey) {
        onlineUsers.delete(ws.userKey);
        console.log("User disconnected:", ws.userKey);
      }
    });
  });

  app.set("wss", wss);
}
