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
        maxLength: 20
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
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
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
        maxlength: 255
    },
    birthday: {
        type: Date,
        required: false
    },
    interest: {
        type: String,
        required: false,
        trim: true,
        maxlength: 20
    },
    instagram: {
        type: String,
        required: false,
        unique: false,
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
    coin: {
        balance: {
            type: Number,
            default: 0,
            min: 0,
            required: true
        },
        transactions: [{
            amount: {
                type: Number,
                required: true
            },
            type: {
                type: String,
                enum: ['deposit', 'earn', 'spend'],
                required: true
            },
            reason: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }]
    },
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
    totalViews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastViewedBy: {
        type: Map,
        of: Date,
        default: new Map()
    }
});

// Create a model from the schema
const User = mongoose.model('User', userSchema);
const Account = mongoose.model('Account', accountSchema);

module.exports = {
	User,
    Account
};