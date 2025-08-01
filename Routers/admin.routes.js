import express from "express";

import AdminAuthController from "../Controllers/AdminControllers/admin.auth.controller.js";
import AdminController from "../Controllers/AdminControllers/admin.controller.js";
import jwtAdminAuth from "../middlewares/Auth/admin.auth.middleware.js";

const adminRouter = express.Router();

const adminAuthController = new AdminAuthController();
const adminController = new AdminController();

adminRouter.get("/", (req, res) => {
  res.send("Welcome to Zest Agri Admin APIs");
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

adminRouter.post("/onboard-farmer", jwtAdminAuth, (req, res) => {
  adminController.onboardFarmer(req, res);
});

adminRouter.get("/upcoming-harvests", jwtAdminAuth, (req, res) => {
  adminController.getAllUpcomingHarvest(req, res);
});

adminRouter.post("/accept-and-add-to-inventory", jwtAdminAuth, (req, res) => {
  adminController.acceptAndAddToInventory(req, res);
});

adminRouter.get("/get-main-inventory-details", jwtAdminAuth, (req, res) => {
  adminController.getMainInventoryDetails(req, res);
});

adminRouter.post("/process-seeds-to-makhana", jwtAdminAuth, (req, res) => {
  adminController.processSeedsToMakhana(req, res);
});

adminRouter.get(
  "/get-processed-seed-to-makhana-inventory-details",
  jwtAdminAuth,
  (req, res) => {
    adminController.getProcessedSeedToMakhanaInventoryDetails(req, res);
  }
);

export default adminRouter;
