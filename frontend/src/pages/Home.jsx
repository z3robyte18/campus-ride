import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-badge">IIT Roorkee Campus</div>
        <h1>Campus Ride</h1>
        <p>Smart e-rickshaw booking platform for the IIT Roorkee campus</p>
        {user ? (
          <Link to={user.role === 'passenger' ? '/passenger' : '/driver'} className="btn-hero">Go to Dashboard →</Link>
        ) : (
          <div className="hero-btns">
            <Link to="/register" className="btn-hero">Get Started →</Link>
            <Link to="/login" className="btn-hero-outline">Login</Link>
          </div>
        )}
      </div>
      <div className="features-grid">
        {[
          { icon: '🛺', title: 'Instant Booking', desc: 'Request a ride and get matched with nearby e-rickshaw drivers instantly' },
          { icon: '📍', title: 'Live Tracking', desc: 'Track your driver on the campus map in real time' },
          { icon: '⭐', title: 'Rate Rides', desc: 'Rate drivers and help improve the service for everyone' },
          { icon: '📅', title: 'Schedule Rides', desc: 'Book in advance for early morning classes or events' },
          { icon: '💳', title: 'Easy Payment', desc: 'Pay with cash or UPI, whichever you prefer' },
          { icon: '📊', title: 'Analytics', desc: 'Drivers get insights on peak hours and popular routes' },
        ].map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
