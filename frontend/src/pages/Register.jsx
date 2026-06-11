import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'passenger',
    phone: '', vehicleNumber: '', licenseNumber: '', vehicleType: 'e-rickshaw'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome, ${user.name}! 🎉`);
      navigate(user.role === 'passenger' ? '/passenger' : '/driver');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🛺</div>
        <h2>Create Account</h2>
        <p className="auth-sub">Join Campus Ride today</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input required placeholder="Your full name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required placeholder="you@iitr.ac.in"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input placeholder="10-digit mobile number"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required placeholder="Minimum 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>I am a</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
            </select>
          </div>
          {form.role === 'driver' && (
            <div className="driver-extra">
              <div className="form-group">
                <label>Vehicle Number</label>
                <input placeholder="e.g. UK07E1234"
                  value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>License Number</label>
                <input placeholder="Driving License No."
                  value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vehicle Type</label>
                <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                  <option value="e-rickshaw">E-Rickshaw</option>
                  <option value="auto">Auto</option>
                  <option value="cycle-rickshaw">Cycle Rickshaw</option>
                </select>
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default Register;
