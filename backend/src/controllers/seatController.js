const db = require('../config/db');
const { getSeatCounts, getZoneNames } = require('../utils/batchUtils');

// Get all seats with their status for a given date
async function getSeatsForDate(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date is required.' });

  try {
    // Get dynamic settings
    const [seatCounts, zoneNames] = await Promise.all([
      getSeatCounts(),
      getZoneNames()
    ]);

    const result = await db.query(
      `SELECT 
        s.id,
        s.seat_number,
        s.type,
        s.zone,
        -- Check designated allocations
        sa.id AS allocation_id,
        sa.status AS allocation_status,
        sa.user_id AS allocated_user_id,
        au.name AS allocated_user_name,
        -- Check floater bookings
        sb.id AS booking_id,
        sb.status AS booking_status,
        sb.user_id AS booked_user_id,
        bu.name AS booked_user_name
       FROM seats s
       LEFT JOIN seat_allocations sa ON sa.seat_id = s.id AND sa.date = $1
       LEFT JOIN users au ON au.id = sa.user_id
       LEFT JOIN seat_bookings sb ON sb.seat_id = s.id AND sb.date = $1 AND sb.status = 'booked'
       LEFT JOIN users bu ON bu.id = sb.user_id
       ORDER BY s.id`,
      [date]
    );

    const seats = result.rows.map((seat) => {
      let status = 'available';
      let occupiedBy = null;

      if (seat.type === 'designated') {
        if (seat.allocation_status === 'allocated') {
          status = 'occupied';
          occupiedBy = seat.allocated_user_name;
        } else if (seat.allocation_status === 'released') {
          status = 'released'; // available for floater booking
        }
      } else if (seat.type === 'floater') {
        if (seat.booking_id) {
          status = 'occupied';
          occupiedBy = seat.booked_user_name;
        } else {
          status = 'floater_available';
        }
      }

      return {
        id: seat.id,
        seatNumber: seat.seat_number,
        type: seat.type,
        zone: seat.zone,
        status,
        occupiedBy,
        isMyAllocation: seat.allocated_user_id === req.user.userId,
        isMyBooking: seat.booked_user_id === req.user.userId,
      };
    });

    // Add dynamic metadata
    res.json({
      seats,
      metadata: {
        seatCounts,
        zoneNames
      }
    });
  } catch (err) {
    console.error('getSeatsForDate error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = { getSeatsForDate };
