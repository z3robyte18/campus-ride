# Campus Ride - Real-Time Campus Mobility Platform

## Project Overview

Campus Ride is a full-stack ride management platform designed for campus transportation systems. The application enables passengers and drivers to seamlessly connect within a campus environment through real-time ride booking, live ride tracking, driver management, ratings, and payment support.

The platform leverages real-time communication using Socket.IO, interactive maps for location visualization, and secure authentication to deliver a modern ride-hailing experience tailored for educational campuses such as IIT Roorkee.

### Live Links
Frontend (live application) : https://campus-ride-iota.vercel.app


Backend API: https://campus-ride-backend-9n9m.onrender.com

video and design document : https://drive.google.com/drive/folders/1H5b3MT7Twq8sVT5osyOLGVZdGpsP1SWO?usp=sharing
 
---

## Technology Stack

### Frontend

* React.js
* Vite
* React Router DOM
* Axios
* Socket.IO Client
* React Leaflet & OpenStreetMap
* Recharts
* React Icons

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Mongoose ODM
* bcryptjs
* Helmet
* Morgan
* CORS

### Database

* MongoDB Atlas

### Deployment

* Vercel (Frontend)
* Render (Backend)

---

## Setup Instructions

### Prerequisites

Ensure the following are installed:

* Node.js (v18+ recommended)
* npm
* MongoDB Atlas Account

### Clone Repository

```bash
git clone https://github.com/z3robyte18/campus-ride.git
cd campus-ride
```

---

## Backend Setup

Navigate to backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5177
NODE_ENV=development
```

---

## Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside the frontend folder:

```env
VITE_API_URL=http://localhost:5001
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
```

or

```bash
npm run dev
```

Expected output:

```bash
Server running on port 5001
MongoDB Connected
```

### Start Frontend Application

```bash
cd frontend
npm run dev
```

Expected output:

```bash
Local: http://localhost:5177
```

Open the URL in your browser.

---

## Feature List

### Authentication & Security

* User Registration
* User Login
* JWT-Based Authentication
* Protected Routes
* Role-Based Access Control

### Passenger Features

* Request Instant Ride
* View Available Drivers
* Track Active Ride
* View Ride History
* Schedule Future Rides
* Rate Drivers After Ride Completion
* Digital Payment Support

### Driver Features

* Toggle Online / Offline Status
* Accept Ride Requests
* Update Ride Status
* Live Location Updates
* Driver Statistics Dashboard
* Ride Earnings Insights
* Manage UPI Information

### Real-Time Features

* Live Ride Request Notifications
* Real-Time Ride Status Updates
* Socket.IO Based Communication
* Driver Availability Updates
* Instant Passenger-Driver Synchronization

### Maps & Tracking

* Interactive Campus Map
* OpenStreetMap Integration
* Driver Location Visualization
* Pickup and Destination Tracking

### Analytics

* Driver Performance Metrics
* Ride Analytics
* Demand Trends
* Rating Statistics

---
## Project Structure

```bash
campus-ride/
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── driver/
│   │   │   ├── map/
│   │   │   ├── passenger/
│   │   │   └── payment/
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PassengerHome.jsx
│   │   │   ├── DriverHome.jsx
│   │   │   └── PaymentHistory.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── README.md
│
├── README.md
└── .gitignore
```



---

## Deployment

### Frontend

Hosted on Vercel

### Backend

Hosted on Render

### Database

MongoDB Atlas

---


## 👉 Author Details

* **Name:** Himani Rohaj
* **Program:** BS-MS (Mathematics and Computing)
* **Project Type:** Full-Stack MERN Application
* **GitHub:** https://github.com/z3robyte18


