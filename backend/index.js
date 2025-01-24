const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
require('dotenv').config();

// Create Express app
const app = express();

// Security Headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later"
});
app.use("/api", limiter);

// Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Database connectivity with error handling
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s
})
.then(() => console.log('Database connected'))
.catch(err => console.error('Database connection failed:', err));

const dbConnection = mongoose.connection;
dbConnection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL.split(',');
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

// Cookie parser with secure settings
const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.COOKIE_SECRET));

// Trust proxy if behind a reverse proxy (like nginx)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Routes
const userRouter = require("./routes/userRouter.js");
const messageRouter = require("./routes/messageRouter.js");
const clubRouter = require("./routes/clubRouter.js");
const inviteRouter = require("./routes/inviteRouter.js");
const notificationRouter = require("./routes/notificationRouter.js");
const saleRouter = require("./routes/saleRouter.js");
const adminRouter = require("./routes/adminRouter.js");

const examRouter = require("./routes/examRouter.js");
const postRouter = require("./routes/postRouter.js");
const commentRouter = require("./routes/commentRouter.js");
const userAdmissionRouter = require("./routes/userAdmissionRouter.js");

const fakbokRouter = require("./routes/fakbok/fakbokRouter.js");

const { authMiddleware, adminMiddleware } = require("./middleware/authMiddleware.js");
// tysm คืนนี้ไปร้านไหน
app.use("/api/v1/user", userRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/club", clubRouter);
app.use("/api/v1/invite", inviteRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/sale", saleRouter);
app.use("/api/v1/admin", authMiddleware, adminMiddleware, adminRouter);

// tysm admission
app.use("/api/v2/users", userAdmissionRouter);
app.use("/api/v2/exams", examRouter);
app.use("/api/v2/posts", postRouter);
app.use("/api/v2/comments", commentRouter);

// tysm ฝากบอก
app.use("/api/v1/fakbok", fakbokRouter);


// Scheduled task
const { scheduleClubReset } = require('./scheduledTasks');

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// Handle unhandled routes
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    scheduleClubReset();
});
