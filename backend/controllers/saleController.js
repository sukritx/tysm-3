const { User } = require("../models/user.model");
const { Account } = require("../models/user.model");
const { School } = require("../models/school.model")
const { notificationController } = require('../controllers/notificationController');
const mongoose = require("mongoose");
const zod = require("zod");
require('dotenv').config()

const buyVIP = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.userId;
        const vipCost = 99; // 99 coins for VIP status
        const vipDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        const account = await Account.findOne({ userId }).session(session);

        if (!account) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Account not found" });
        }

        if (account.coin.balance < vipCost) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Insufficient coins" });
        }

        // Deduct coins
        account.coin.balance -= vipCost;
        account.coin.transactions.push({
            amount: -vipCost,
            type: 'spend',
            reason: 'VIP purchase'
        });

        // Add or extend VIP status
        const now = new Date();
        const vipExpiry = new Date(now.getTime() + vipDuration);

        const existingVIP = account.vip.find(v => v.vipLevel === 1);
        if (existingVIP) {
            existingVIP.vipExpire = new Date(Math.max(existingVIP.vipExpire, vipExpiry));
        } else {
            account.vip.push({
                vipLevel: 1,
                vipExpire: vipExpiry
            });
        }

        await account.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Send notification
        await notificationController.sendVIPPurchaseNotification(userId);

        res.status(200).json({
            message: "VIP status purchased successfully",
            user: {
                coinBalance: account.coin.balance,
                vipStatus: account.vip
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in buyVIP:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


module.exports = {
    buyVIP
};