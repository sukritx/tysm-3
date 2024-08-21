const { User } = require("../models/user.model");
const { Message } = require("../models/message.model")
const zod = require("zod");

const sendMessage = async (req, res) => {
    try {

        const senderId = req.userId;
        const receiverId = req.params.id;
        const { message } = req.body;

        // Check if both sender and receiver exist
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) {
            return res.status(404).json({
                message: "Sender or receiver not found"
            });
        }

        // Create and save the message
        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            message: message
        });

        await newMessage.save();

        res.status(200).json({
            message: "Message sent successfully"
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

const getMessageSameUser = async (req, res) => {
    try {
        const userId = req.userId;
        const senderId = req.params.id;

        const messages = await Message.find({ sender: senderId, receiver: userId });

        if (!messages || messages.length === 0) {
            return res.status(404).json({
                message: "No messages found between the users"
            });
        }

        // Map each message to include the time difference in minutes
        const messagesWithTimeDifference = messages.map(message => {
            const timeDifferenceInMilliseconds = Date.now() - message.time.getTime();
            const timeDifferenceInMinutes = Math.floor(timeDifferenceInMilliseconds / (1000 * 60));
            return {
                ...message.toObject(),
                timeDifferenceInMinutes
            };
        });

        res.status(200).json(messagesWithTimeDifference);
    
    } catch {
        console.error("Error fetching messages between users:", error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}


module.exports = {
    sendMessage,
    getMessageSameUser
}

