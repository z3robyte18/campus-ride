const Ride = require('../models/Ride');
const User = require('../models/User');

const calculateFare = (distance) => {
  if (distance <= 0.5) return 10;
  if (distance <= 1.0) return 20;
  if (distance <= 1.5) return 30;
  return 40;
};

exports.requestRide = async (req, res) => {
  try {
    const { pickupLocation, destination, distance, paymentMethod, scheduledTime, isScheduled } = req.body;
    const fare = calculateFare(distance || 0.5);
    const ride = await Ride.create({
      passenger: req.user._id,
      pickupLocation, destination, distance, fare,
      paymentMethod, scheduledTime, isScheduled,
    });
    const populated = await ride.populate('passenger', 'name phone');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailableRides = async (req, res) => {
  try {
    const now = new Date();
    const rides = await Ride.find({ status: 'requested', driver: null })
      .populate('passenger', 'name phone averageRating')
      .sort({ createdAt: -1 });
    const visible = rides.filter(ride => {
      if (!ride.isScheduled) return true;
      const diffMinutes = (new Date(ride.scheduledTime) - now) / 60000;
      return diffMinutes <= 15;
    });
    res.json(visible);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'requested') return res.status(400).json({ message: 'Ride no longer available' });
    if (ride.driver) return res.status(400).json({ message: 'Ride already accepted' });
    if (ride.isScheduled && ride.scheduledTime) {
      const diffMinutes = (new Date(ride.scheduledTime) - new Date()) / 60000;
      if (diffMinutes > 15) return res.status(400).json({
        message: `Scheduled for ${new Date(ride.scheduledTime).toLocaleString('en-IN')}. Accept within 15 min of that time.`,
        scheduledTime: ride.scheduledTime,
      });
    }
    ride.driver = req.user._id;
    ride.status = 'accepted';
    await ride.save();
    await User.findByIdAndUpdate(req.user._id, { isBusy: true });
    const populated = await ride.populate([
      { path: 'passenger', select: 'name phone' },
      { path: 'driver', select: 'name phone vehicleNumber vehicleType averageRating currentLocation' }
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRideStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (status === 'in_progress' && ride.isScheduled && ride.scheduledTime) {
      const diffMinutes = (new Date(ride.scheduledTime) - new Date()) / 60000;
      if (diffMinutes > 5) return res.status(400).json({
        message: `Cannot start yet. Scheduled for ${new Date(ride.scheduledTime).toLocaleString('en-IN')}.`,
        scheduledTime: ride.scheduledTime,
      });
    }
    ride.status = status;
    if (status === 'in_progress') ride.startTime = new Date();
    if (status === 'completed') {
      ride.endTime = new Date();
      ride.paymentStatus = 'paid';
      await User.findByIdAndUpdate(ride.driver, { $inc: { totalRides: 1 }, isBusy: false });
    }
    if (status === 'cancelled') {
      ride.cancelledBy = req.user.role;
      ride.cancelReason = req.body.reason || '';
      if (ride.driver) await User.findByIdAndUpdate(ride.driver, { isBusy: false });
    }
    await ride.save();
    const populated = await ride.populate([
      { path: 'passenger', select: 'name phone' },
      { path: 'driver', select: 'name phone vehicleNumber vehicleType averageRating' }
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyRides = async (req, res) => {
  try {
    const query = req.user.role === 'passenger'
      ? { passenger: req.user._id }
      : { driver: req.user._id };
    const rides = await Ride.find(query)
      .populate('passenger', 'name')
      .populate('driver', 'name vehicleNumber vehicleType averageRating')
      .sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// KEY FIX — also return recently completed rides so passenger can rate them
exports.getActiveRide = async (req, res) => {
  try {
    if (req.user.role === 'passenger') {
      // First check for truly active ride
      let ride = await Ride.findOne({
        passenger: req.user._id,
        status: { $in: ['requested', 'accepted', 'in_progress'] }
      })
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone vehicleNumber vehicleType averageRating currentLocation');

      // If no active ride, check for a recently completed ride (within last 10 min) that hasn't been rated
      if (!ride) {
        const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
        ride = await Ride.findOne({
          passenger: req.user._id,
          status: 'completed',
          endTime: { $gte: tenMinAgo },
        })
          .populate('passenger', 'name phone')
          .populate('driver', 'name phone vehicleNumber vehicleType averageRating')
          .sort({ endTime: -1 });
      }
      return res.json(ride);
    } else {
      const ride = await Ride.findOne({
        driver: req.user._id,
        status: { $in: ['accepted', 'in_progress'] }
      })
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone vehicleNumber vehicleType averageRating currentLocation');
      return res.json(ride);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = 'cancelled';
    ride.cancelledBy = req.user.role;
    ride.cancelReason = req.body.reason || 'No reason provided';
    await ride.save();
    if (ride.driver) await User.findByIdAndUpdate(ride.driver, { isBusy: false });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'completed' });
    const hourCounts = Array(24).fill(0);
    const locationCounts = {};
    rides.forEach(r => {
      hourCounts[new Date(r.createdAt).getHours()]++;
      const loc = r.pickupLocation.name;
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });
    const popularLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    res.json({
      hourCounts, popularLocations,
      peakHour: hourCounts.indexOf(Math.max(...hourCounts)),
      totalRides: rides.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
