# EV Finder Backend API 🚗⚡

A comprehensive REST API for the EV Finder application, built with Express.js, TypeScript, and MongoDB. This backend provides a complete solution for EV charging station management, user reservations, authentication, and location-based services.

## 📖 Project Overview

EV Finder Backend is a robust API service designed to support electric vehicle charging infrastructure. It enables users to discover nearby charging stations, make reservations, manage their charging sessions, and provides operators with tools to manage their charging networks. The system supports multiple connector types, real-time availability tracking, geospatial searches, and comprehensive user management.

## ✨ Features

### 🔌 Charging Station Management
- **Complete CRUD Operations**: Create, read, update, and delete charging stations
- **Geospatial Search**: Find nearby stations using MongoDB geospatial queries
- **Multi-Connector Support**: CCS, CHAdeMO, Type2, Tesla, J1772 connector types
- **Real-time Availability**: Track and update charging port availability in real-time
- **Advanced Filtering**: Filter by power level, price, amenities, and availability
- **Station Analytics**: Comprehensive station usage and performance metrics
- **Operating Hours Management**: Flexible scheduling for station operations
- **Amenities Tracking**: WiFi, restrooms, food, shopping, parking facilities

### 📅 Reservation System
- **Smart Booking**: Create and manage charging session reservations
- **Conflict Detection**: Automatic booking conflict prevention
- **Session Management**: Start, monitor, and complete charging sessions
- **Flexible Scheduling**: Support for immediate and future reservations
- **Reservation Analytics**: Usage patterns and booking statistics
- **Status Tracking**: Pending, confirmed, active, completed, cancelled states
- **Vehicle Integration**: Store vehicle information for optimized charging
- **Payment Integration**: Support for multiple payment methods
- **Admin Oversight**: Comprehensive reservation management for operators

### 👤 User Management & Authentication
- **Auth0 Integration**: Secure authentication with industry-standard OAuth
- **JWT Token Management**: Secure, stateless authentication
- **User Profiles**: Comprehensive user profile management
- **Preferences System**: Personalized user preferences and settings
- **Favorite Stations**: Save and manage favorite charging locations
- **Dashboard Analytics**: Personal usage statistics and insights
- **Account Management**: Profile updates and account deletion

### 🛡️ Security & Middleware
- **Rate Limiting**: Protection against API abuse (100 requests per 15 minutes)
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Comprehensive security headers
- **Input Validation**: express-validator for request validation
- **Error Handling**: Structured error responses and logging
- **Environment-based Configuration**: Separate dev/production settings

### 🗄️ Database & Data Management
- **MongoDB Integration**: Robust NoSQL database with Mongoose ODM
- **Geospatial Indexing**: Optimized location-based queries
- **Data Seeding**: Comprehensive database seeding scripts
- **Schema Validation**: Strict data validation and constraints
- **Backup System**: Database backup and restoration capabilities

### 📊 Analytics & Reporting
- **User Dashboard**: Personal usage statistics and charging history
- **Reservation Analytics**: Booking patterns and trends
- **Station Performance**: Usage metrics and availability tracking
- **Admin Reports**: Comprehensive system analytics

### 🔧 Development & Deployment
- **TypeScript**: Full type safety and developer experience
- **Hot Reloading**: Nodemon for development efficiency
- **Environment Management**: Flexible configuration system
- **Docker Support**: Containerized deployment
- **Render Deployment**: Production-ready cloud deployment
- **Health Monitoring**: System health checks and monitoring

## 🛠️ Technologies Used

### Core Framework & Runtime
- **Node.js** (v18+): JavaScript runtime environment
- **Express.js**: Fast, unopinionated web framework
- **TypeScript**: Static type checking and enhanced developer experience

### Database & ODM
- **MongoDB**: NoSQL document database
- **Mongoose**: Elegant MongoDB object modeling

### Authentication & Security
- **Auth0**: Enterprise-grade authentication service
- **JSON Web Token (JWT)**: Secure token-based authentication
- **bcryptjs**: Password hashing and encryption
- **Helmet**: Security middleware for Express
- **CORS**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting

### Validation & Middleware
- **express-validator**: Comprehensive request validation
- **Morgan**: HTTP request logger middleware
- **dotenv**: Environment variable management

### Development Tools
- **Nodemon**: Development server with hot reloading
- **ts-node**: TypeScript execution environment
- **@types packages**: TypeScript type definitions

### Deployment & Production
- **Render**: Cloud deployment platform
- **Docker**: Containerization support
- **MongoDB Atlas**: Cloud database hosting

## 📋 Installation Instructions

### Prerequisites
- **Node.js** (v18.0 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager
- **Git** for version control

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/ev-finder-backend.git
   cd ev-finder-backend/Backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```

   Configure your `.env` file with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/ev-finder
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ev-finder

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Auth0 Configuration
   AUTH0_DOMAIN=your-auth0-domain.auth0.com
   AUTH0_AUDIENCE=your-auth0-api-identifier

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006,exp://localhost:19000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # External APIs (Optional)
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   CHARGING_STATIONS_API_KEY=your-charging-stations-api-key
   ```

4. **Database Setup**
   
   **Option A: Local MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

   **Option B: MongoDB Atlas**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create cluster and get connection string
   - Update MONGODB_URI in .env file

5. **Seed the Database** (Optional)
   ```bash
   npm run seed
   ```

6. **Build the Application**
   ```bash
   npm run build
   ```

### Development Setup
For development with auto-reload:
```bash
npm run dev
```

### Production Setup
For production deployment:
```bash
npm run build
npm start
```

## 🚀 Usage

### Starting the Server
```bash
# Development mode (with hot reloading)
npm run dev

# Production mode
npm run build && npm start
```

The API will be available at:
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

### Health Check
Verify the API is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "message": "EV Finder API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### API Endpoints Overview

#### 🏥 System Health
- `GET /health` - API health check
- `GET /test` - System test endpoint
- `GET /db-test` - Database connectivity test

#### 🔌 Charging Stations
- `GET /api/stations` - List all stations (with filtering)
- `GET /api/stations/nearby` - Find nearby stations
- `GET /api/stations/:id` - Get specific station
- `POST /api/stations` - Create station (auth required)
- `PUT /api/stations/:id` - Update station (auth required)
- `DELETE /api/stations/:id` - Delete station (auth required)
- `PATCH /api/stations/:id/availability` - Update availability

#### 📅 Reservations
- `GET /api/reservations` - User's reservations (auth required)
- `POST /api/reservations` - Create reservation (auth required)
- `GET /api/reservations/:id` - Get reservation details (auth required)
- `PUT /api/reservations/:id` - Update reservation (auth required)
- `DELETE /api/reservations/:id` - Cancel reservation (auth required)
- `PATCH /api/reservations/:id/confirm` - Confirm reservation
- `PATCH /api/reservations/:id/start` - Start charging session
- `PATCH /api/reservations/:id/complete` - Complete session
- `GET /api/reservations/availability` - Check availability
- `GET /api/reservations/active` - Get active reservations
- `GET /api/reservations/analytics` - Reservation analytics

#### 👤 User Management
- `POST /api/users/auth0` - Auth0 user integration
- `GET /api/users/profile` - Get user profile (auth required)
- `PUT /api/users/profile` - Update profile (auth required)
- `DELETE /api/users/profile` - Delete account (auth required)
- `GET /api/users/dashboard` - User dashboard (auth required)
- `GET /api/users/favorites` - Favorite stations (auth required)
- `POST /api/users/favorites` - Add favorite (auth required)
- `DELETE /api/users/favorites/:stationId` - Remove favorite (auth required)

### Example API Calls

#### Find Nearby Stations
```bash
curl "http://localhost:3000/api/stations/nearby?lat=49.2827&lng=-123.1207&radius=10"
```

#### Create a Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stationId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "connectorType": "CCS",
    "startTime": "2024-01-15T14:00:00Z",
    "endTime": "2024-01-15T16:00:00Z"
  }'
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🔮 Future Improvements

### 🚀 Enhanced Features
- **Real-time WebSocket Integration**: Live station availability updates
- **Advanced Analytics Dashboard**: Comprehensive reporting and insights
- **Mobile Push Notifications**: Real-time alerts for users
- **Machine Learning Integration**: Predictive availability and pricing
- **Multi-language Support**: Internationalization and localization
- **Advanced Payment Processing**: Stripe/PayPal integration
- **IoT Device Integration**: Direct communication with charging hardware

### 🔧 Technical Enhancements
- **Comprehensive Testing Suite**: Unit, integration, and e2e tests
- **API Documentation Generator**: Swagger/OpenAPI integration
- **Caching Layer**: Redis integration for performance optimization
- **Event-Driven Architecture**: Message queues for scalability
- **Microservices Migration**: Service decomposition for better scalability
- **GraphQL API**: Alternative API interface for complex queries
- **Advanced Monitoring**: Application performance monitoring (APM)

### 🛡️ Security & Performance
- **OAuth 2.0 Scopes**: Granular permission management
- **API Versioning**: Backward compatibility support
- **Advanced Rate Limiting**: Dynamic and user-based limits
- **Database Optimization**: Advanced indexing and query optimization
- **CDN Integration**: Global content delivery
- **Load Balancing**: Multi-instance deployment support

### 🌍 Business Features
- **Multi-tenant Architecture**: Support for multiple operators
- **Revenue Sharing System**: Operator commission tracking
- **Advanced Pricing Models**: Dynamic and time-based pricing
- **Fleet Management**: Corporate account support
- **Station Network Integration**: Third-party charging network APIs
- **Carbon Footprint Tracking**: Environmental impact metrics
- **Loyalty Program**: User rewards and incentives system

### 📱 Integration & Connectivity
- **Third-party Integrations**: Google Maps, Apple Maps integration
- **Calendar Synchronization**: Personal calendar integration
- **Vehicle API Integration**: Tesla, BMW, etc. vehicle data
- **Smart Home Integration**: Home charging coordination
- **Weather API Integration**: Weather-based recommendations
- **Traffic API Integration**: Route optimization with charging stops

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

- **API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Frontend Integration**: [FRONTEND_BACKEND_INTEGRATION.md](./FRONTEND_BACKEND_INTEGRATION.md)
- **Issues**: Create an issue in the repository for bug reports
- **Discussions**: Use GitHub Discussions for questions and feature requests

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed database with sample data
npm run seed

# Clean build directory
npm run clean
```

---

**Made with ❤️ for the EV Community**

*Empowering electric vehicle adoption through smart charging infrastructure management.* 