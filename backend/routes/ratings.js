const express = require('express');
const router = express.Router();
const { submitRating, getDriverRatings, checkRating } = require('../controllers/ratingController');
const { protect, passengerOnly } = require('../middleware/auth');

router.post('/', protect, passengerOnly, submitRating);
router.get('/driver/:driverId', protect, getDriverRatings);
router.get('/check/:rideId', protect, passengerOnly, checkRating);

module.exports = router;
