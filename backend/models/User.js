const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['passenger', 'driver'], required: true },
  phone: { type: String },
  profileImage: { type: String },
  vehicleNumber: { type: String },
  vehicleType: { type: String, default: 'e-rickshaw' },
  licenseNumber: { type: String },
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  isBusy: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number, default: 29.8674 },
    lng: { type: Number, default: 77.8960 }
  },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  totalRides: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
