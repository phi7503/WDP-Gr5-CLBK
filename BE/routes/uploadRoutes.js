import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, "../uploads/posters");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer để upload files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, "poster-" + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Route upload poster
router.post("/poster", (req, res) => {
  upload.single("poster")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        message: "Upload failed",
        error: err.message,
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Trả về đường dẫn file
      const filePath = `uploads/posters/${req.file.filename}`;

      console.log("File uploaded successfully:", {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: filePath,
        size: req.file.size,
      });

      res.json({
        message: "File uploaded successfully",
        url: filePath,
        filePath: filePath,
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Upload processing error:", error);
      res.status(500).json({
        message: "Upload processing failed",
        error: error.message,
      });
    }
  });
});

// Tạo thư mục uploads/combos nếu chưa có
const combosDir = path.join(__dirname, "../uploads/combos");
if (!fs.existsSync(combosDir)) {
  fs.mkdirSync(combosDir, { recursive: true });
}

const comboStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, combosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, "combo-" + uniqueSuffix + extension);
  },
});

const uploadCombo = multer({
  storage: comboStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Route upload combo image
router.post("/combo", (req, res) => {
  uploadCombo.single("combo")(req, res, (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        message: "Upload failed",
        error: err.message,
      });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `uploads/combos/${req.file.filename}`;
      res.json({
        message: "File uploaded successfully",
        url: filePath,
        filePath: filePath,
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Upload processing error:", error);
      res.status(500).json({
        message: "Upload processing failed",
        error: error.message,
      });
    }
  });
});

// Route để kiểm tra upload endpoint
router.get("/test", (req, res) => {
  res.json({
    message: "Upload route is working",
    uploadsDir: uploadsDir,
    dirExists: fs.existsSync(uploadsDir),
  });
});

export default router;
