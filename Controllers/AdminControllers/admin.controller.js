// controllers/admin.controller.js
import sharp from "sharp";
import path from "path";
import fs from "fs";

import AdminModel from "../../Schema/admin.schema.js";
import { deleteCompressedFiles } from "../../middlewares/fileDelete.middleware.js";
import CustomerModel from "../../Schema/customer.schema.js";
import mongoose from "mongoose";

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

  // Controller
  // controller

  deleteDuplicateComments = async (req, res) => {
    try {
      console.log(
        "Attempting to delete duplicate comments for admin:",
        req.user.id
      );

      const admin = await AdminModel.findById(req.user.id);
      if (!admin) {
        console.log("Admin not found:", req.user.id);
        return res.status(404).json({ message: "Admin not found" });
      }

      // Deduplicate based on name+comment pair
      const uniqueComments = [
        ...new Map(
          admin.nameComments.map((item) => [
            item.name + "|" + item.comment, // unique key
            item,
          ])
        ).values(),
      ];

      admin.nameComments = uniqueComments;
      await admin.save();

      console.log(
        "Duplicate comments deleted successfully for admin:",
        req.user.id
      );
      res
        .status(200)
        .json({ message: "Duplicate comments deleted successfully" });
    } catch (error) {
      console.error("Error deleting duplicate comments:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

  getAllNameComments = async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(
        Math.max(parseInt(req.query.limit, 10) || 50, 1),
        200
      );
      const skip = (page - 1) * limit;

      const [doc] = await AdminModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(req.user.id) } },
        {
          $project: {
            total: { $size: "$nameComments" },
            nameComments: { $slice: ["$nameComments", skip, limit] },
          },
        },
      ]);

      if (!doc) return res.status(404).json({ message: "Admin not found" });

      res.status(200).json({
        total: doc.total,
        page,
        limit,
        totalPages: Math.ceil(doc.total / limit),
        nameComments: doc.nameComments,
      });
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

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      for (const file of req.files) {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        const outputPath = path.join(uploadDir, filename);

        await sharp(file.buffer)
          .resize({ width: 1024 }) // Resize
          .jpeg({ quality: 80 }) // Compress
          .toFile(outputPath);

        compressedImagePaths.push(outputPath);
      }

      const admin = await AdminModel.findById(adminId);
      if (!admin) {
        deleteCompressedFiles(compressedImagePaths);
        return res.status(404).json({ message: "Admin not found" });
      }

      admin.imagesPath.push(...compressedImagePaths);
      await admin.save();

      res.status(200).json({
        message: "Images uploaded and compressed successfully",
        paths: compressedImagePaths,
      });
    } catch (error) {
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
