import express from "express";

import AdminAuthController from "../Controllers/AdminControllers/admin.auth.controller.js";
import AdminController from "../Controllers/AdminControllers/admin.controller.js";
import jwtAdminAuth from "../middlewares/Auth/admin.auth.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";

const adminRouter = express.Router();

const adminAuthController = new AdminAuthController();
const adminController = new AdminController();

adminRouter.get("/", (req, res) => {
  res.send("Welcome to The PR Media Admin APIs");
});

adminRouter.post("/auth", (req, res) => {
  adminAuthController.checkAuth(req, res);
});

adminRouter.post("/signin", (req, res) => {
  adminAuthController.signin(req, res);
});

adminRouter.post("/verify-account", (req, res) => {
  adminAuthController.verifyAccount(req, res);
});

adminRouter.post("/change-password", jwtAdminAuth, (req, res) => {
  adminAuthController.changePassword(req, res);
});

adminRouter.post("/reset-password", (req, res) => {
  adminAuthController.resetPassword(req, res);
});

adminRouter.post("/upload-name-comments", jwtAdminAuth, (req, res) => {
  adminController.uploadNameComents(req, res);
});

adminRouter.get("/get-all-name-comments", jwtAdminAuth, (req, res) => {
  adminController.getAllNameComments(req, res);
});

adminRouter.delete("/delete-all-name-comments", jwtAdminAuth, (req, res) => {
  adminController.deleteAllNameComments(req, res);
});

// route
adminRouter.post(
  "/upload-images",
  jwtAdminAuth,
  upload.array("images", 10),
  (req, res) => {
    adminController.uploadImages(req, res);
  }
);

adminRouter.get("/get-uploaded-images", jwtAdminAuth, (req, res) => {
  adminController.getUploadedImages(req, res);
});

adminRouter.delete("/delete-all-images", jwtAdminAuth, (req, res) => {
  adminController.deleteAllImages(req, res);
});


adminRouter.get("/get-all-users", jwtAdminAuth, (req, res) => {
  adminController.getAllUserList(req, res);
});

adminRouter.put("/approve-user/:id", jwtAdminAuth, (req, res) => {
  adminController.approveUser(req, res);
});


export default adminRouter;
