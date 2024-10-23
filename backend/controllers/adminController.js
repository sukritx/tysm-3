const { Account, User } = require("../models/user.model");
const Post = require("../models/post.model");
const moment = require("moment");
const Exam = require('../models/exam.model');
const Subject = require('../models/subject.model');
const ExamSession = require('../models/session.model');
const { fileUpload } = require('../middleware/file-upload');

const getDashboardData = async (req, res) => {
    try {
        const today = moment().startOf('day');
        const lastWeek = moment().subtract(7, 'days').startOf('day');

        // Coin sold today
        const coinSoldToday = await Account.aggregate([
            {
                $unwind: "$coin.transactions"
            },
            {
                $match: {
                    "coin.transactions.type": "deposit",
                    "coin.transactions.timestamp": { $gte: today.toDate() }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCoins: { $sum: "$coin.transactions.amount" }
                }
            }
        ]);

        // Daily chart of coin sales for the last week
        const dailyCoinSales = await Account.aggregate([
            {
                $unwind: "$coin.transactions"
            },
            {
                $match: {
                    "coin.transactions.type": "deposit",
                    "coin.transactions.timestamp": { $gte: lastWeek.toDate() }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$coin.transactions.timestamp" } },
                    totalCoins: { $sum: "$coin.transactions.amount" }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // VIP purchases count
        const vipPurchasesCount = await Account.aggregate([
            {
                $unwind: "$coin.transactions"
            },
            {
                $match: {
                    "coin.transactions.reason": "VIP purchase",
                    "coin.transactions.timestamp": { $gte: today.toDate() }
                }
            },
            {
                $count: "count"
            }
        ]);

        res.json({
            coinSoldToday: coinSoldToday[0]?.totalCoins || 0,
            dailyCoinSales,
            vipPurchasesCount: vipPurchasesCount[0]?.count || 0
        });
    } catch (error) {
        console.error("Error in getDashboardData:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const addCoinsToUser = async (req, res) => {
    try {
        const { username, amount } = req.body;

        if (!username || !amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid input" });
        }

        const user = await User.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const account = await Account.findOne({ userId: user._id });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        account.coin.balance += Number(amount);
        account.coin.transactions.push({
            amount: Number(amount),
            type: 'deposit',
            reason: 'Admin added coins'
        });

        await account.save();

        res.status(200).json({
            message: "Coins added successfully",
            newBalance: account.coin.balance
        });
    } catch (error) {
        console.error("Error in addCoinsToUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const createSession = async (req, res) => {
    try {
        const { examId } = req.params;
        const { name, subjects } = req.body;

        if (!name || !subjects || subjects.length === 0) {
            return res.status(400).json({ message: "Session name and at least one subject are required" });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const createdSessions = [];

        for (const subjectId of subjects) {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
                return res.status(404).json({ message: `Subject with id ${subjectId} not found` });
            }

            const newSession = new ExamSession({
                exam: examId,
                subject: subjectId,
                name
            });

            await newSession.save();
            createdSessions.push(newSession);
        }

        res.status(201).json({ message: "Sessions created successfully", sessions: createdSessions });
    } catch (error) {
        console.error("Error creating sessions:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const createBulkSessions = async (req, res) => {
    try {
        const { examId } = req.params;
        const { names, subjects } = req.body;

        if (!names || names.length === 0 || !subjects || subjects.length === 0) {
            return res.status(400).json({ message: "Session names and at least one subject are required" });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const createdSessions = [];

        for (const name of names) {
            for (const subjectId of subjects) {
                const subject = await Subject.findById(subjectId);
                if (!subject) {
                    return res.status(404).json({ message: `Subject with id ${subjectId} not found` });
                }

                const newSession = new ExamSession({
                    exam: examId,
                    subject: subjectId,
                    name
                });

                await newSession.save();
                createdSessions.push(newSession);
            }
        }

        res.status(201).json({ message: "Bulk sessions created successfully", sessions: createdSessions });
    } catch (error) {
        console.error("Error creating bulk sessions:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const createExam = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Exam name is required" });
        }

        const newExam = new Exam({ name });
        await newExam.save();

        res.status(201).json({ message: "Exam created successfully", exam: newExam });
    } catch (error) {
        console.error("Error creating exam:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const createSubject = async (req, res) => {
    try {
        const { examId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Subject name is required" });
        }

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        const newSubject = new Subject({ name, exam: examId });
        await newSubject.save();

        exam.subjects.push(newSubject._id);
        await exam.save();

        res.status(201).json({ message: "Subject created successfully", subject: newSubject });
    } catch (error) {
        console.error("Error creating subject:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '_id username');
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const postAsUser = async (req, res) => {
    const upload = fileUpload({ destination: 'posts' });

    upload(req, res, async function(err) {
        if (err) {
            console.error("Error uploading file:", err);
            return res.status(500).json({ error: "Error uploading file", details: err.message });
        }

        try {
            const { heading, examId, subjectId, sessionId, postAsUser } = req.body;

            if (!postAsUser) {
                return res.status(400).json({ message: "Target user is required" });
            }

            const targetUser = await User.findById(postAsUser);
            if (!targetUser) {
                return res.status(404).json({ message: "Target user not found" });
            }

            if (!examId) {
                return res.status(400).json({ message: "Exam is required" });
            }

            let imageUrl = null;
            if (req.file) {
                imageUrl = req.file.location;
            }

            const newPost = new Post({
                user: targetUser._id,
                heading,
                image: imageUrl,
                exam: examId,
                subject: subjectId || null,
                examSession: sessionId || null
            });

            const savedPost = await newPost.save();
            
            await savedPost.populate('exam', 'name');
            await savedPost.populate('subject', 'name');
            await savedPost.populate('examSession');
            await savedPost.populate('user', 'username');
            
            const account = await Account.findOne({ userId: savedPost.user._id }, 'avatar');
            
            const postWithAvatar = savedPost.toObject();
            postWithAvatar.user.avatar = account?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

            res.status(201).json(postWithAvatar);
        } catch (error) {
            console.error("Error creating post as user:", error);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    });
};

module.exports = {
    getDashboardData,
    addCoinsToUser,
    createSession,
    createBulkSessions,
    createExam,
    createSubject,
    getUsers,
    postAsUser
};
