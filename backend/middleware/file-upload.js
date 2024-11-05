const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
require('dotenv').config();

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: process.env.DO_SPACES_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET
  },
  forcePathStyle: true
});

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/heif': 'heif',
  'image/heic': 'heic',
  'image/heif-sequence': 'heif',
  'image/heic-sequence': 'heic'
};

const fileUpload = (options = {}) => {
  const { 
    fileType = 'image', 
    maxSize = 5000000,
    destination = 'uploads'
  } = options;

  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!');
    cb(error, isValid);
  };

  const upload = multer({ storage: storage, fileFilter: fileFilter, limits: { fileSize: maxSize } });

  return (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next();
      }

      try {
        let imageBuffer = req.file.buffer;

        const buffer = await sharp(imageBuffer, { failOnError: false })
          .resize({ width: 1000, height: 1000, fit: 'inside' })
          .webp({ quality: 70 })
          .toBuffer();

        const userId = req.userId;
        const fileName = `${userId}/${destination}/${Date.now()}.webp`;

        const uploadParams = {
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: fileName,
          Body: buffer,
          ContentType: 'image/webp',
          ACL: 'public-read'
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        req.file.key = fileName;
        req.file.location = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.digitaloceanspaces.com/${fileName}`;

        next();
      } catch (error) {
        console.error('Error processing upload:', error);
        next(error);
      }
    });
  };
};

module.exports = {
  fileUpload
};
