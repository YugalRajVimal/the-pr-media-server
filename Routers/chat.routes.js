// routes/chatRoutes.js
import express from "express";
import CustomerModel from "../Schema/customer.schema.js";

const chatRouter = express.Router();

// Get all chats (admin view)
chatRouter.get("/", async (req, res) => {
  try {
    // Calculate the cutoff time (48 hours ago)
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours in milliseconds

    // Delete chats from db older than 48 hours for all customers
    await CustomerModel.updateMany(
      {}, // Apply to all customers
      {
        $pull: {
          privateChats: {
            timestamp: { $lt: cutoffTime }, // Remove messages older than cutoffTime
          },
        },
      }
    );

    const customers = await CustomerModel.find().select(
      "name email privateChats"
    );
    const chats = customers.map((c) => {
      const lastMessage = c.privateChats[c.privateChats.length - 1] || null;
      const unread = c.privateChats.filter(
        (m) => m.sender === "customer" && !m.read
      ).length;

      return {
        customerId: c._id.toString(),
        name: c.name,
        email: c.email,
        lastMessage: lastMessage ? lastMessage.text : null, // ✅ only text
        time: lastMessage ? lastMessage.timestamp : null, // ✅ timestamp
        unread, // ✅ match frontend
      };
    });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one customer chat history
chatRouter.get("/:customerId", async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.customerId).select(
      "name privateChats"
    );
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
chatRouter.post("/:customerId/messages", async (req, res) => {
  const { sender, text, name } = req.body;
  const message = { sender, text, timestamp: new Date(), name };

  const customer = await CustomerModel.findByIdAndUpdate(
    req.params.customerId,
    { $push: { privateChats: message } },
    { new: true }
  );

  // 🔹 Notify via WebSocket
  req.app.get("wss").broadcastMessage(req.params.customerId, message);

  res.json(message);
});

// Mark messages as read (admin reads all customer messages)
chatRouter.patch("/:customerId/read", async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    customer.privateChats.forEach((msg) => {
      if (msg.sender === "customer") msg.read = true;
    });

    await customer.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default chatRouter;
