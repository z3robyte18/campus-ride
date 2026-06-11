const Rating = require('../models/Rating');
const User = require('../models/User');
const Ride = require('../models/Ride');

exports.submitRating = async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'completed')
      return res.status(400).json({ message: 'Can only rate completed rides' });

    const existing = await Rating.findOne({ ride: rideId, passenger: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already rated this ride' });

    const newRating = await Rating.create({
      ride: rideId, passenger: req.user._id,
      driver: ride.driver, rating, feedback,
    });

    // Recalculate driver average
    const allRatings = await Rating.find({ driver: ride.driver });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await User.findByIdAndUpdate(ride.driver, {
      averageRating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length,
    });

    res.status(201).json(newRating);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDriverRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ driver: req.params.driverId })
      .populate('passenger', 'name')
      .populate('ride', 'pickupLocation destination createdAt')
      .sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};