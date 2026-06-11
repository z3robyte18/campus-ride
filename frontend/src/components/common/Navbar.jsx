import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaCar, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <FaCar /> Campus Ride
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <span className="nav-user">
              <FaUser /> {user.name} ({user.role})
            </span>
            {user.role === 'passenger' && (
              <>
                <Link to="/passenger">Dashboard</Link>
                <Link to="/schedule">Schedule</Link>
              </>
            )}
            {user.role === 'driver' && <Link to="/driver">Dashboard</Link>}
            <button onClick={handleLogout} className="btn-logout">
              <FaSignOutAlt /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary-nav">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
