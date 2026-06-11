import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PassengerHome from './pages/PassengerHome';
import DriverHome from './pages/DriverHome';
import ScheduleRide from './pages/ScheduleRide';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/passenger" element={<ProtectedRoute role="passenger"><PassengerHome /></ProtectedRoute>} />
            <Route path="/driver" element={<ProtectedRoute role="driver"><DriverHome /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute role="passenger"><ScheduleRide /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
