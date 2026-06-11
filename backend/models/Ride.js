const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pickupLocation: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destination: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  fare: { type: Number, default: 0 },
  distance: { type: Number, default: 0 },
  scheduledTime: { type: Date, default: null },
  isScheduled: { type: Boolean, default: false },
  startTime: { type: Date },
  endTime: { type: Date },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi'], default: 'cash' },
  cancelledBy: { type: String, enum: ['passenger', 'driver', null], default: null },
  cancelReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);