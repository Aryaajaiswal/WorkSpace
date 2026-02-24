/**
 * seed.js
 * Run with: node src/seed.js
 * Creates: 10 teams, 50 seats, 80 employees, 1 admin, 2-week allocations
 */

const bcrypt = require('bcryptjs');
const db = require('./config/db');
const { isWeekend, getBatchDaysSync, getWeekNumber } = require('./utils/batchUtils');
require('dotenv').config();

const TEAM_NAMES = [
  'Squad Alpha', 'Squad Beta', 'Squad Gamma', 'Squad Delta', 'Squad Epsilon',
  'Squad Zeta', 'Squad Eta', 'Squad Theta', 'Squad Iota', 'Squad Kappa',
];

const FIRST_NAMES = ['Arjun','Priya','Rahul','Sneha','Vikram','Ananya','Rohit','Divya','Karan','Meera',
  'Aditya','Pooja','Nikhil','Kavya','Siddharth','Lakshmi','Rohan','Nisha','Amit','Swati'];
const LAST_NAMES = ['Rao','Sharma','Patel','Singh','Kumar','Gupta','Joshi','Verma','Nair','Pillai'];

function randomName() {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

// Get all working days for 2 weeks starting from the nearest Monday
function getTwoWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    if (!isWeekend(d)) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

async function seed() {
  console.log('🌱 Starting seed...\n');

  // 1. Clear existing data
  await db.query('DELETE FROM seat_bookings');
  await db.query('DELETE FROM seat_allocations');
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM seats');
  await db.query('DELETE FROM teams');
  await db.query('DELETE FROM holidays');
  console.log('✅ Cleared existing data');

  // 2. Create teams (5 per batch)
  const teamIds = [];
  for (let i = 0; i < 10; i++) {
    const batch = i < 5 ? 1 : 2;
    const res = await db.query(
      `INSERT INTO teams (name, batch) VALUES ($1, $2) RETURNING id`,
      [TEAM_NAMES[i], batch]
    );
    teamIds.push({ id: res.rows[0].id, batch });
  }
  console.log('✅ Created 10 teams');

  // 3. Create seats (80 designated in Zone A, 10 floater in Zone B)
  const seatIds = [];
  for (let i = 1; i <= 80; i++) {
    const res = await db.query(
      `INSERT INTO seats (seat_number, type, zone) VALUES ($1, 'designated', 'A') RETURNING id`,
      [`A${i}`]
    );
    seatIds.push(res.rows[0].id);
  }
  for (let i = 1; i <= 10; i++) {
    await db.query(
      `INSERT INTO seats (seat_number, type, zone) VALUES ($1, 'floater', 'B') RETURNING id`,
      [`F${i}`]
    );
  }
  console.log('✅ Created 90 seats (80 designated + 10 floater)');

  // 4. Create admin
  const adminHash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Admin', 'admin@wissen.com', $1, 'admin')`,
    [adminHash]
  );
  console.log('✅ Created admin: admin@wissen.com / admin123');

  // 5. Create 80 employees (8 per team) with assigned seats
  const userRecords = [];
  let seatIndex = 0;

  for (const team of teamIds) {
    for (let m = 0; m < 8; m++) {
      const name = randomName();
      const emailName = name.toLowerCase().replace(' ', '.') + Math.floor(Math.random() * 900 + 100);
      const email = `${emailName}@wissen.com`;
      const hash = await bcrypt.hash('pass123', 10);
      const assignedSeatId = seatIds[seatIndex];

      const res = await db.query(
        `INSERT INTO users (name, email, password_hash, role, team_id, batch, is_designated, seat_id)
         VALUES ($1, $2, $3, 'employee', $4, $5, true, $6) RETURNING id`,
        [name, email, hash, team.id, team.batch, assignedSeatId]
      );
      userRecords.push({ id: res.rows[0].id, batch: team.batch, seatId: assignedSeatId });
      seatIndex++;
    }
  }
  console.log('✅ Created 80 employees (password: pass123 for all)');
  console.log(`   Sample login: ${userRecords[0].id} — check DB for emails`);

  // 6. Generate 2-week seat allocations
  const workingDates = getTwoWeekDates();
  let allocationCount = 0;

  for (const user of userRecords) {
    for (const date of workingDates) {
      const weekNum = getWeekNumber(date);
      const batchDays = getBatchDaysSync(user.batch, weekNum);
      const dayOfWeek = new Date(date).getDay();

      if (batchDays.includes(dayOfWeek)) {
        await db.query(
          `INSERT INTO seat_allocations (user_id, seat_id, date, status) VALUES ($1, $2, $3, 'allocated')
           ON CONFLICT (seat_id, date) DO NOTHING`,
          [user.id, user.seatId, date]
        );
        allocationCount++;
      }
    }
  }
  console.log(`✅ Generated ${allocationCount} seat allocations for 2 weeks`);

  // 7. Add sample holidays
  const holidays = [
    { date: '2026-03-25', name: 'Holi' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti' },
    { date: '2026-05-01', name: 'Labour Day' },
  ];
  for (const h of holidays) {
    await db.query(`INSERT INTO holidays (date, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [h.date, h.name]);
  }
  console.log('✅ Added 3 sample holidays');

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Admin login:    admin@wissen.com / admin123');
  console.log('  Employee login: (check DB for emails) / pass123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
