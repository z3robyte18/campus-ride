const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleNumber, licenseNumber, vehicleType } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password, role, phone,
      vehicleNumber, licenseNumber, vehicleType,
    });

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
      isOnline: user.isOnline, averageRating: user.averageRating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user._id),
      isOnline: user.isOnline, averageRating: user.averageRating,
      totalRides: user.totalRides,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};