require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

console.log('Starting Campus Ride Backend...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  transports: ['polling', 'websocket'],
});

connectDB();

app.use(cors({ origin: '*', credentials: false }));
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { req.io = io; next(); });

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/rides',   require('./routes/rides'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/ratings', require('./routes/ratings'));

app.get('/',       (req, res) => res.json({ message: 'Campus Ride API running', status: 'ok' }));
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

require('./socket/socketHandler')(io);
app.use(errorHandler);

process.on('unhandledRejection', (err) => console.error('Unhandled Rejection:', err.message));
process.on('uncaughtException',  (err) => console.error('Uncaught Exception:', err.message));

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
