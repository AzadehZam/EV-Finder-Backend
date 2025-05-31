import mongoose from 'mongoose';
import ChargingStation from '../models/ChargingStation';
import User from '../models/User';
import connectDB from '../config/database';

const sampleStations = [
  {
    name: 'Tesla Supercharger - Downtown Vancouver',
    address: {
      street: '1055 Canada Pl',
      city: 'Vancouver',
      state: 'BC',
      zipCode: 'V6C 0C3',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [-123.1207, 49.2827] // [longitude, latitude]
    },
    connectorTypes: [
      {
        type: 'Tesla',
        count: 8,
        available: 6,
        power: 150
      },
      {
        type: 'CCS',
        count: 4,
        available: 3,
        power: 150
      }
    ],
    totalPorts: 12,
    availablePorts: 9,
    pricing: {
      perKwh: 0.28,
      perMinute: 0.26,
      sessionFee: 1.00
    },
    amenities: ['wifi', 'restroom', 'food', 'shopping'],
    operatingHours: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' }
    },
    status: 'active',
    rating: 4.5
  },
  {
    name: 'ChargePoint - Metrotown Mall',
    address: {
      street: '4700 Kingsway',
      city: 'Burnaby',
      state: 'BC',
      zipCode: 'V5H 4M1',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [-123.0103, 49.2256]
    },
    connectorTypes: [
      {
        type: 'CCS',
        count: 6,
        available: 4,
        power: 50
      },
      {
        type: 'CHAdeMO',
        count: 2,
        available: 2,
        power: 50
      },
      {
        type: 'Type2',
        count: 4,
        available: 3,
        power: 22
      }
    ],
    totalPorts: 12,
    availablePorts: 9,
    pricing: {
      perKwh: 0.25,
      perMinute: 0.20,
      sessionFee: 0.50
    },
    amenities: ['wifi', 'restroom', 'food', 'shopping', 'parking'],
    operatingHours: {
      monday: { open: '06:00', close: '23:00' },
      tuesday: { open: '06:00', close: '23:00' },
      wednesday: { open: '06:00', close: '23:00' },
      thursday: { open: '06:00', close: '23:00' },
      friday: { open: '06:00', close: '24:00' },
      saturday: { open: '06:00', close: '24:00' },
      sunday: { open: '08:00', close: '22:00' }
    },
    status: 'active',
    rating: 4.2
  },
  {
    name: 'Electrify Canada - Coquitlam Centre',
    address: {
      street: '2929 Barnet Hwy',
      city: 'Coquitlam',
      state: 'BC',
      zipCode: 'V3B 5R5',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [-122.8007, 49.2781]
    },
    connectorTypes: [
      {
        type: 'CCS',
        count: 4,
        available: 3,
        power: 350
      },
      {
        type: 'CHAdeMO',
        count: 1,
        available: 1,
        power: 50
      }
    ],
    totalPorts: 5,
    availablePorts: 4,
    pricing: {
      perKwh: 0.35,
      perMinute: 0.30,
      sessionFee: 2.00
    },
    amenities: ['wifi', 'restroom', 'food', 'shopping'],
    operatingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '23:00' },
      saturday: { open: '07:00', close: '23:00' },
      sunday: { open: '08:00', close: '21:00' }
    },
    status: 'active',
    rating: 4.7
  },
  {
    name: 'BC Hydro Fast Charging - Richmond Centre',
    address: {
      street: '6551 No. 3 Rd',
      city: 'Richmond',
      state: 'BC',
      zipCode: 'V6Y 2B6',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [-123.1364, 49.1666]
    },
    connectorTypes: [
      {
        type: 'CCS',
        count: 2,
        available: 1,
        power: 100
      },
      {
        type: 'CHAdeMO',
        count: 2,
        available: 2,
        power: 100
      }
    ],
    totalPorts: 4,
    availablePorts: 3,
    pricing: {
      perKwh: 0.22,
      perMinute: 0.18,
      sessionFee: 0.00
    },
    amenities: ['wifi', 'restroom', 'food', 'shopping', 'parking'],
    operatingHours: {
      monday: { open: '07:00', close: '22:00' },
      tuesday: { open: '07:00', close: '22:00' },
      wednesday: { open: '07:00', close: '22:00' },
      thursday: { open: '07:00', close: '22:00' },
      friday: { open: '07:00', close: '23:00' },
      saturday: { open: '08:00', close: '23:00' },
      sunday: { open: '09:00', close: '21:00' }
    },
    status: 'active',
    rating: 4.0
  },
  {
    name: 'FLO - University of British Columbia',
    address: {
      street: '2329 West Mall',
      city: 'Vancouver',
      state: 'BC',
      zipCode: 'V6T 1Z4',
      country: 'Canada'
    },
    location: {
      type: 'Point',
      coordinates: [-123.2460, 49.2606]
    },
    connectorTypes: [
      {
        type: 'Type2',
        count: 8,
        available: 6,
        power: 22
      },
      {
        type: 'CCS',
        count: 2,
        available: 2,
        power: 50
      }
    ],
    totalPorts: 10,
    availablePorts: 8,
    pricing: {
      perKwh: 0.20,
      perMinute: 0.15,
      sessionFee: 0.00
    },
    amenities: ['wifi', 'parking'],
    operatingHours: {
      monday: { open: '00:00', close: '23:59' },
      tuesday: { open: '00:00', close: '23:59' },
      wednesday: { open: '00:00', close: '23:59' },
      thursday: { open: '00:00', close: '23:59' },
      friday: { open: '00:00', close: '23:59' },
      saturday: { open: '00:00', close: '23:59' },
      sunday: { open: '00:00', close: '23:59' }
    },
    status: 'active',
    rating: 4.3
  }
];

const sampleUser = {
  name: 'Test User',
  email: 'test@example.com',
  auth0Id: 'auth0|test123',
  picture: 'https://via.placeholder.com/150',
  preferences: {
    preferredConnectorTypes: ['CCS', 'Type2'],
    maxTravelDistance: 50,
    priceRange: {
      min: 0,
      max: 0.30
    },
    favoriteStations: []
  }
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await ChargingStation.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create sample user
    console.log('👤 Creating sample user...');
    const user = await User.create(sampleUser);
    console.log(`✅ Sample user created with ID: ${user._id}`);

    // Create sample charging stations
    console.log('⚡ Creating sample charging stations...');
    const stations = await ChargingStation.insertMany(sampleStations);
    console.log(`✅ ${stations.length} charging stations created`);

    // Display created stations
    console.log('\n📍 Created Charging Stations:');
    stations.forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   ID: ${station._id}`);
      console.log(`   Location: ${station.address.street}, ${station.address.city}, ${station.address.state}, ${station.address.zipCode}, ${station.address.country}`);
      console.log(`   Connectors: ${station.connectorTypes.map(c => `${c.type}(${c.count})`).join(', ')}`);
      console.log(`   Available: ${station.availablePorts}/${station.totalPorts}`);
      console.log('');
    });

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n💡 You can now use these station IDs in your frontend for testing:');
    stations.forEach((station, index) => {
      console.log(`   Station ${index + 1}: ${station._id}`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase; 