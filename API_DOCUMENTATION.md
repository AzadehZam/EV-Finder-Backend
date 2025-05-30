# EV Finder Backend API Documentation

This document provides comprehensive documentation for all API endpoints in the EV Finder backend.

## Base URL
```
Production: https://ev-finder-backend.onrender.com
Development: http://localhost:3000
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data (if any)
  "pagination": {}, // Pagination info (for paginated responses)
  "error": {} // Error details (if any)
}
```

---

## 🏥 Health Check

### GET /health
Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "EV Finder API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

---

## 👤 User Management

### POST /api/users/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

### POST /api/users/login
Login user.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET /api/users/profile
Get user profile (requires authentication).

### PUT /api/users/profile
Update user profile (requires authentication).

**Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "preferences": {
    "preferredConnectorTypes": ["CCS", "Type2"],
    "maxTravelDistance": 50,
    "priceRange": { "min": 0, "max": 0.5 }
  }
}
```

---

## 🔌 Charging Stations

### GET /api/stations
Get all charging stations with filtering.

**Query Parameters:**
- `lat` (number): Latitude for location-based search
- `lng` (number): Longitude for location-based search
- `radius` (number): Search radius in km (default: 10)
- `connectorType` (string): Filter by connector type (CCS, CHAdeMO, Type2, Tesla, J1772)
- `minPower` (number): Minimum power in kW
- `maxPrice` (number): Maximum price per kWh
- `amenities` (array): Filter by amenities
- `availability` (boolean): Filter by availability
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example:**
```
GET /api/stations?lat=40.7128&lng=-74.0060&radius=5&connectorType=CCS&page=1&limit=10
```

### GET /api/stations/:id
Get single charging station by ID.

### POST /api/stations
Create new charging station (admin only).

**Body:**
```json
{
  "name": "Tesla Supercharger",
  "address": "123 Main St, New York, NY",
  "location": {
    "type": "Point",
    "coordinates": [-74.0060, 40.7128]
  },
  "connectorTypes": [
    {
      "type": "Tesla",
      "count": 8,
      "available": 6,
      "power": 150
    }
  ],
  "pricing": {
    "perKwh": 0.28,
    "perMinute": 0.26,
    "sessionFee": 1.00
  },
  "amenities": ["wifi", "restroom", "food"],
  "operatingHours": {
    "monday": { "open": "00:00", "close": "23:59" },
    "tuesday": { "open": "00:00", "close": "23:59" }
  }
}
```

### PUT /api/stations/:id
Update charging station (admin only).

### DELETE /api/stations/:id
Delete charging station (admin only).

### GET /api/stations/nearby
Get nearby stations.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude
- `radius` (number): Search radius in km (default: 5)
- `limit` (number): Maximum results (default: 10)

### PATCH /api/stations/:id/availability
Update station availability.

**Body:**
```json
{
  "connectorType": "CCS",
  "available": 3
}
```

---

## 📅 Reservations

### GET /api/reservations
Get user's reservations.

**Query Parameters:**
- `status` (string): Filter by status (pending, confirmed, active, completed, cancelled)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

### POST /api/reservations
Create new reservation.

**Body:**
```json
{
  "stationId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "connectorType": "CCS",
  "startTime": "2024-01-01T10:00:00.000Z",
  "endTime": "2024-01-01T11:00:00.000Z",
  "vehicleInfo": {
    "make": "Tesla",
    "model": "Model 3",
    "batteryCapacity": 75,
    "currentCharge": 20
  },
  "notes": "Need fast charging"
}
```

### GET /api/reservations/:id
Get single reservation by ID.

### PUT /api/reservations/:id
Update reservation.

### DELETE /api/reservations/:id
Cancel reservation.

### GET /api/reservations/availability
Check availability for a time slot.

**Query Parameters:**
- `stationId` (required): Station ID
- `connectorType` (required): Connector type
- `startTime` (required): Start time (ISO 8601)
- `endTime` (required): End time (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "isAvailable": true,
    "totalConnectors": 4,
    "availableConnectors": 2,
    "reservedConnectors": 2,
    "conflictingReservations": []
  }
}
```

### GET /api/reservations/active
Get user's active and upcoming reservations.

**Response:**
```json
{
  "success": true,
  "data": {
    "active": [],
    "upcoming": [],
    "counts": {
      "active": 0,
      "upcoming": 2
    }
  }
}
```

### GET /api/reservations/analytics
Get reservation analytics for user.

**Query Parameters:**
- `period` (number): Period in days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "30 days",
    "summary": {
      "totalReservations": 15,
      "completedReservations": 12,
      "cancelledReservations": 2,
      "completionRate": "80.0",
      "totalSpent": 156.75,
      "averageSpent": "13.06"
    },
    "breakdown": {
      "byStatus": {
        "completed": 12,
        "cancelled": 2,
        "pending": 1
      },
      "byConnectorType": {
        "CCS": 8,
        "Type2": 4,
        "Tesla": 3
      }
    },
    "recentActivity": []
  }
}
```

### PATCH /api/reservations/:id/confirm
Confirm reservation (admin/system).

### PATCH /api/reservations/:id/start
Start charging session.

### PATCH /api/reservations/:id/complete
Complete charging session.

**Body:**
```json
{
  "actualCost": 25.50,
  "paymentInfo": {
    "method": "credit_card",
    "transactionId": "txn_123456789"
  }
}
```

### GET /api/reservations/station/:stationId
Get reservations for a specific station.

**Query Parameters:**
- `status` (string): Filter by status
- `date` (string): Filter by date (ISO 8601)
- `page` (number): Page number
- `limit` (number): Items per page

### GET /api/reservations/admin/all
Get all reservations with advanced filtering (admin only).

**Query Parameters:**
- `status` (string): Filter by status
- `stationId` (string): Filter by station
- `userId` (string): Filter by user
- `connectorType` (string): Filter by connector type
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `page` (number): Page number
- `limit` (number): Items per page
- `sortBy` (string): Sort field (createdAt, startTime, endTime, status, estimatedCost)
- `sortOrder` (string): Sort order (asc, desc)

---

## 📊 Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "preferences": {
    "preferredConnectorTypes": ["string"],
    "maxTravelDistance": "number",
    "priceRange": {
      "min": "number",
      "max": "number"
    }
  },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Charging Station
```json
{
  "_id": "ObjectId",
  "name": "string",
  "address": "string",
  "location": {
    "type": "Point",
    "coordinates": ["number", "number"]
  },
  "connectorTypes": [
    {
      "type": "string",
      "count": "number",
      "available": "number",
      "power": "number"
    }
  ],
  "totalPorts": "number",
  "availablePorts": "number",
  "pricing": {
    "perKwh": "number",
    "perMinute": "number",
    "sessionFee": "number"
  },
  "amenities": ["string"],
  "operatingHours": {
    "monday": { "open": "string", "close": "string" }
  },
  "status": "string",
  "rating": "number",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Reservation
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "stationId": "ObjectId",
  "connectorType": "string",
  "startTime": "Date",
  "endTime": "Date",
  "estimatedCost": "number",
  "status": "string",
  "vehicleInfo": {
    "make": "string",
    "model": "string",
    "batteryCapacity": "number",
    "currentCharge": "number"
  },
  "paymentInfo": {
    "method": "string",
    "transactionId": "string"
  },
  "notes": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 🔒 Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 📝 Example Usage

### Complete Reservation Flow

1. **Find nearby stations:**
```bash
GET /api/stations?lat=40.7128&lng=-74.0060&radius=5
```

2. **Check availability:**
```bash
GET /api/reservations/availability?stationId=123&connectorType=CCS&startTime=2024-01-01T10:00:00Z&endTime=2024-01-01T11:00:00Z
```

3. **Create reservation:**
```bash
POST /api/reservations
{
  "stationId": "123",
  "connectorType": "CCS",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T11:00:00Z",
  "vehicleInfo": {
    "make": "Tesla",
    "model": "Model 3",
    "batteryCapacity": 75,
    "currentCharge": 20
  }
}
```

4. **Start charging session:**
```bash
PATCH /api/reservations/:id/start
```

5. **Complete session:**
```bash
PATCH /api/reservations/:id/complete
{
  "actualCost": 25.50,
  "paymentInfo": {
    "method": "credit_card",
    "transactionId": "txn_123"
  }
}
```

---

## 🚀 Rate Limiting

- **Window:** 15 minutes
- **Limit:** 100 requests per IP
- **Headers:** Rate limit info included in response headers

---

## 🔧 Development

### Environment Variables
See `env.example` for all required environment variables.

### Testing
```bash
# Test endpoints locally
curl -X GET http://localhost:3000/health

# Test with authentication
curl -X GET http://localhost:3000/api/reservations \
  -H "Authorization: Bearer your-jwt-token"
```

---

For more information, see the [GitHub repository](https://github.com/AzadehZam/EV-Finder-Backend). 