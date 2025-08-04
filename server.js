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

const port = process.env.PORT || 8080;

const app = express();

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
    credentials: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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
      res.redirect(`${process.env.FRONTEND_URL}/`); // change if needed
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
  connectUsingMongoose();
});
