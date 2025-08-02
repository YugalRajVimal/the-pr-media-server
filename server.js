import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import router from "./routes.js";
import { connectUsingMongoose } from "./config/mongoose.config.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 8080;

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
