const multer = require("multer");

const fileUpload = multer({
    limits: 500000,
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      const isValid = !!MIME_TYPE_MAP[file.mimetype];
      let error = isValid ? null : new Error('Invalid mime type!');
      cb(error, isValid);
    },
});

exports.fileUpload = fileUpload;