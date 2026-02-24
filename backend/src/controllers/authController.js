const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await db.query(
      `SELECT u.*, t.name AS team_name 
       FROM users u 
       LEFT JOIN teams t ON u.team_id = t.id 
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        batch: user.batch,
        teamId: user.team_id,
        name: user.name,
        isDesignated: user.is_designated,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch,
        teamName: user.team_name,
        isDesignated: user.is_designated,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
}

async function getMe(req, res) {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.batch, u.is_designated, t.name AS team_name
       FROM users u LEFT JOIN teams t ON u.team_id = t.id
       WHERE u.id = $1`,
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { login, getMe };
