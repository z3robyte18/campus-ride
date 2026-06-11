const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { name: String, lat: Number, lng: Number },
  destination: { name: String, lat: Number, lng: Number },
  scheduledTime: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  note: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);