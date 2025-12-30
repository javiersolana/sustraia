import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function createAdmin() {
  try {
    console.log('🔐 Creating initial admin user...\n');

    const response = await axios.post(`${API_URL}/setup/init-admin`);

    console.log('✅ Admin user created successfully!\n');
    console.log(response.data);
    console.log('\n📋 Login credentials:');
    console.log('   Email: admin@sustraia.com');
    console.log('   Password: admin123\n');
    console.log('🔑 JWT Token:', response.data.token);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!');
    console.log('⚠️  The /api/setup/init-admin endpoint is now disabled.');
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log('ℹ️  Admin user already exists in the database.');
      console.log('\n📋 Login credentials:');
      console.log('   Email: admin@sustraia.com');
      console.log('   Password: admin123');
    } else if (error.response?.status === 409) {
      console.log('ℹ️  Admin user already exists.');
      console.log(error.response.data.message);
    } else {
      console.error('❌ Error creating admin:', error.response?.data || error.message);
      console.error('\n💡 Make sure:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. Database "sustraia" exists');
      console.error('   3. Connection credentials in .env are correct');
      console.error('   4. Backend server is running (npm run server)');
      process.exit(1);
    }
  }
}

createAdmin();
