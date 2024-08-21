const mongoose = require("mongoose");
const { Account } = require("../models/user.model");
const { Club } = require("../models/club.model");
const { Province } = require("../models/province.model");

const getClubs = async (req, res) => {
    try {
        const { province } = req.query;

        if (!province) {
            return res.status(400).json({ message: "Province is required" });
        }

        // First, find the province document
        const provinceDoc = await Province.findOne({ province });

        if (!provinceDoc) {
            return res.status(404).json({ message: "Province not found" });
        }

        const clubs = await Club.find({ province: provinceDoc._id })
            .sort({ todayCount: -1 })
            .select('clubName province todayCount')
            .populate('province', 'name')  // Populate the province field
            .lean();

        res.json(clubs);
    } catch (error) {
        console.error("Error in getClubs:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const getPeopleGoingToday = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(clubId)) {
            return res.status(400).json({ error: "Invalid club ID" });
        }

        const club = await Club.findById(clubId).populate('goingToday.userId');
        if (!club) {
            return res.status(404).json({ error: "Club not found" });
        }

        const userAccount = await Account.findOne({ userId: userId });
        if (!userAccount) {
            return res.status(404).json({ error: "User account not found" });
        }

        const friendIds = new Set(userAccount.friendsList.map(friend => friend.friendId.toString()));

        const peopleGoingData = await Promise.all(club.goingToday.map(async (person) => {
            const personAccount = await Account.findOne({ userId: person.userId._id })
                .populate('school');

            let schoolInfo = null;
            if (personAccount && personAccount.school) {
                schoolInfo = {
                    id: personAccount.school._id,
                    name: personAccount.school.schoolName,
                    type: personAccount.school.schoolType
                };
            }

            return {
                userId: person.userId._id,
                username: person.userId.username,
                ig: personAccount ? personAccount.instagram : null,
                avatar: personAccount ? personAccount.avatar : null,
                school: schoolInfo,
                isFriend: friendIds.has(person.userId._id.toString())
            };
        }));

        // Sort the list: friends first, then others
        peopleGoingData.sort((a, b) => {
            if (a.isFriend && !b.isFriend) return -1;
            if (!a.isFriend && b.isFriend) return 1;
            return 0;
        });

        res.json({
            clubName: club.clubName,
            totalGoingToday: club.todayCount,
            friendsGoingCount: peopleGoingData.filter(person => person.isFriend).length,
            peopleGoing: peopleGoingData
        });

    } catch (error) {
        console.error("Error in getPeopleGoingToday:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const addClub = async (req, res) => {
    try {
        const { clubName, province } = req.body;

        // Validate input
        if (!clubName || !province) {
            return res.status(400).json({ message: "Club name and province are required" });
        }

        // Check if the province exists
        const provinceDoc = await Province.findOne({ province: province });
        if (!provinceDoc) {
            return res.status(404).json({ message: "Province not found" });
        }

        // Check if a club with the same name already exists in the province
        const existingClub = await Club.findOne({ clubName, province: provinceDoc._id });
        if (existingClub) {
            return res.status(409).json({ message: "A club with this name already exists in the province" });
        }

        // Create new club
        const newClub = new Club({
            clubName,
            province: provinceDoc._id,
            goingToday: [],
            todayCount: 0
        });

        // Save the new club
        await newClub.save();

        // Return the created club
        res.status(201).json({
            message: "Club created successfully",
            club: {
                _id: newClub._id,
                clubName: newClub.clubName,
                province: provinceDoc.province,
                todayCount: newClub.todayCount
            }
        });

    } catch (error) {
        console.error("Error in addClub:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getClubs,
    getPeopleGoingToday,
    addClub
}