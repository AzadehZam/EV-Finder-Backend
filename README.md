# EV Finder Backend API

A comprehensive REST API for the EV Finder application, built with Express.js, TypeScript, and MongoDB. This backend handles charging station management, user reservations, and authentication.

## 🚀 Features

- **Charging Station Management**: CRUD operations for EV charging stations
- **Reservation System**: Complete booking system with conflict detection
- **User Management**: Auth0 integration with user profiles and preferences
- **Location-based Search**: Find nearby charging stations using geospatial queries
- **Real-time Availability**: Track and update charging port availability
- **Comprehensive Validation**: Input validation and error handling
- **Security**: JWT authentication, rate limiting, and CORS protection

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with Auth0 integration
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Development**: Nodemon, ts-node

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository and navigate to backend**:
   ```bash
   cd Backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
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
   AUTH0_DOMAIN=your-auth0-domain.auth0.com
   AUTH0_AUDIENCE=your-auth0-api-identifier
   
   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Build the application**:
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check
- **GET** `/health` - Check API status

#### Charging Stations
- **GET** `/api/stations` - Get all charging stations (with filtering)
- **GET** `/api/stations/nearby` - Get nearby stations
- **GET** `/api/stations/:id` - Get station by ID
- **POST** `/api/stations` - Create new station (auth required)
- **PUT** `/api/stations/:id` - Update station (auth required)
- **DELETE** `/api/stations/:id` - Delete station (auth required)
- **PATCH** `/api/stations/:id/availability` - Update availability

#### Reservations
- **GET** `/api/reservations` - Get user's reservations (auth required)
- **POST** `/api/reservations` - Create new reservation (auth required)
- **GET** `/api/reservations/:id` - Get reservation by ID (auth required)
- **PUT** `/api/reservations/:id` - Update reservation (auth required)
- **DELETE** `/api/reservations/:id` - Cancel reservation (auth required)
- **PATCH** `/api/reservations/:id/confirm` - Confirm reservation (auth required)
- **PATCH** `/api/reservations/:id/start` - Start charging session (auth required)
- **PATCH** `/api/reservations/:id/complete` - Complete session (auth required)

#### Users
- **POST** `/api/users/auth0` - Create/update user from Auth0
- **GET** `/api/users/profile` - Get user profile (auth required)
- **PUT** `/api/users/profile` - Update user profile (auth required)
- **DELETE** `/api/users/profile` - Delete user account (auth required)
- **GET** `/api/users/dashboard` - Get dashboard data (auth required)
- **GET** `/api/users/favorites` - Get favorite stations (auth required)
- **POST** `/api/users/favorites` - Add favorite station (auth required)
- **DELETE** `/api/users/favorites/:stationId` - Remove favorite (auth required)

### Query Parameters

#### Station Search
- `lat`, `lng` - Coordinates for location-based search
- `radius` - Search radius in kilometers (default: 10)
- `connectorType` - Filter by connector type (CCS, CHAdeMO, Type2, Tesla, J1772)
- `minPower` - Minimum power in kW
- `maxPrice` - Maximum price per kWh
- `amenities` - Filter by amenities
- `availability` - Filter by availability (true/false)
- `page`, `limit` - Pagination parameters

### Request/Response Examples

#### Create Charging Station
```json
POST /api/stations
{
  "name": "Downtown EV Hub",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  },
  "location": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "connectorTypes": [
    {
      "type": "CCS",
      "power": 150,
      "count": 4,
      "available": 4
    }
  ],
  "amenities": ["WiFi", "Restroom", "Shopping"],
  "pricing": {
    "perKwh": 0.35,
    "currency": "USD"
  }
}
```

#### Create Reservation
```json
POST /api/reservations
{
  "stationId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "connectorType": "CCS",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T16:00:00Z",
  "vehicleInfo": {
    "make": "Tesla",
    "model": "Model 3",
    "batteryCapacity": 75,
    "currentCharge": 20
  },
  "notes": "Need fast charging for road trip"
}
```

### Error Responses
All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## 🗄 Database Schema

### Collections
- **users** - User profiles and preferences
- **chargingstations** - Charging station information
- **reservations** - Booking records
- **reviews** - Station reviews and ratings

### Indexes
- Geospatial index on station locations for proximity searches
- Compound indexes for common query patterns
- Unique constraints on user emails and Auth0 IDs

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Prevent API abuse
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ev-finder
JWT_SECRET=your-production-secret-key
AUTH0_DOMAIN=your-production-auth0-domain
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs for debugging

## 🔄 API Versioning

Current API version: v1
Base URL: `/api/`

Future versions will be available at `/api/v2/`, etc. 