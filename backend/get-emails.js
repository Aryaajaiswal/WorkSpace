require('dotenv').config();
const db = require('./src/config/db');

async function getEmails() {
  try {
    const result = await db.query("SELECT email, name FROM users WHERE role = 'employee' LIMIT 20");
    console.log('Employee Emails (first 20):');
    result.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.email} (${row.name})`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

getEmails();
