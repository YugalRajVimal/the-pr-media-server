import express from "express";

const customerRouter = express.Router();

customerRouter.get("/", (req, res) => {
  res.send("Welcome to The PR Media Customer APIs");
});

import CustomerAuthController from "../Controllers/CustomerControllers/Customer.auth.controller.js";
import jwtAuth from "../middlewares/Auth/auth.middleware.js";

const customerAuthController = new CustomerAuthController();

customerRouter.post("/signin", customerAuthController.signin);
customerRouter.post("/signup", customerAuthController.signup);
customerRouter.post("/auth", jwtAuth, customerAuthController.checkAuth);
customerRouter.post("/reset-password", customerAuthController.resetPassword);
customerRouter.post("/verify-account", customerAuthController.verifyAccount);

customerRouter.get(
  "/get-all-name-comment-and-images-combined",
  customerAuthController.getAllNameCommentAndImagesCombined
);

export default customerRouter;
