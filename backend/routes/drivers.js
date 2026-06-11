const express = require('express');
const router = express.Router();
const { toggleOnline, updateLocation, getOnlineDrivers, getDriverStats } = require('../controllers/driverController');
const { protect, driverOnly } = require('../middleware/auth');

router.put('/toggle-online', protect, driverOnly, toggleOnline);
router.put('/location', protect, driverOnly, updateLocation);
router.get('/online', protect, getOnlineDrivers);
router.get('/stats', protect, driverOnly, getDriverStats);
router.get('/stats/:id', protect, getDriverStats);

module.exports = router;