const { User, Account } = require("../models/user.model");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const zod = require("zod");
require('dotenv').config()

const signupBody = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6),
    confirmPassword: zod.string(),
    phonenumber: zod.string().max(10),
    firstName: zod.string().max(50),
    lastName: zod.string().max(50),
    instagram: zod.string().max(30)
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
}).refine(data => data.password.length >= 6, {
    message: "Password must be at least 6 characters long",
    path: ["password"]
}).refine(data => data.username.length >= 3 && data.username.length <= 30, {
    message: "Username must be between 3 and 30 characters long",
    path: ["username"]
}).refine(data => data.phonenumber.length <= 10, {
    message: "Phone number must be at most 10 characters long",
    path: ["phonenumber"]
}).refine(data => data.instagram.length <= 30, {
    message: "Instagram must be at most 30 characters long",
    path: ["instagram"]
});

const loginBody = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6)
});

const postSignup = async (req, res) => {
    const { success } = signupBody.safeParse(req.body);
    if (!success) {
        return res.status(400).json({ error: "Incorrect inputs" });
    }

    const { username, password, confirmPassword, phonenumber, firstName, lastName, instagram } = req.body;

    const existingUser = await User.findOne({
        $or: [{ username: req.body.username }, { phonenumber: req.body.phonenumber }]
    });

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    if (existingUser) {
        if (existingUser.username === username) {
            return res.status(411).json({
                message: "Username already taken"
            });
        } else if (existingUser.phonenumber === phonenumber) {
            return res.status(412).json({
                message: "Phone number already in use"
            });
        }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        username,
        password: hashedPassword,
        phonenumber,
        firstName,
        lastName
    });

    const userId = user._id;
    const account = await Account.create({
        userId: user._id,
        instagram: instagram.toLowerCase()
    });

    // Set cookie instead of returning a token
    res.cookie('userId', userId.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }, process.env.JWT_SECRET);

    res.json({
        message: "User created successfully"
    });
}

const postLogin = async (req, res) => {
    const { success } = loginBody.safeParse(req.body);
    if(!success) {
        return res.status(411).json({ error: "Incorrect inputs" });
    }

    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
        // Set cookie instead of returning a token
        res.cookie('userId', userId.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            signed: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }, process.env.JWT_SECRET);

        return res.json({ message: "Logged in successfully" });
    } else {
        return res.status(401).json({ error: "Invalid username or password" });
    }
}

const logout = (req, res) => {
    res.clearCookie('userId');
    res.json({ message: "Logged out successfully" });
};

module.exports = {
    postSignup,
    postLogin,
    logout
};