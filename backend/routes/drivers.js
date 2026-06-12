const express = require('express');
const router = express.Router();
const { toggleOnline, updateLocation, getOnlineDrivers, getDriverStats } = require('../controllers/driverController');
const { protect, driverOnly } = require('../middleware/auth');
const User = require('../models/User');

router.put('/toggle-online', protect, driverOnly, toggleOnline);
router.put('/location', protect, driverOnly, updateLocation);
router.get('/online', protect, getOnlineDrivers);
router.get('/stats', protect, driverOnly, getDriverStats);
router.get('/stats/:id', protect, getDriverStats);

// Update UPI ID
router.put('/upi', protect, driverOnly, async (req, res) => {
  try {
    const { upiId } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { upiId }, { new: true }).select('-password');
    res.json({ upiId: user.upiId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get driver public info (for passenger to get driver's UPI)
router.get('/:id/public', protect, async (req, res) => {
  try {
    const driver = await User.findById(req.params.id).select('name vehicleNumber vehicleType upiId averageRating');
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
