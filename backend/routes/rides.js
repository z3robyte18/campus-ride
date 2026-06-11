const express = require('express');
const router = express.Router();
const {
  requestRide, getAvailableRides, acceptRide, updateRideStatus,
  getMyRides, getActiveRide, cancelRide, getAnalytics
} = require('../controllers/rideController');
const { protect, driverOnly, passengerOnly } = require('../middleware/auth');

router.post('/', protect, passengerOnly, requestRide);
router.get('/available', protect, driverOnly, getAvailableRides);
router.get('/my', protect, getMyRides);
router.get('/active', protect, getActiveRide);
router.get('/analytics', protect, getAnalytics);
router.put('/:id/accept', protect, driverOnly, acceptRide);
router.put('/:id/status', protect, updateRideStatus);
router.put('/:id/cancel', protect, cancelRide);

module.exports = router;