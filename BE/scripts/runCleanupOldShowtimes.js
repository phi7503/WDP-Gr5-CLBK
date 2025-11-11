/**
 * Script to manually run cleanup of old showtimes
 * Usage: node scripts/runCleanupOldShowtimes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { cleanupOldShowtimes } from '../jobs/cleanupOldShowtimes.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Main execution
(async () => {
  await connectDB();
  await cleanupOldShowtimes();
  await mongoose.connection.close();
  process.exit(0);
})();

