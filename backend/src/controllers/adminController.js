const db = require('../config/db');

// GET all holidays
async function getHolidays(req, res) {
  try {
    const result = await db.query(`SELECT * FROM holidays ORDER BY date`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

// POST add holiday
async function addHoliday(req, res) {
  const { date, name } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'date and name are required.' });

  try {
    const existing = await db.query(`SELECT id FROM holidays WHERE date = $1`, [date]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A holiday already exists for this date.' });
    }

    const result = await db.query(
      `INSERT INTO holidays (date, name) VALUES ($1, $2) RETURNING *`,
      [date, name]
    );
    res.status(201).json({ success: true, holiday: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

// DELETE holiday
async function deleteHoliday(req, res) {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM holidays WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

// GET all users (admin view)
async function getAllUsers(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.batch, u.is_designated,
              t.name AS team_name, s.seat_number AS assigned_seat
       FROM users u
       LEFT JOIN teams t ON t.id = u.team_id
       LEFT JOIN seats s ON s.id = u.seat_id
       ORDER BY u.batch, t.name, u.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { getHolidays, addHoliday, deleteHoliday, getAllUsers };
