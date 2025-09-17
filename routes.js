import express from "express";
import adminRouter from "./Routers/admin.routes.js";
import customerRouter from "./Routers/customer.routes.js";
import chatRouter from "./Routers/chat.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to The PR Media Server APIs");
});

router.use("/admin", adminRouter);
router.use("/customer", customerRouter);
router.use("/chat", chatRouter);

export default router;
