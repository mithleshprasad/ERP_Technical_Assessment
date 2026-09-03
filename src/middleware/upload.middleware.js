const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, enough for 100k+ row CSV/XLSX
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (allowed.includes(file.mimetype) || /\.(csv|xlsx|xls)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error('Only CSV or Excel files are allowed'));
  },
});

module.exports = upload;
