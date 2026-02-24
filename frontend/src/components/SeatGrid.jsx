import React, { useState } from 'react';

const STATUS_STYLE = {
  occupied:         { bg:'#7c6af712', border:'#7c6af740', color:'#a78bfa' },
  mine:             { bg:'#7c6af730', border:'#7c6af7',   color:'#c4b5fd' },
  released:         { bg:'#22c55e18', border:'#22c55e',   color:'#22c55e' },
  available:        { bg:'#1a1a24',   border:'#ffffff0f', color:'#55556a' },
  floater_available:{ bg:'#f59e0b12', border:'#f59e0b50', color:'#f59e0b' },
};

export default function SeatGrid({ seats, loading, userId, onRelease, onFloaterBook, selectedDate, zoneNames }) {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const [confirmSeat, setConfirmSeat] = useState(null);

  // Default zone names if not provided
  const defaultZoneA = 'Zone A — Designated Seats';
  const defaultZoneB = 'Zone B — Floater Seats';
  const zoneALabel = zoneNames?.zoneA || defaultZoneA;
  const zoneBLabel = zoneNames?.zoneB || defaultZoneB;

  const designated = seats.filter(s => s.type === 'designated');
  const floater = seats.filter(s => s.type === 'floater');

  const getSeatStatus = (seat) => {
    if (seat.isMyAllocation && seat.status === 'occupied') return 'mine';
    if (seat.isMyBooking) return 'mine';
    return seat.status;
  };

  const handleClick = (seat) => {
    const status = getSeatStatus(seat);
    if (status === 'mine') return;
    if (status === 'occupied') return;
    if (status === 'floater_available' || status === 'released') {
      setConfirmSeat(seat);
    }
  };

  const confirmBook = () => {
    onFloaterBook(confirmSeat.id);
    setConfirmSeat(null);
  };

  if (loading) {
    return <div style={s.loading}>Loading seats...</div>;
  }

  return (
    <div>
      {/* LEGEND */}
      <div style={s.legend}>
        {[['mine','My Seat'],['occupied','Occupied'],['released','Released (bookable)'],['floater_available','Floater Available'],['available','Empty']].map(([status, label]) => {
          const st = STATUS_STYLE[status] || STATUS_STYLE.available;
          return (
            <div key={status} style={s.legendItem}>
              <div style={{width:10,height:10,borderRadius:3,background:st.bg,border:`1px solid ${st.border}`}} />
              <span style={s.legendLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* DESIGNATED ZONE A */}
      <div style={s.zoneLabel}>
        <span>{zoneALabel} ({designated.length})</span>
        <div style={s.zoneLine} />
      </div>
      <div style={s.grid}>
        {designated.map(seat => {
          const status = getSeatStatus(seat);
          const st = STATUS_STYLE[status] || STATUS_STYLE.available;
          const isHovered = hoveredSeat === seat.id;
          return (
            <div key={seat.id}
              style={{
                ...s.seat,
                background: st.bg,
                border: `1px solid ${st.border}`,
                color: st.color,
                cursor: ['floater_available','released'].includes(status) ? 'pointer' : 'default',
                transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                boxShadow: status === 'mine' ? `0 0 12px ${st.border}50` : 'none',
              }}
              onClick={() => handleClick(seat)}
              onMouseEnter={() => setHoveredSeat(seat.id)}
              onMouseLeave={() => setHoveredSeat(null)}
              title={seat.occupiedBy ? `${seat.seatNumber} — ${seat.occupiedBy}` : seat.seatNumber}
            >
              <span style={{fontSize:9,fontWeight:700}}>{seat.seatNumber}</span>
              {status === 'mine' && <span style={{fontSize:8,position:'absolute',bottom:2,left:0,right:0,textAlign:'center'}}>YOU</span>}
              {status === 'released' && <span style={{fontSize:8,position:'absolute',bottom:2,left:0,right:0,textAlign:'center'}}>FREE</span>}
            </div>
          );
        })}
      </div>

      {/* FLOATER ZONE B */}
      <div style={{...s.zoneLabel, marginTop:20}}>
        <span>{zoneBLabel} ({floater.length})</span>
        <div style={s.zoneLine} />
      </div>
      <div style={s.grid}>
        {floater.map(seat => {
          const status = getSeatStatus(seat);
          const st = STATUS_STYLE[status] || STATUS_STYLE.available;
          const isHovered = hoveredSeat === seat.id;
          return (
            <div key={seat.id}
              style={{
                ...s.seat,
                background: st.bg,
                border: `1px solid ${st.border}`,
                color: st.color,
                cursor: status === 'floater_available' ? 'pointer' : 'default',
                transform: isHovered && status === 'floater_available' ? 'scale(1.12)' : 'scale(1)',
              }}
              onClick={() => handleClick(seat)}
              onMouseEnter={() => setHoveredSeat(seat.id)}
              onMouseLeave={() => setHoveredSeat(null)}
              title={seat.seatNumber}
            >
              <span style={{fontSize:9,fontWeight:700}}>{seat.seatNumber}</span>
              {status === 'floater_available' && <span style={{fontSize:8,position:'absolute',bottom:2,left:0,right:0,textAlign:'center',color:'#f59e0b'}}>+</span>}
            </div>
          );
        })}
      </div>

      {/* CONFIRM MODAL */}
      {confirmSeat && (
        <div style={s.backdrop} onClick={() => setConfirmSeat(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Confirm Booking</div>
            <div style={s.modalSub}>
              You're booking <strong style={{color:'#a78bfa'}}>{confirmSeat.seatNumber}</strong>
              {' '}({confirmSeat.status === 'released' ? 'released designated seat' : 'floater seat'})
            </div>
            <div style={s.modalDate}>📅 Date: <strong>{selectedDate}</strong></div>
            <div style={s.modalNote}>
              {confirmSeat.status === 'released'
                ? '✅ This seat was released by its owner and is now bookable.'
                : '⚡ Floater seats are available after 3 PM for next working day.'}
            </div>
            <div style={s.modalActions}>
              <button style={s.cancelBtn} onClick={() => setConfirmSeat(null)}>Cancel</button>
              <button style={s.confirmBtn} onClick={confirmBook}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  loading: { textAlign:'center', padding:40, color:'#55556a', fontSize:14 },
  legend: { display:'flex', gap:16, flexWrap:'wrap', marginBottom:16 },
  legendItem: { display:'flex', alignItems:'center', gap:6 },
  legendLabel: { fontSize:11, color:'#8888a8' },
  zoneLabel: { display:'flex', alignItems:'center', gap:12, marginBottom:10, fontSize:11, color:'#55556a', textTransform:'uppercase', letterSpacing:'2px' },
  zoneLine: { flex:1, height:1, background:'#ffffff0f' },
  grid: { display:'grid', gridTemplateColumns:'repeat(10,1fr)', gap:8, marginBottom:8 },
  seat: { aspectRatio:'1', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', transition:'transform 0.15s', position:'relative', userSelect:'none' },
  backdrop: { position:'fixed', inset:0, background:'#00000080', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, backdropFilter:'blur(4px)' },
  modal: { background:'#111118', border:'1px solid #ffffff18', borderRadius:20, padding:28, width:360 },
  modalTitle: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:6 },
  modalSub: { fontSize:14, color:'#8888a8', marginBottom:12 },
  modalDate: { fontSize:13, marginBottom:10 },
  modalNote: { background:'#1a1a24', border:'1px solid #ffffff0f', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#8888a8', marginBottom:18 },
  modalActions: { display:'flex', gap:10 },
cancelBtn: { flex:1, background:'#1a1a24', border:'1px solid #ffffff18', color:'#e8e8f0', borderRadius:10, padding:11, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  confirmBtn: { flex:2, background:'linear-gradient(135deg,#7c6af7,#a78bfa)', color:'white', border:'none', borderRadius:10, padding:11, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
};
