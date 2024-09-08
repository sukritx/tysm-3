const cron = require('node-cron');
const { Club } = require('./models/club.model');

const resetClubsDaily = async () => {
    try {
        const result = await Club.updateMany(
            {},
            { $set: { goingToday: [], todayCount: 0 } }
        );
        console.log(`Reset ${result.modifiedCount} clubs at ${new Date()}`);
    } catch (error) {
        console.error('Error resetting clubs:', error);
    }
};

// Schedule the task to run at 4 AM every day
const scheduleClubReset = () => {
    cron.schedule('0 4 * * *', () => {
        console.log('Running daily club reset');
        resetClubsDaily();
    });
};

module.exports = { scheduleClubReset };