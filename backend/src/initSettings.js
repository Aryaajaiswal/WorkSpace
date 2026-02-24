/**
 * initSettings.js
 * Run with: node src/initSettings.js
 * Creates/initializes the system_settings table with default values
 */

const db = require('./config/db');
require('dotenv').config();

async function initSettings() {
  console.log('🔧 Initializing system settings...\n');

  try {
    // Create the system_settings table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created system_settings table');

    // Default settings
    const defaultSettings = [
      ['designated_seat_count', '40'],
      ['floater_seat_count', '10'],
      ['zone_a_name', 'Zone A — Designated Seats'],
      ['zone_b_name', 'Zone B — Floater Seats'],
      ['floater_booking_hour', '15'],
      ['batch1_week1_days', '1,2,3'],
      ['batch1_week2_days', '4,5'],
      ['batch2_week1_days', '4,5'],
      ['batch2_week2_days', '1,2,3'],
      ['company_name', 'WorkSpace'],
      ['app_subtitle', 'Seat Booking']
    ];

    // Insert default settings (ignore duplicates)
    for (const [key, value] of defaultSettings) {
      await db.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
    console.log('✅ Inserted default settings');

    // Display current settings
    const result = await db.query('SELECT key, value FROM system_settings ORDER BY key');
    console.log('\n📋 Current Settings:');
    console.log('─────────────────────');
    result.rows.forEach(row => {
      console.log(`  ${row.key}: ${row.value}`);
    });

    console.log('\n🎉 Settings initialized successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to initialize settings:', err);
    process.exit(1);
  }
}

initSettings();
