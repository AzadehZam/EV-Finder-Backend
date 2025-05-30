# Frontend-Backend Integration Guide

## 🔗 Connecting React Native Frontend to Express.js Backend

This guide explains how to connect your EV Finder React Native app to the Express.js backend API.

## 📋 Prerequisites

1. **Backend Setup**:
   - Node.js (v16+)
   - MongoDB (local or cloud)
   - Backend dependencies installed

2. **Frontend Setup**:
   - React Native with Expo
   - Auth0 configured
   - Frontend dependencies installed

## 🚀 Step-by-Step Integration

### 1. Start the Backend Server

```bash
cd Backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Edit .env file with your configuration
# Update MongoDB URI, JWT secret, Auth0 domain, etc.

# Start the development server
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Update Frontend API Configuration

The API service is configured to connect to `http://localhost:3000/api`. If your backend runs on a different port, update the `API_BASE_URL` in `Frontend/EVFinder/services/api.js`.

For physical devices or different network configurations:
```javascript
// In services/api.js
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
// Example: 'http://192.168.1.100:3000/api'
```

### 3. Backend Environment Configuration

Update your `Backend/.env` file:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ev-finder

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Auth0 Configuration
AUTH0_DOMAIN=dev-zrjqxip57a10h8fo.us.auth0.com
AUTH0_AUDIENCE=your-auth0-api-identifier

# CORS Configuration (Important for React Native)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Test the Connection

1. **Health Check**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **In your React Native app**, the dashboard will automatically test the connection when it loads.

## 🔐 Authentication Flow

### How It Works

1. **User signs in with Google** via Auth0 in the React Native app
2. **Frontend receives Auth0 user info** (name, email, picture, Auth0 ID)
3. **Frontend sends user info to backend** via `POST /api/users/auth0`
4. **Backend creates/updates user** in MongoDB and returns a JWT token
5. **Frontend stores JWT token** and uses it for subsequent API calls
6. **All protected endpoints** require the JWT token in the Authorization header

### Authentication Endpoints

- `POST /api/users/auth0` - Create/update user from Auth0 (public)
- `GET /api/users/profile` - Get user profile (protected)
- `GET /api/users/dashboard` - Get dashboard data (protected)

## 📱 API Usage Examples

### User Authentication
```javascript
// After Auth0 login
const authResult = await loginWithAuth0(userInfo);
if (authResult.success) {
  // User is now authenticated and JWT token is stored
  console.log('User:', authResult.user);
}
```

### Fetch Dashboard Data
```javascript
const response = await ApiService.getUserDashboard();
if (response.success) {
  console.log('Dashboard data:', response.data);
}
```

### Find Nearby Stations
```javascript
const response = await ApiService.getNearbyStations(
  37.7749, // latitude
  -122.4194, // longitude
  10, // radius in km
  20 // limit
);
```

### Create Reservation
```javascript
const reservationData = {
  stationId: 'station_id_here',
  connectorType: 'CCS',
  startTime: '2024-01-15T14:00:00Z',
  endTime: '2024-01-15T16:00:00Z',
  vehicleInfo: {
    make: 'Tesla',
    model: 'Model 3',
    batteryCapacity: 75,
    currentCharge: 20
  }
};

const response = await ApiService.createReservation(reservationData);
```

## 🛠 Available API Endpoints

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/favorites` - Get favorite stations
- `POST /api/users/favorites` - Add favorite station
- `DELETE /api/users/favorites/:stationId` - Remove favorite

### Station Endpoints
- `GET /api/stations` - Get all stations (with filtering)
- `GET /api/stations/nearby` - Get nearby stations
- `GET /api/stations/:id` - Get station by ID
- `POST /api/stations` - Create station (admin)
- `PUT /api/stations/:id` - Update station (admin)

### Reservation Endpoints
- `GET /api/reservations` - Get user reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/:id` - Get reservation by ID
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `PATCH /api/reservations/:id/start` - Start charging session
- `PATCH /api/reservations/:id/complete` - Complete session

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure backend server is running
   - Check the API_BASE_URL in frontend
   - Verify CORS configuration

2. **Authentication Errors**:
   - Check JWT_SECRET in backend .env
   - Verify Auth0 configuration
   - Ensure user info is being sent correctly

3. **Database Errors**:
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env
   - Verify database connection

4. **CORS Issues**:
   - Add your frontend URL to ALLOWED_ORIGINS
   - For Expo: include `exp://localhost:19000`
   - For development: include `http://localhost:19006`

### Network Configuration for Physical Devices

If testing on a physical device, replace `localhost` with your computer's IP address:

1. Find your computer's IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep inet
   
   # On Windows
   ipconfig
   ```

2. Update API_BASE_URL:
   ```javascript
   const API_BASE_URL = 'http://192.168.1.100:3000/api';
   ```

3. Update backend CORS:
   ```env
   ALLOWED_ORIGINS=http://192.168.1.100:3000,http://192.168.1.100:19006,exp://192.168.1.100:19000
   ```

## 📊 Data Flow

```
React Native App
       ↓
   Auth0 Login
       ↓
  Get User Info
       ↓
POST /api/users/auth0
       ↓
   Store JWT Token
       ↓
API Calls with Authorization Header
       ↓
   Backend Validates JWT
       ↓
   Database Operations
       ↓
   Return Response
```

## 🔒 Security Considerations

1. **JWT Tokens**: Stored securely in AsyncStorage
2. **HTTPS**: Use HTTPS in production
3. **Environment Variables**: Never commit secrets to version control
4. **Rate Limiting**: Backend includes rate limiting
5. **Input Validation**: All endpoints validate input data

## 🚀 Next Steps

1. **Add More Screens**: Create screens for stations list, reservations, etc.
2. **Real-time Updates**: Implement WebSocket for real-time station availability
3. **Push Notifications**: Add notifications for reservation updates
4. **Maps Integration**: Add Google Maps for station locations
5. **Offline Support**: Implement offline data caching

## 📝 Testing

Test the integration by:

1. Starting the backend server
2. Running the React Native app
3. Signing in with Google
4. Checking the dashboard loads with real data
5. Testing API calls from the dashboard buttons

The dashboard will show real statistics from the backend and display any reservations or favorite stations you have. 