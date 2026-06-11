const Ride = require('../models/Ride');
const User = require('../models/User');

module.exports = (io) => {
  const connectedUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Register user
    socket.on('register', (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Driver goes online/offline
    socket.on('driver:toggle', async ({ driverId, isOnline }) => {
      await User.findByIdAndUpdate(driverId, { isOnline });
      io.emit('driver:status_update', { driverId, isOnline });
    });

    // Passenger requests a ride
    socket.on('ride:new_request', async (rideData) => {
      // Notify all online drivers
      const onlineDrivers = await User.find({ role: 'driver', isOnline: true });
      onlineDrivers.forEach(driver => {
        const driverSocket = connectedUsers.get(driver._id.toString());
        if (driverSocket) {
          io.to(driverSocket).emit('ride:new_request', rideData);
        }
      });
    });

    // Driver accepts ride
    socket.on('ride:accepted', async ({ rideId, driverId }) => {
      const ride = await Ride.findById(rideId)
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone vehicleNumber vehicleType averageRating currentLocation');

      if (ride) {
        const passengerSocket = connectedUsers.get(ride.passenger._id.toString());
        if (passengerSocket) {
          io.to(passengerSocket).emit('ride:accepted', ride);
        }
        // Tell all drivers this ride is taken
        io.emit('ride:taken', { rideId });
      }
    });

    // Ride status updates
    socket.on('ride:status_update', async ({ rideId, status }) => {
      const ride = await Ride.findById(rideId)
        .populate('passenger', 'name phone')
        .populate('driver', 'name phone vehicleNumber');

      if (ride) {
        const passengerSocket = connectedUsers.get(ride.passenger._id.toString());
        if (passengerSocket) io.to(passengerSocket).emit('ride:status_update', { rideId, status, ride });
        if (ride.driver) {
          const driverSocket = connectedUsers.get(ride.driver._id.toString());
          if (driverSocket) io.to(driverSocket).emit('ride:status_update', { rideId, status, ride });
        }
      }
    });

    // Driver location update
    socket.on('driver:location', async ({ driverId, lat, lng, rideId }) => {
      await User.findByIdAndUpdate(driverId, { currentLocation: { lat, lng } });
      if (rideId) {
        const ride = await Ride.findById(rideId);
        if (ride && ride.passenger) {
          const passengerSocket = connectedUsers.get(ride.passenger.toString());
          if (passengerSocket) {
            io.to(passengerSocket).emit('driver:location', { driverId, lat, lng });
          }
        }
      }
    });

    // Ride cancelled
    socket.on('ride:cancelled', async ({ rideId, cancelledBy }) => {
      const ride = await Ride.findById(rideId);
      if (ride) {
        const passengerSocket = connectedUsers.get(ride.passenger.toString());
        const driverSocket = ride.driver ? connectedUsers.get(ride.driver.toString()) : null;
        if (passengerSocket) io.to(passengerSocket).emit('ride:cancelled', { rideId, cancelledBy });
        if (driverSocket) io.to(driverSocket).emit('ride:cancelled', { rideId, cancelledBy });
      }
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.userId);
      console.log('Socket disconnected:', socket.id);
    });
  });
};