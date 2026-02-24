const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getSeatsForDate } = require('../controllers/seatController');
const { getHolidays, addHoliday, deleteHoliday, getAllUsers } = require('../controllers/adminController');

// Seats
router.get('/', requireAuth, getSeatsForDate);

// Admin - holidays
router.get('/holidays', requireAuth, getHolidays);
router.post('/holidays', requireAuth, requireAdmin, addHoliday);
router.delete('/holidays/:id', requireAuth, requireAdmin, deleteHoliday);

// Admin - users
router.get('/users', requireAuth, requireAdmin, getAllUsers);

module.exports = router;
