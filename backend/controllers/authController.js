const { User, Account } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const zod = require("zod");
require('dotenv').config();

const signupBody = zod.object({
    username: zod.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    password: zod.string().min(6),
    confirmPassword: zod.string(),
    phonenumber: zod.string().max(10),
    firstName: zod.string().max(50),
    lastName: zod.string().max(50),
    email: zod.string().email()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

const loginBody = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6)
});

const postSignup = async (req, res) => {
    try {
        const { success, data, error } = signupBody.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ error: error.errors });
        }

        const { username, password, phonenumber, firstName, lastName, email } = data;

        const existingUser = await User.findOne({
            $or: [{ username }, { phonenumber }, { email }]
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(409).json({ message: "Username already taken" });
            } else if (existingUser.phonenumber === phonenumber) {
                return res.status(409).json({ message: "Phone number already in use" });
            } else if (existingUser.email === email) {
                return res.status(409).json({ message: "Email already in use" });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            username,
            password: hashedPassword,
            phonenumber,
            firstName,
            lastName,
            email
        });

        await Account.create({
            userId: user._id,
            coin: {
                balance: 10,
                transactions: [{
                    amount: 10,
                    type: 'earn',
                    reason: 'Sign-up bonus'
                }]
            }
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        // console.log('Token created on signup:', token);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const postLogin = async (req, res) => {
    try {
        const { success, data, error } = loginBody.safeParse(req.body);
        if (!success) {
            return res.status(400).json({ error: error.errors });
        }

        const { username, password } = data;

        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        // console.log('Token created on login:', token);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ message: "Logged in successfully", token }); // Return the token in the response body
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const logout = (req, res) => {
    res.clearCookie('jwt');
    res.json({ message: "Logged out successfully" });
};

module.exports = {
    postSignup,
    postLogin,
    logout
};