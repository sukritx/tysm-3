const { Club } = require("../models/club.model");

const getClubs = async (req, res) => {
    try {
        const { province } = req.query;

        if (!province) {
            return res.status(400).json({ message: "Province is required" });
        }

        const clubs = await Club.find({ province })
            .sort({ todayCount: -1 })
            .select('clubName province todayCount')
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

module.exports = {
    getClubs,
    getPeopleGoingToday,
}