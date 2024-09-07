const { Account } = require("../models/user.model");
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

module.exports = {
    getDashboardData
};
