const db = require('../config/db');
const { isWeekend, isAfterFloaterTimeSync, getWeekNumber, isDesignatedDaySync, getFloaterBookingHour } = require('../utils/batchUtils');

// GET: My bookings and allocations for a week
async function getMyWeekSchedule(req, res) {
  const { weekStart } = req.query; // ISO date string of Monday
  if (!weekStart) return res.status(400).json({ error: 'weekStart date is required.' });

  try {
    const allocations = await db.query(
      `SELECT sa.date, sa.status, s.seat_number, s.type
       FROM seat_allocations sa
       JOIN seats s ON s.id = sa.seat_id
       WHERE sa.user_id = $1 AND sa.date >= $2 AND sa.date < ($2::date + interval '7 days')
       ORDER BY sa.date`,
      [req.user.userId, weekStart]
    );

    const bookings = await db.query(
      `SELECT sb.date, sb.status, s.seat_number, s.type
       FROM seat_bookings sb
       JOIN seats s ON s.id = sb.seat_id
       WHERE sb.user_id = $1 AND sb.date >= $2 AND sb.date < ($2::date + interval '7 days')
       ORDER BY sb.date`,
      [req.user.userId, weekStart]
    );

    res.json({
      allocations: allocations.rows,
      bookings: bookings.rows,
    });
  } catch (err) {
    console.error('getMyWeekSchedule error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// POST: Release a designated seat (on leave)
async function releaseSeat(req, res) {
  const { allocationId } = req.body;
  if (!allocationId) return res.status(400).json({ error: 'allocationId is required.' });

  try {
    // Verify this allocation belongs to the current user
    const check = await db.query(
      `SELECT * FROM seat_allocations WHERE id = $1 AND user_id = $2`,
      [allocationId, req.user.userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: 'This allocation does not belong to you.' });
    }

    const allocation = check.rows[0];

    // Can only release future dates
    if (new Date(allocation.date) < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: 'Cannot release a past date.' });
    }

    if (allocation.status === 'released') {
      return res.status(400).json({ error: 'Seat is already released.' });
    }

    await db.query(
      `UPDATE seat_allocations SET status = 'released' WHERE id = $1`,
      [allocationId]
    );

    res.json({ success: true, message: 'Seat released successfully. It is now available for floater booking.' });
  } catch (err) {
    console.error('releaseSeat error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// POST: Book a floater seat
async function bookFloaterSeat(req, res) {
  const { seatId, date } = req.body;

  if (!seatId || !date) {
    return res.status(400).json({ error: 'seatId and date are required.' });
  }

  // --- RULE 1: Only tomorrow ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);

  if (bookingDate.getTime() !== tomorrow.getTime()) {
    return res.status(400).json({ error: 'Floater seats can only be booked for tomorrow.' });
  }

  // --- RULE 2: After configured time ---
  const floaterHour = await getFloaterBookingHour();
  if (!isAfterFloaterTimeSync()) {
    const now = new Date();
    const hoursLeft = floaterHour - 1 - now.getHours();
    const minsLeft = 60 - now.getMinutes();
    const timeStr = `${floaterHour}:00 PM`;
    return res.status(400).json({
      error: `Floater booking opens at ${timeStr}. Please try again in ~${hoursLeft}h ${minsLeft}m.`,
    });
  }

  // --- RULE 3: No weekends ---
  if (isWeekend(date)) {
    return res.status(400).json({ error: 'Bookings are not allowed on weekends.' });
  }

  // --- RULE 4: No holidays ---
  const holiday = await db.query(`SELECT name FROM holidays WHERE date = $1`, [date]);
  if (holiday.rows.length > 0) {
    return res.status(400).json({
      error: `${date} is a public holiday: ${holiday.rows[0].name}. No bookings allowed.`,
    });
  }

  // --- RULE 5: Seat must be floater type or a released designated seat ---
  const seatCheck = await db.query(`SELECT * FROM seats WHERE id = $1`, [seatId]);
  if (seatCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Seat not found.' });
  }

  const seat = seatCheck.rows[0];
  const isReleasedDesignated =
    seat.type === 'designated'
      ? await (async () => {
          const rel = await db.query(
            `SELECT id FROM seat_allocations WHERE seat_id = $1 AND date = $2 AND status = 'released'`,
            [seatId, date]
          );
          return rel.rows.length > 0;
        })()
      : false;

  if (seat.type !== 'floater' && !isReleasedDesignated) {
    return res.status(400).json({ error: 'This seat is not available for booking.' });
  }

  // --- RULE 6: No double booking (user already has a booking that day) ---
  const existingUserBooking = await db.query(
    `SELECT id FROM seat_bookings WHERE user_id = $1 AND date = $2 AND status = 'booked'`,
    [req.user.userId, date]
  );
  if (existingUserBooking.rows.length > 0) {
    return res.status(400).json({ error: 'You already have a booking for this date.' });
  }

  // --- TRANSACTION: Prevent race condition ---
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock check — is seat still available?
    const existing = await client.query(
      `SELECT id FROM seat_bookings WHERE seat_id = $1 AND date = $2 AND status = 'booked' FOR UPDATE`,
      [seatId, date]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Sorry, this seat was just booked by someone else.' });
    }

    const booking = await client.query(
      `INSERT INTO seat_bookings (user_id, seat_id, date) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.userId, seatId, date]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Seat ${seat.seat_number} booked successfully for ${date}.`,
      booking: booking.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('bookFloaterSeat transaction error:', err);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  } finally {
    client.release();
  }
}

// GET: All bookings for admin
async function getAllBookings(req, res) {
  const { date, weekStart } = req.query;

  try {
    let query, params;

    if (date) {
      query = `
        SELECT 'allocation' AS type, sa.date, u.name, u.email, t.name AS team_name,
               u.batch, s.seat_number, sa.status
        FROM seat_allocations sa
        JOIN users u ON u.id = sa.user_id
        JOIN teams t ON t.id = u.team_id
        JOIN seats s ON s.id = sa.seat_id
        WHERE sa.date = $1
        UNION ALL
        SELECT 'booking' AS type, sb.date, u.name, u.email, t.name AS team_name,
               u.batch, s.seat_number, sb.status
        FROM seat_bookings sb
        JOIN users u ON u.id = sb.user_id
        JOIN teams t ON t.id = u.team_id
        JOIN seats s ON s.id = sb.seat_id
        WHERE sb.date = $1
        ORDER BY date, name`;
      params = [date];
    } else if (weekStart) {
      query = `
        SELECT 'allocation' AS type, sa.date, u.name, u.email, t.name AS team_name,
               u.batch, s.seat_number, sa.status
        FROM seat_allocations sa
        JOIN users u ON u.id = sa.user_id
        JOIN teams t ON t.id = u.team_id
        JOIN seats s ON s.id = sa.seat_id
        WHERE sa.date >= $1 AND sa.date < ($1::date + interval '7 days')
        UNION ALL
        SELECT 'booking' AS type, sb.date, u.name, u.email, t.name AS team_name,
               u.batch, s.seat_number, sb.status
        FROM seat_bookings sb
        JOIN users u ON u.id = sb.user_id
        JOIN teams t ON t.id = u.team_id
        JOIN seats s ON s.id = sb.seat_id
        WHERE sb.date >= $1 AND sb.date < ($1::date + interval '7 days')
        ORDER BY date, name`;
      params = [weekStart];
    } else {
      return res.status(400).json({ error: 'Provide date or weekStart query param.' });
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllBookings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// GET: Utilization stats for admin
async function getUtilizationStats(req, res) {
  const { weekStart } = req.query;
  if (!weekStart) return res.status(400).json({ error: 'weekStart is required.' });

  try {
    const totalSeats = 50;
    const stats = await db.query(
      `SELECT 
        sa.date,
        COUNT(CASE WHEN sa.status = 'allocated' THEN 1 END) AS designated_occupied,
        COUNT(CASE WHEN sa.status = 'released' THEN 1 END) AS released
       FROM seat_allocations sa
       WHERE sa.date >= $1 AND sa.date < ($1::date + interval '7 days')
       GROUP BY sa.date
       ORDER BY sa.date`,
      [weekStart]
    );

    const floaterStats = await db.query(
      `SELECT 
        sb.date,
        COUNT(*) AS floater_booked
       FROM seat_bookings sb
       WHERE sb.date >= $1 AND sb.date < ($1::date + interval '7 days')
         AND sb.status = 'booked'
       GROUP BY sb.date
       ORDER BY sb.date`,
      [weekStart]
    );

    // Merge
    const floaterMap = {};
    floaterStats.rows.forEach((r) => {
      floaterMap[r.date] = parseInt(r.floater_booked);
    });

    const result = stats.rows.map((r) => {
      const floaterBooked = floaterMap[r.date] || 0;
      const total = parseInt(r.designated_occupied) + floaterBooked;
      return {
        date: r.date,
        designatedOccupied: parseInt(r.designated_occupied),
        released: parseInt(r.released),
        floaterBooked,
        totalOccupied: total,
        utilizationPercent: Math.round((total / totalSeats) * 100),
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getUtilizationStats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = {
  getMyWeekSchedule,
  releaseSeat,
  bookFloaterSeat,
  getAllBookings,
  getUtilizationStats,
};
