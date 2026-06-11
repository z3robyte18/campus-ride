const express = require('express');
const router = express.Router();
const { submitRating, getDriverRatings } = require('../controllers/ratingController');
const { protect, passengerOnly } = require('../middleware/auth');

router.post('/', protect, passengerOnly, submitRating);
router.get('/driver/:driverId', protect, getDriverRatings);

module.exports = router;