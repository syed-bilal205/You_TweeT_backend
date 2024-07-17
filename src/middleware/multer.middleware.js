import multer from "multer";
import path from "path";

// Resolve the temporary directory path
const tempDir = path.resolve("./public/temp");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
