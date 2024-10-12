const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config();

// Create Express app
const app = express();

// Database connectivity
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection failed:', err));
const dbConnection = mongoose.connection;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL, // Replace with your frontend URL
    credentials: true
  }));
app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser(process.env.COOKIE_SECRET));

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


// Scheduled task
const { scheduleClubReset } = require('./scheduledTasks');

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    scheduleClubReset(); // Schedule the daily reset task
});
