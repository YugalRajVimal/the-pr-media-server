// controllers/admin.controller.js
import sharp from "sharp";
import path from "path";
import fs from "fs";

import AdminModel from "../../Schema/admin.schema.js";
import { deleteCompressedFiles } from "../../middlewares/fileDelete.middleware.js";
import CustomerModel from "../../Schema/customer.schema.js";

const uploadDir = "./uploads/";

class AdminController {
  uploadNameComents = async (req, res) => {
    const { nameComments } = req.body;
    try {
      const admin = await AdminModel.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      admin.nameComments.push(...nameComments);
      await admin.save();
      res
        .status(200)
        .json({ message: "Name and comments uploaded successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  getAllNameComments = async (req, res) => {
    try {
      const admin = await AdminModel.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      res.status(200).json({ nameComments: admin.nameComments });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  deleteAllNameComments = async (req, res) => {
    try {
      const admin = await AdminModel.findById(req.user.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      admin.nameComments = [];
      await admin.save();
      res
        .status(200)
        .json({ message: "All name and comments deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  uploadImages = async (req, res) => {
    const compressedImagePaths = [];

    try {
      const adminId = req.user.id; // assuming JWT provides it
      // console.log("Checking if files are uploaded...");
      if (!req.files || req.files.length === 0) {
        // console.log("No files uploaded");
        return res.status(400).json({ message: "No files uploaded" });
      }

      // console.log("Checking if upload directory exists...");
      if (!fs.existsSync(uploadDir)) {
        // console.log("Upload directory does not exist, creating it...");
        fs.mkdirSync(uploadDir);
      }

      for (const file of req.files) {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        const outputPath = path.join(uploadDir, filename);

        // console.log(`Processing file: ${file.originalname}`);
        await sharp(file.buffer)
          .resize({ width: 1024 }) // Resize
          .jpeg({ quality: 80 }) // Compress
          .toFile(outputPath);

        compressedImagePaths.push(outputPath);
        // console.log(`File processed and saved: ${outputPath}`);
      }

      // console.log("Finding admin by ID...");
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        // console.log("Admin not found, cleaning up files...");
        deleteCompressedFiles(compressedImagePaths);
        return res.status(404).json({ message: "Admin not found" });
      }

      // console.log("Saving images paths to admin document...");
      admin.imagesPath.push(...compressedImagePaths);
      await admin.save();

      // console.log("Images uploaded and compressed successfully");
      res.status(200).json({
        message: "Images uploaded and compressed successfully",
        paths: compressedImagePaths,
      });
    } catch (error) {
      // console.error("Upload error:", error);
      // Cleanup files on error
      // console.log("Cleaning up files due to error...");
      deleteCompressedFiles(compressedImagePaths);

      res.status(500).json({
        message: "Image upload failed",
        error: error.message,
      });
    }
  };

  getUploadedImages = async (req, res) => {
    try {
      const adminId = req.user.id;
      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      return res.status(200).json({ images: admin.imagesPath });
    } catch (error) {
      console.error("Error fetching uploaded images:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  deleteAllImages = async (req, res) => {
    try {
      const adminId = req.user.id;

      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Convert image paths to file objects with `path` field for deletion
      const filesToDelete = admin.imagesPath.map((filePath) => ({
        path: `./${filePath}`,
      }));

      // Clear image paths from DB
      admin.imagesPath = [];
      await admin.save();

      // Delete files from filesystem
      deleteCompressedFiles(filesToDelete);

      console.log("All images deleted successfully and uploads folder emptied");
      return res.status(200).json({
        message: "All images deleted successfully and uploads folder emptied",
      });
    } catch (error) {
      console.error("Error deleting images or emptying uploads folder:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  getAllUserList = async (req, res) => {
    try {
      const users = await CustomerModel.find();
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
      return res.status(200).json({ users });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };

  approveUser = async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await CustomerModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      user.approved = true;
      await user.save();
      return res.status(200).json({ message: "User approved successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };
}

export default AdminController;
