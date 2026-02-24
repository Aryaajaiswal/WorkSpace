import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';

function getSecondsUntil(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (now >= target) return 0;
  return Math.floor((target - now) / 1000);
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isWeekend(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.getDay() === 0 || d.getDay() === 6;
}

export default function FloaterTimer({ seats, onBook, userBatch, isDesignated }) {
  const { getFloaterTime, getCompanyInfo } = useSettings();
  const floaterTime = getFloaterTime();
  const companyInfo = getCompanyInfo();
  
  const [secondsLeft, setSecondsLeft] = useState(getSecondsUntil(floaterTime));
  const [selectedSeat, setSelectedSeat] = useState('');
  const isOpen = secondsLeft === 0;
  const tomorrowIsWeekend = isWeekend();

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(() => {
      const s = getSecondsUntil(floaterTime);
      setSecondsLeft(s);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, floaterTime]);

  const handleBook = () => {
    if (!selectedSeat) return;
    onBook(parseInt(selectedSeat));
    setSelectedSeat('');
  };

  // Batch 1 users can book floater on their non-batch days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format floater time for display
  const [floaterHour, floaterMin] = floaterTime.split(':');
  const floaterTimeDisplay = `${floaterHour}:${floaterMin}`;

  return (
    <div style={s.page}>
      {/* RULES CARD */}
      <div style={s.rulesCard}>
        <div style={s.rulesTitle}>📋 {companyInfo.name} Floater Booking Rules</div>
        <div style={s.rulesList}>
          {[
            ['🕒','Can only book for tomorrow (next working day)'],
            ['⏰',`Booking window opens at ${floaterTimeDisplay} today`],
            ['🚫','No bookings on weekends or public holidays'],
            ['1️⃣','One floater seat per person per day'],
            ['✅','Released designated seats also appear here'],
          ].map(([icon, rule], i) => (
            <div key={i} style={s.rule}><span>{icon}</span><span>{rule}</span></div>
          ))}
        </div>
      </div>

      {/* TIMER / BOOKING PANEL */}
      <div style={s.mainPanel}>
        {tomorrowIsWeekend ? (
          <div style={s.blockedCard}>
            <div style={{fontSize:48,marginBottom:12}}>🏖️</div>
            <div style={s.blockedTitle}>Tomorrow is a Weekend</div>
            <div style={s.blockedSub}>No office, no bookings. Enjoy your weekend!</div>
          </div>
        ) : !isOpen ? (
          <div style={s.timerCard}>
            <div style={s.timerLabel}>Floater booking opens in</div>
            <div style={s.timerValue}>{formatTime(secondsLeft)}</div>
            <div style={s.timerSub}>Booking for <strong>{getTomorrow()}</strong></div>

            {/* Progress ring - visual only */}
            <div style={s.progressRing}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a24" strokeWidth="8"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (secondsLeft / (7 * 3600))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{transition:'stroke-dashoffset 1s linear'}}
                />
                <text x="60" y="56" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="700" fontFamily="Syne,sans-serif">
                  {Math.floor(secondsLeft / 3600)}h
                </text>
                <text x="60" y="72" textAnchor="middle" fill="#8888a8" fontSize="10">
                  {Math.floor((secondsLeft % 3600) / 60)}m left
                </text>
              </svg>
            </div>
            <div style={s.timerNote}>
              Come back at {floaterTimeDisplay} to book your floater seat
            </div>
          </div>
        ) : (
          <div style={s.bookingCard}>
            <div style={s.openBadge}>🟢 Booking is Open!</div>
            <div style={s.bookingTitle}>Book for {getTomorrow()}</div>

            {seats.length === 0 ? (
              <div style={s.noSeats}>
                <div style={{fontSize:32,marginBottom:8}}>😔</div>
                <div>All floater seats are taken for tomorrow</div>
              </div>
            ) : (
              <>
                <div style={s.seatSelectLabel}>Available floater seats ({seats.length})</div>
                <div style={s.seatButtons}>
                  {seats.map(seat => (
                    <button key={seat.id}
                      style={{
                        ...s.seatBtn,
                        background: selectedSeat == seat.id ? '#7c6af7' : '#1a1a24',
                        border: selectedSeat == seat.id ? '1px solid #7c6af7' : '1px solid #f59e0b40',
                        color: selectedSeat == seat.id ? 'white' : '#f59e0b',
                      }}
                      onClick={() => setSelectedSeat(seat.id)}
                    >
                      {seat.seatNumber}
                    </button>
                  ))}
                </div>
                <button
                  style={{...s.bookBtn, opacity: selectedSeat ? 1 : 0.5}}
                  onClick={handleBook}
                  disabled={!selectedSeat}
                >
                  Confirm Booking → {selectedSeat ? seats.find(s => s.id == selectedSeat)?.seatNumber : ''}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' },
  rulesCard: { background:'#111118', border:'1px solid #ffffff0f', borderRadius:16, padding:24 },
  rulesTitle: { fontSize:14, fontWeight:600, marginBottom:16 },
  rulesList: { display:'flex', flexDirection:'column', gap:10 },
  rule: { display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'#8888a8', lineHeight:1.5 },
  mainPanel: { },
  blockedCard: { background:'#111118', border:'1px solid #ffffff0f', borderRadius:16, padding:40, textAlign:'center' },
  blockedTitle: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:6 },
  blockedSub: { fontSize:13, color:'#8888a8' },
  timerCard: { background:'#111118', border:'1px solid #f59e0b30', borderRadius:16, padding:32, textAlign:'center' },
  timerLabel: { fontSize:12, color:'#8888a8', textTransform:'uppercase', letterSpacing:'2px', marginBottom:12 },
  timerValue: { fontFamily:"'Syne',sans-serif", fontSize:48, fontWeight:800, color:'#f59e0b', letterSpacing:'-2px', marginBottom:8, fontVariantNumeric:'tabular-nums' },
  timerSub: { fontSize:13, color:'#8888a8', marginBottom:24 },
  progressRing: { margin:'0 auto 20px', width:120 },
  timerNote: { fontSize:12, color:'#55556a' },
  bookingCard: { background:'#111118', border:'1px solid #22c55e30', borderRadius:16, padding:28 },
  openBadge: { fontSize:12, color:'#22c55e', fontWeight:600, marginBottom:8 },
  bookingTitle: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:700, marginBottom:20 },
  noSeats: { textAlign:'center', padding:'20px 0', color:'#8888a8', fontSize:14 },
  seatSelectLabel: { fontSize:12, color:'#8888a8', marginBottom:10 },
  seatButtons: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 },
  seatBtn: { borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s', fontFamily:'inherit' },
  bookBtn: { width:'100%', background:'linear-gradient(135deg,#7c6af7,#a78bfa)', color:'white', border:'none', borderRadius:10, padding:'13px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
};
