const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
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
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const fileUpload = (options = {}) => {
  const { 
    fileType = 'image', 
    maxSize = 500000, 
    destination = 'uploads'
  } = options;

  return multer({
    limits: maxSize,
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.DO_SPACES_BUCKET,
      acl: "public-read",
      key: function (req, file, cb) {
        const ext = MIME_TYPE_MAP[file.mimetype];
        const userId = req.userId;
        const fileName = `${userId}/${destination}/${Date.now()}.${ext}`;
        cb(null, fileName);
      },
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      contentType: multerS3.AUTO_CONTENT_TYPE,
    }),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error('Invalid mime type!');
      cb(error, isValid);
    },
  });
};

module.exports = {
  fileUpload
};