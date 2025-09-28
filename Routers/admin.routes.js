import express from "express";

import AdminAuthController from "../Controllers/AdminControllers/admin.auth.controller.js";
import AdminController from "../Controllers/AdminControllers/admin.controller.js";
import jwtAdminAuth from "../middlewares/Auth/admin.auth.middleware.js";
import { upload } from "../middlewares/fileUpload.middleware.js";
import { uploadVideo } from "../middlewares/videoUpload.middleware.js";

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

adminRouter.post("/delete-duplicate-comments", jwtAdminAuth, (req, res) => {
  adminController.deleteDuplicateComments(req, res);
});

// route
// adminRouter.post(
//   "/upload-images",
//   jwtAdminAuth,
//   upload.array("images", 10),
//   (req, res) => {
//     adminController.uploadImages(req, res);
//   }
// );

// routes/adminRouter.js
adminRouter.post(
  "/upload-images",
  jwtAdminAuth,
  (req, res, next) => {
    upload.array("images", 10)(req, res, function (err) {
      if (err) {
        console.error("Upload error:", err.message);
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    adminController.uploadImages(req, res);
  }
);

adminRouter.get("/get-uploaded-images", jwtAdminAuth, (req, res) => {
  adminController.getUploadedImages(req, res);
});

adminRouter.get("/get-uploaded-videos", jwtAdminAuth, (req, res) => {
  adminController.getUploadedVideos(req, res);
});

adminRouter.post(
  "/upload-video",
  jwtAdminAuth,
  uploadVideo.single("video"), // ✅ single
  (req, res) => {
    adminController.uploadVideo(req, res);
  }
);

adminRouter.delete("/delete-all-images", jwtAdminAuth, (req, res) => {
  adminController.deleteAllImages(req, res);
});

adminRouter.delete("/delete-all-videos", jwtAdminAuth, (req, res) => {
  adminController.deleteAllVideos(req, res);
});

adminRouter.get("/get-all-users", jwtAdminAuth, (req, res) => {
  adminController.getAllUserList(req, res);
});

adminRouter.put("/approve-user/:id", jwtAdminAuth, (req, res) => {
  adminController.approveUser(req, res);
});

export default adminRouter;
