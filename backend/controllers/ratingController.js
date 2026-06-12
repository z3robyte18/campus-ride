const Rating = require('../models/Rating');
const User = require('../models/User');
const Ride = require('../models/Ride');

exports.submitRating = async (req, res) => {
  try {
    const { rideId, rating, feedback } = req.body;

    if (!rideId) return res.status(400).json({ message: 'rideId is required' });
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed')
      return res.status(400).json({ message: 'Can only rate completed rides' });
    if (ride.passenger.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Only the passenger of this ride can rate it' });
    if (!ride.driver)
      return res.status(400).json({ message: 'This ride has no driver to rate' });

    // Check if already rated
    const existing = await Rating.findOne({ ride: rideId, passenger: req.user._id });
    if (existing) return res.status(400).json({ message: 'You have already rated this ride' });

    const newRating = await Rating.create({
      ride: rideId,
      passenger: req.user._id,
      driver: ride.driver,
      rating: Number(rating),
      feedback: feedback || '',
    });

    // Recalculate driver average rating
    const allRatings = await Rating.find({ driver: ride.driver });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await User.findByIdAndUpdate(ride.driver, {
      averageRating: Math.round(avg * 10) / 10,
      totalRatings: allRatings.length,
    });

    res.status(201).json({ message: 'Rating submitted successfully', rating: newRating });
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

// Check if passenger already rated a specific ride
exports.checkRating = async (req, res) => {
  try {
    const existing = await Rating.findOne({
      ride: req.params.rideId,
      passenger: req.user._id
    });
    res.json({ rated: !!existing, rating: existing || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
