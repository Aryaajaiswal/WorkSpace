require('dotenv').config();
const db = require('./src/config/db');

async function checkUsers() {
  try {
    const result = await db.query('SELECT email, role, name FROM users LIMIT 20');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

checkUsers();
