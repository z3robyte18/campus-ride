const User = require('../models/User');
const Ride = require('../models/Ride');
const Rating = require('../models/Rating');

exports.toggleOnline = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isOnline = !user.isOnline;
    if (!user.isOnline) user.isBusy = false;
    await user.save();
    res.json({ isOnline: user.isOnline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user._id, { currentLocation: { lat, lng } });
    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOnlineDrivers = async (req, res) => {
  try {
    const drivers = await User.find({ role: 'driver', isOnline: true })
      .select('name vehicleNumber vehicleType currentLocation averageRating totalRides isOnline isBusy');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDriverStats = async (req, res) => {
  try {
    const driverId = req.params.id || req.user._id;
    const driver = await User.findById(driverId).select('-password');
    const rides = await Ride.find({ driver: driverId, status: 'completed' });
    const ratings = await Rating.find({ driver: driverId });
    const totalEarnings = rides.reduce((s, r) => s + (r.fare || 0), 0);
    const now = new Date();
    const thisMonth = rides.filter(r => {
      const d = new Date(r.endTime || r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    res.json({
      driver,
      totalRides: rides.length,
      totalEarnings,
      monthlyRides: thisMonth.length,
      monthlyEarnings: thisMonth.reduce((s, r) => s + (r.fare || 0), 0),
      averageRating: driver.averageRating,
      ratings: ratings.slice(-5),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
