import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import SeatGrid from '../components/SeatGrid';
import WeekCalendar from '../components/WeekCalendar';
import FloaterTimer from '../components/FloaterTimer';

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { getZoneNames, getCompanyInfo } = useSettings();
  const navigate = useNavigate();
  const [monday, setMonday] = useState(getMonday());
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [seats, setSeats] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [schedule, setSchedule] = useState({ allocations: [], bookings: [] });
  const [activeTab, setActiveTab] = useState('seats');
  const [toast, setToast] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSeats = useCallback(async () => {
    setLoadingSeats(true);
    try {
      const res = await axios.get(`/api/seats?date=${selectedDate}`);
      // Handle new response format with metadata
      if (res.data.seats) {
        setSeats(res.data.seats);
        setMetadata(res.data.metadata);
      } else {
        // Legacy format for backwards compatibility
        setSeats(res.data);
      }
    } catch (err) {
      showToast('Failed to load seats', 'error');
    } finally {
      setLoadingSeats(false);
    }
  }, [selectedDate]);

  const loadSchedule = useCallback(async () => {
    try {
      const res = await axios.get(`/api/bookings/my-schedule?weekStart=${formatDate(monday)}`);
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [monday]);

  useEffect(() => { loadSeats(); }, [loadSeats]);
  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const handleRelease = async (allocationId) => {
    try {
      await axios.post('/api/bookings/release', { allocationId });
      showToast('Seat released — now available for others');
      loadSeats();
      loadSchedule();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to release seat', 'error');
    }
  };

  const handleFloaterBook = async (seatId) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = formatDate(tomorrow);
    try {
      await axios.post('/api/bookings/floater', { seatId, date });
      showToast(`Seat booked for ${date}!`);
      loadSeats();
      loadSchedule();
    } catch (err) {
      showToast(err.response?.data?.error || 'Booking failed', 'error');
    }
  };

  const changeWeek = (dir) => {
    const m = new Date(monday);
    m.setDate(m.getDate() + dir * 7);
    setMonday(m);
  };

  const weekLabel = () => {
    const end = new Date(monday);
    end.setDate(end.getDate() + 4);
    return `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  // Get dynamic zone names
  const zoneNames = metadata?.zoneNames || getZoneNames();
  const companyInfo = getCompanyInfo();

  return (
    <div style={s.page}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logoWrap}>
          <div style={s.logoText}>{companyInfo.name}</div>
          <div style={s.logoSub}>{companyInfo.subtitle}</div>
        </div>
        <nav style={s.nav}>
          {[['seats','⬛','Seat Map'],['schedule','📅','My Schedule'],['floater','🎫','Book Floater']].map(([id,icon,label]) => (
            <div key={id} style={{...s.navItem, ...(activeTab===id?s.navActive:{})}} onClick={() => setActiveTab(id)}>
              <span>{icon}</span> {label}
            </div>
          ))}
        </nav>
        <div style={s.sideFooter}>
          <div style={s.avatar}>{user?.name?.charAt(0)}</div>
          <div>
            <div style={s.userName}>{user?.name}</div>
            <div style={s.userMeta}>Batch {user?.batch} · {user?.teamName}</div>
          </div>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>↩</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={s.main}>
        {/* HEADER */}
        <div style={s.topbar}>
          <div>
            <div style={s.pageTitle}>
              {activeTab === 'seats' ? 'Seat Map' : activeTab === 'schedule' ? 'My Schedule' : 'Book Floater Seat'}
            </div>
            <div style={s.pageSub}>{weekLabel()}</div>
          </div>
          <div style={s.weekNav}>
            <button style={s.weekBtn} onClick={() => changeWeek(-1)}>‹</button>
            <span style={s.weekLabel}>
              {Math.ceil((monday - getMonday()) / (7 * 86400000)) % 2 === 0 ? 'Week 1' : 'Week 2'}
            </span>
            <button style={s.weekBtn} onClick={() => changeWeek(1)}>›</button>
          </div>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'seats' && (
          <>
            {/* Day selector */}
            <div style={s.dayRow}>
              {[0,1,2,3,4].map(i => {
                const d = new Date(monday);
                d.setDate(d.getDate() + i);
                const ds = formatDate(d);
                const isSelected = ds === selectedDate;
                return (
                  <div key={i} style={{...s.dayBtn, ...(isSelected ? s.dayBtnActive : {})}} onClick={() => setSelectedDate(ds)}>
                    <div style={s.dayName}>{d.toLocaleDateString('en-IN',{weekday:'short'})}</div>
                    <div style={s.dayDate}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <SeatGrid seats={seats} loading={loadingSeats} userId={user?.id}
              onRelease={handleRelease} onFloaterBook={handleFloaterBook}
              selectedDate={selectedDate} zoneNames={zoneNames} />
          </>
        )}

        {activeTab === 'schedule' && (
          <WeekCalendar monday={monday} schedule={schedule} onRelease={handleRelease} />
        )}

        {activeTab === 'floater' && (
          <FloaterTimer seats={seats.filter(s => s.type === 'floater' && s.status === 'floater_available')}
            onBook={handleFloaterBook} userBatch={user?.batch} isDesignated={user?.isDesignated} />
        )}
      </main>

      {/* TOAST */}
      {toast && (
        <div style={{...s.toast, background: toast.type === 'error' ? '#ef444420' : '#22c55e20',
          borderColor: toast.type === 'error' ? '#ef444450' : '#22c55e50',
          color: toast.type === 'error' ? '#ef4444' : '#22c55e'}}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { display:'flex', minHeight:'100vh', background:'#0a0a0f', color:'#e8e8f0', fontFamily:"'DM Sans', sans-serif" },
  sidebar: { width:220, background:'#111118', borderRight:'1px solid #ffffff0f', display:'flex', flexDirection:'column', padding:'24px 0', position:'fixed', height:'100vh' },
  logoWrap: { padding:'0 20px 24px', borderBottom:'1px solid #ffffff0f', marginBottom:16 },
  logoText: { fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, background:'linear-gradient(135deg,#7c6af7,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  logoSub: { fontSize:11, color:'#55556a', letterSpacing:'1px' },
  nav: { display:'flex', flexDirection:'column', gap:2, padding:'0 12px' },
  navItem: { display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:8, cursor:'pointer', fontSize:13, color:'#8888a8', transition:'all .15s' },
  navActive: { background:'#7c6af720', color:'#a78bfa' },
  sideFooter: { marginTop:'auto', padding:'16px 16px 0', borderTop:'1px solid #ffffff0f', display:'flex', alignItems:'center', gap:10 },
  avatar: { width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#7c6af7,#c084fc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'white', flexShrink:0 },
  userName: { fontSize:12, fontWeight:500 },
  userMeta: { fontSize:11, color:'#55556a' },
  logoutBtn: { marginLeft:'auto', background:'none', border:'1px solid #ffffff0f', color:'#8888a8', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:14 },
  main: { marginLeft:220, flex:1, padding:32 },
  topbar: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 },
  pageTitle: { fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:700 },
  pageSub: { fontSize:12, color:'#55556a', marginTop:2 },
  weekNav: { display:'flex', alignItems:'center', gap:8, background:'#111118', border:'1px solid #ffffff0f', borderRadius:10, padding:6 },
  weekBtn: { background:'none', border:'none', color:'#8888a8', cursor:'pointer', padding:'4px 10px', fontSize:16, borderRadius:6 },
  weekLabel: { fontSize:12, color:'#e8e8f0', fontWeight:500, padding:'0 6px' },
  dayRow: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 },
  dayBtn: { background:'#1a1a24', border:'1px solid #ffffff0f', borderRadius:10, padding:'10px', textAlign:'center', cursor:'pointer', transition:'all .15s' },
  dayBtnActive: { background:'#7c6af720', border:'1px solid #7c6af7' },
  dayName: { fontSize:11, color:'#8888a8', marginBottom:4 },
  dayDate: { fontSize:18, fontWeight:700, fontFamily:"'Syne',sans-serif" },
  toast: { position:'fixed', bottom:24, right:24, border:'1px solid', borderRadius:12, padding:'14px 20px', fontSize:13, fontWeight:500, zIndex:1000, backdropFilter:'blur(10px)' },
};
