// multerConfig.js
import multer from "multer";

const storage = multer.memoryStorage(); // use memory for Sharp

export const upload = multer({
  storage,
  limits: { files: 10 }, // Limit max images to 10
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});
