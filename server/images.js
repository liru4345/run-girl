// Image uploads: every photo is re-encoded with sharp before it's saved.
//
//  - Resized (feed photos up to 1600px, profile pictures cropped to 400x400) and
//    compressed to JPEG, so a 6 MB phone photo becomes a few hundred KB.
//  - Rotated to match the camera's orientation, then saved without metadata,
//    which strips EXIF data such as the GPS location the photo was taken at.
//  - Decoding the file is also the real type check: anything that isn't an image fails here,
//    whatever the browser claimed it was.
//  - Saved under a random name, so the original filename never reaches the server.
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const PRESETS = {
  post: { width: 1600, height: 1600, fit: 'inside' },
  avatar: { width: 400, height: 400, fit: 'cover' },
};

class ImageError extends Error {}

// Keep uploads in memory; nothing touches the disk until sharp has processed them.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

async function saveImage(file, preset = 'post') {
  const { width, height, fit } = PRESETS[preset];
  const filename = `${crypto.randomBytes(16).toString('hex')}.jpg`;

  let output;
  try {
    output = await sharp(file.buffer, { failOn: 'error' })
      .rotate()
      .resize({ width, height, fit, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    throw new ImageError(
      /heif|heic/i.test(file.mimetype) || /\.hei[cf]$/i.test(file.originalname)
        ? 'iPhone HEIC photos aren\'t supported yet. Please upload a JPG or PNG.'
        : 'That file isn\'t a supported image. Please upload a JPG, PNG, or WebP.'
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), output);
  return `/uploads/${filename}`;
}

// Remove a previously uploaded file (e.g. an old profile picture). Only touches files in uploads/.
async function deleteImage(publicPath) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const filename = path.basename(publicPath);
  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('❌ Failed to delete old image:', err.message);
  }
}

// Turn Multer errors (e.g. file too large) into a friendly 400 instead of a crash page.
function handleUpload(field) {
  const middleware = upload.single(field);
  return (req, res, next) =>
    middleware(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `Photos must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`
        : 'Upload failed. Please try another photo.';
      res.status(400).json({ error: message });
    });
}

module.exports = { handleUpload, saveImage, deleteImage, ImageError };
