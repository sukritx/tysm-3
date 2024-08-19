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
app.use(cors());
app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Routes
const userRouter = require("./routes/userRouter.js");
const messageRouter = require("./routes/messageRouter.js")
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter)

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
