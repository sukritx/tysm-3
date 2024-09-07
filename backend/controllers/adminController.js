const { Account, User } = require("../models/user.model");
const moment = require("moment");

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

module.exports = {
    getDashboardData,
    addCoinsToUser
};
