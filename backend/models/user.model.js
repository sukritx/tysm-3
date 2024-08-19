const mongoose = require("mongoose");

// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    phonenumber: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxLength: 10
    },
    firstName: {
        type: String,
        required: false,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
        maxLength: 50
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    avatar: {
        type: String,
        required: false,
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    },
    biography: {
        type: String,
        required: false,
        trim: true,
        maxlength: 50
    },
    instagram: {
        type: String,
        required: false,
        unique: true,
        trim: true,
        maxlength: 30
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false
    },
    vip: [{
        vipLevel: {
            type: Number,
            default: 0,
            required: true
        },
        vipExpire: {
            type: Date,
            required: true
        }
    }],
    joinDate: {
        type: Date,
        default: Date.now
    },

    //friend
    sentFriendRequest: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    receivedFriendRequest: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    friendsList: [{
        friendId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    }],
    whoView: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        viewDate: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model from the schema
const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);

module.exports = {
	User,
    Account
};