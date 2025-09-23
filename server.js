import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes.js";
import { connectUsingMongoose } from "./config/mongoose.config.js";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import "./config/passport.config.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import CustomerAuthController from "./Controllers/CustomerControllers/Customer.auth.controller.js";
import AdminModel from "./Schema/admin.schema.js";

import { initWebSocket } from "./WebSocketServer/webSocket.js";
// import "./WebSocketServer/wsServer.js";
// wsServer.js
import { WebSocketServer } from "ws";
import http from "http";

const port = process.env.PORT || 9090;

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);

app.use(
  session({
    secret: "your_secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://theprmedia.com",
      "https://www.theprmedia.com",
    ],
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const customerControllers = new CustomerAuthController();

setInterval(async () => {
  const newCount = customerControllers.getLivePeopleCount();

  try {
    await AdminModel.findOneAndUpdate(
      {}, // You might need a filter like { role: 'admin' } or `{ _id: YOUR_ADMIN_ID }`
      { liveCount: newCount },
      { new: true, upsert: true }
    );
  } catch (error) {
    console.error("Error updating live count:", error.message);
  }
}, 10000);

// old Google auth route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}`, // Adjust to your frontend login page
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // If using MongoDB, ensure user has _id (else adjust accordingly)
      const token = jwt.sign(
        {
          id: user._id || user.id,
          email: user.email,
          role: user.role || "customer",
        },
        process.env.JWT_SECRET
        // Optional expiry
        // { expiresIn: "24h" }
      );

      // Set HTTP-only JWT token cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // true in production (HTTPS)
        // secure: process.env.NODE_ENV==production, // true in production (HTTPS)
        // sameSite: "Lax", // Or 'None' if cross-site
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      // Optional: Set flag readable by frontend
      res.cookie("isCustomerAuthenticated", true, {
        httpOnly: true,
        secure: true,
        // sameSite: "Lax",
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend route (e.g., dashboard)
      res.redirect(
        `${process.env.FRONTEND_URL}/oauth-success?token=${token}&name=${user.name}&email=${user.email}`
      );

      // res.redirect(`${process.env.FRONTEND_URL}/`); // change if needed
    } catch (err) {
      console.error("Google OAuth callback error:", err);
      res.redirect(`${process.env.FRONTEND_URL}?error=oauth-failed`);
    }
  }
);

app.get("/", (req, res) => {
  res.send("Welcome to The PR Media Server");
});

// Required for __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", router);

const wss = new WebSocketServer({ server });

function heartbeat() {
  this.isAlive = true;
}

// 🔹 Interval that checks all clients every 30s
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log("Terminating dead connection");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(); // send ping (client should reply with pong automatically)
  });
}, 30000);

wss.on("connection", (ws) => {
  console.log("Client Connected");

  // mark as alive when connected
  ws.isAlive = true;

  // when a pong is received, mark alive again
  ws.on("pong", heartbeat);

  // ws.on("message", (message) => {
  //   // Handle messages here if needed
  // });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// cleanup interval on server shutdown
wss.on("close", () => {
  clearInterval(interval);
});

// wss.on("connection", (ws) => {
//   console.log("Client Connected");
//   //   ws.send(JSON.stringify({ name: "YRV", comment: "Hello world" }));

//   ws.on("message", (message) => {
//     // ws.send(`Server got: ${message}`);
//   });

//   ws.on("close", () => console.log("Client disconnected"));
// });

// Broadcast helper
export function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

export default wss;

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  connectUsingMongoose();
  customerControllers.startRandomBroadcast();
});

initWebSocket(wss, app);
