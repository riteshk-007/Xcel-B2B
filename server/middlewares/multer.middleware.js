import multer from "multer";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file URL and convert it to a directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer storage
const storage = multer.memoryStorage();

const upload = multer({ storage });

// Middleware to handle image compression
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const { originalname, buffer } = req.file;
  const filename = `${Date.now()}-${originalname
    .toLowerCase()
    .split(" ")
    .join("-")}`;
  const outputPath = path.join(__dirname, "../public/upload", filename);

  try {
    await sharp(buffer)
      .resize(800) // Resize the image to a width of 800px, maintaining aspect ratio
      .jpeg({ quality: 100 }) // Compress the image to 100% quality
      .toFile(outputPath);

    // Replace the file object with the new compressed file details
    req.file.path = outputPath;
    req.file.filename = filename;

    next();
  } catch (error) {
    next(error);
  }
};

export { upload, compressImage };
