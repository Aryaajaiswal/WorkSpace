const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getMyWeekSchedule,
  releaseSeat,
  bookFloaterSeat,
  getAllBookings,
  getUtilizationStats,
} = require('../controllers/bookingController');

// Employee routes
router.get('/my-schedule', requireAuth, getMyWeekSchedule);
router.post('/release', requireAuth, releaseSeat);
router.post('/floater', requireAuth, bookFloaterSeat);

// Admin routes
router.get('/all', requireAuth, requireAdmin, getAllBookings);
router.get('/utilization', requireAuth, requireAdmin, getUtilizationStats);

module.exports = router;
