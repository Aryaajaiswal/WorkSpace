import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function WeekCalendar({ monday, schedule, onRelease }) {
  const weekDates = DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });

  const allocationByDate = {};
  schedule.allocations.forEach(a => {
    allocationByDate[a.date] = a;
  });

  const bookingByDate = {};
  schedule.bookings.forEach(b => {
    bookingByDate[b.date] = b;
  });

  return (
    <div>
      <div style={s.info}>
        Your designated office days are pre-allocated. You can release your seat if you're on leave.
        Released seats go back to the floater pool.
      </div>

      <div style={s.grid}>
        {weekDates.map((date, i) => {
          const ds = date.toISOString().split('T')[0];
          const allocation = allocationByDate[ds];
          const booking = bookingByDate[ds];
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isPast = date < new Date().setHours(0,0,0,0);

          let state = 'no-office'; // not their batch day
          if (allocation?.status === 'allocated') state = 'designated';
          if (allocation?.status === 'released') state = 'released';
          if (booking?.status === 'booked') state = 'floater-booked';

          const cfg = {
            'designated':    { bg:'#7c6af720', border:'#7c6af740', label:'Designated Day', color:'#a78bfa', icon:'🏢' },
            'released':      { bg:'#f59e0b15', border:'#f59e0b40', label:'Seat Released', color:'#f59e0b', icon:'🔓' },
            'floater-booked':{ bg:'#22c55e15', border:'#22c55e40', label:'Floater Booked', color:'#22c55e', icon:'✅' },
            'no-office':     { bg:'#1a1a24',   border:'#ffffff0f', label:'Non-Office Day', color:'#55556a', icon:'🏠' },
          }[state];

          return (
            <div key={i} style={{...s.card, background:cfg.bg, border:`1px solid ${cfg.border}`, opacity: isPast ? 0.5 : 1}}>
              <div style={s.cardHead}>
                <div>
                  <div style={s.dayName}>{DAYS[i]}</div>
                  <div style={s.dayDate}>{date.getDate()} {date.toLocaleDateString('en-IN',{month:'short'})}</div>
                </div>
                <span style={{fontSize:22}}>{cfg.icon}</span>
              </div>

              <div style={{...s.stateLabel, color:cfg.color}}>{cfg.label}</div>

              {allocation && (
                <div style={s.seatInfo}>
                  Seat: <strong style={{color:'#e8e8f0'}}>{allocation.seat_number}</strong>
                </div>
              )}
              {booking && (
                <div style={s.seatInfo}>
                  Seat: <strong style={{color:'#e8e8f0'}}>{booking.seat_number}</strong>
                </div>
              )}

              {state === 'designated' && !isPast && (
                <button style={s.releaseBtn} onClick={() => onRelease(allocation.id)}>
                  On Leave? Release Seat
                </button>
              )}
              {state === 'released' && (
                <div style={s.releasedNote}>Available for others to book</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  info: { background:'#1a1a24', border:'1px solid #ffffff0f', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#8888a8', marginBottom:20, lineHeight:1.6 },
  grid: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 },
  card: { borderRadius:14, padding:16, transition:'all .15s' },
  cardHead: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 },
  dayName: { fontSize:11, color:'#8888a8', fontWeight:500, textTransform:'uppercase', letterSpacing:'1px' },
  dayDate: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginTop:2 },
  stateLabel: { fontSize:12, fontWeight:600, marginBottom:8 },
  seatInfo: { fontSize:12, color:'#8888a8', marginBottom:10 },
  releaseBtn: { width:'100%', background:'none', border:'1px solid #ef444440', color:'#ef4444', borderRadius:8, padding:'7px 0', fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  releasedNote: { fontSize:11, color:'#f59e0b', background:'#f59e0b10', borderRadius:6, padding:'5px 8px', textAlign:'center' },
};
