import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getSeatCounts, getCompanyInfo } = useSettings();
  const [tab, setTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [toast, setToast] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const monday = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    return d.toISOString().split('T')[0];
  })();

  // Get dynamic settings
  const seatCounts = getSeatCounts();
  const companyInfo = getCompanyInfo();
  const totalSeats = seatCounts.designated + seatCounts.floater;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    axios.get(`/api/bookings/all?date=${today}`).then(r => setBookings(r.data)).catch(console.error);
    axios.get('/api/seats/holidays').then(r => setHolidays(r.data)).catch(console.error);
    axios.get('/api/seats/users').then(r => setUsers(r.data)).catch(console.error);
    axios.get(`/api/bookings/utilization?weekStart=${monday}`).then(r => setStats(r.data)).catch(console.error);
  }, [today, monday]);

  const addHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) return;
    try {
      await axios.post('/api/seats/holidays', newHoliday);
      const res = await axios.get('/api/seats/holidays');
      setHolidays(res.data);
      setNewHoliday({ date: '', name: '' });
      showToast('Holiday added');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed', 'error');
    }
  };

  const deleteHoliday = async (id) => {
    await axios.delete(`/api/seats/holidays/${id}`);
    setHolidays(h => h.filter(x => x.id !== id));
    showToast('Holiday removed');
  };

  const totalToday = bookings.length;
  const occupied = bookings.filter(b => b.status === 'allocated' || b.status === 'booked').length;

  const handleNavClick = (id) => {
    if (id === 'settings') {
      navigate('/settings');
    } else {
      setTab(id);
    }
  };

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logoWrap}>
          <div style={s.logo}>{companyInfo.name}</div>
          <div style={s.logoSub}>Admin Panel</div>
        </div>
        <nav style={s.nav}>
          {[
            ['overview','📊','Overview'],
            ['bookings','📋',"Today's Bookings"],
            ['holidays','🗓️','Holidays'],
            ['users','👥','Users'],
            ['settings','⚙️','Settings']
          ].map(([id,icon,label]) => (
            <div key={id} style={{...s.navItem,...(tab===id?s.active:{})}} onClick={() => handleNavClick(id)}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </nav>
        <div style={s.footer}>
          <div style={s.av}>A</div>
          <div><div style={s.uname}>{user?.name}</div><div style={s.umeta}>Administrator</div></div>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>↩</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.title}>{tab === 'overview' ? 'Overview' : tab === 'bookings' ? "Today's Bookings" : tab === 'holidays' ? 'Holiday Manager' : 'User Directory'}</div>
          <div style={s.badge}>👑 Admin</div>
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <div style={s.statsGrid}>
              {[
                {label:'Total Seats',val:totalSeats,sub:`${seatCounts.designated} designated + ${seatCounts.floater} floater`,color:'#7c6af7'},
                {label:'Occupied Today',val:occupied,sub:`of ${totalSeats} seats (${Math.round(occupied/totalSeats*100)}%)`,color:'#22c55e'},
                {label:'Available Today',val:totalSeats-occupied,sub:'seats still free',color:'#f59e0b'},
                {label:'Total Employees',val:users.length,sub:'across 10 teams',color:'#a78bfa'},
              ].map((st,i) => (
                <div key={i} style={s.statCard}>
                  <div style={s.statLabel}>{st.label}</div>
                  <div style={{...s.statVal, color:st.color}}>{st.val}</div>
                  <div style={s.statSub}>{st.sub}</div>
                </div>
              ))}
            </div>

            <div style={{...s.card, marginTop:20}}>
              <div style={s.cardTitle}>Weekly Utilization</div>
              <table style={s.table}>
                <thead><tr>
                  {['Date','Designated Occupied','Released','Floater Booked','Total','Utilization'].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {stats.map((r,i) => (
                    <tr key={i} style={s.tr}>
                      <td style={s.td}>{new Date(r.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</td>
                      <td style={s.td}>{r.designatedOccupied}</td>
                      <td style={{...s.td,color:'#f59e0b'}}>{r.released}</td>
                      <td style={{...s.td,color:'#a78bfa'}}>{r.floaterBooked}</td>
                      <td style={{...s.td,fontWeight:600}}>{r.totalOccupied}</td>
                      <td style={s.td}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:6,background:'#1a1a24',borderRadius:3,overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${r.utilizationPercent}%`,background:r.utilizationPercent>80?'#22c55e':r.utilizationPercent>50?'#f59e0b':'#ef4444',borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:12,fontWeight:600,color:'#e8e8f0',width:36}}>{r.utilizationPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stats.length === 0 && <tr><td colSpan={6} style={{...s.td,textAlign:'center',color:'#55556a',padding:32}}>No data for this week</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* BOOKINGS */}
        {tab === 'bookings' && (
          <div style={s.card}>
            <div style={s.cardTitle}>All Bookings — {today}</div>
            <table style={s.table}>
              <thead><tr>
                {['Type','Employee','Team','Batch','Seat','Status'].map(h=><th key={h} style={s.th}>{h}</th>)}
              </tr></thead>
              <tbody>
                {bookings.map((b,i) => (
                  <tr key={i} style={s.tr}>
                    <td style={s.td}><span style={{...s.chip, background:b.type==='allocation'?'#7c6af720':'#f59e0b20',color:b.type==='allocation'?'#a78bfa':'#f59e0b'}}>{b.type}</span></td>
                    <td style={s.td}>{b.name}</td>
                    <td style={s.td}>{b.team_name}</td>
                    <td style={s.td}><span style={{...s.chip,background:'#7c6af715',color:'#a78bfa'}}>B{b.batch}</span></td>
                    <td style={{...s.td,fontWeight:600}}>{b.seat_number}</td>
                    <td style={s.td}><span style={{...s.chip,background:b.status==='released'?'#f59e0b20':'#22c55e20',color:b.status==='released'?'#f59e0b':'#22c55e'}}>{b.status}</span></td>
                  </tr>
                ))}
                {bookings.length === 0 && <tr><td colSpan={6} style={{...s.td,textAlign:'center',color:'#55556a',padding:32}}>No bookings today</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* HOLIDAYS */}
        {tab === 'holidays' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Holiday Manager</div>
            <div style={s.holidayForm}>
              <input style={s.input} type="date" value={newHoliday.date} onChange={e => setNewHoliday(h=>({...h,date:e.target.value}))} />
              <input style={{...s.input,flex:1}} type="text" placeholder="Holiday name (e.g. Diwali)" value={newHoliday.name} onChange={e => setNewHoliday(h=>({...h,name:e.target.value}))} />
              <button style={s.addBtn} onClick={addHoliday}>Add Holiday</button>
            </div>
            <table style={s.table}>
              <thead><tr>{['Date','Holiday','Action'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id} style={s.tr}>
                    <td style={s.td}>{new Date(h.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</td>
                    <td style={{...s.td,fontWeight:500}}>{h.name}</td>
                    <td style={s.td}><button style={s.delBtn} onClick={() => deleteHoliday(h.id)}>Delete</button></td>
                  </tr>
                ))}
                {holidays.length === 0 && <tr><td colSpan={3} style={{...s.td,textAlign:'center',color:'#55556a',padding:32}}>No holidays added yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div style={s.card}>
            <div style={s.cardTitle}>User Directory — {users.length} employees</div>
            <table style={s.table}>
              <thead><tr>{['Name','Email','Team','Batch','Seat','Role'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={s.tr}>
                    <td style={s.td}>{u.name}</td>
                    <td style={{...s.td,color:'#8888a8',fontSize:12}}>{u.email}</td>
                    <td style={s.td}>{u.team_name}</td>
                    <td style={s.td}><span style={{...s.chip,background:'#7c6af715',color:'#a78bfa'}}>B{u.batch}</span></td>
                    <td style={{...s.td,fontWeight:600}}>{u.assigned_seat || '—'}</td>
                    <td style={s.td}><span style={{...s.chip,background:u.role==='admin'?'#f59e0b20':'#22c55e20',color:u.role==='admin'?'#f59e0b':'#22c55e'}}>{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {toast && (
        <div style={{...s.toast,background:toast.type==='error'?'#ef444420':'#22c55e20',borderColor:toast.type==='error'?'#ef444450':'#22c55e50',color:toast.type==='error'?'#ef4444':'#22c55e'}}>
          {toast.type==='error'?'❌':'✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

const s = {
  page:{display:'flex',minHeight:'100vh',background:'#0a0a0f',color:'#e8e8f0',fontFamily:"'DM Sans',sans-serif"},
  sidebar:{width:220,background:'#111118',borderRight:'1px solid #ffffff0f',display:'flex',flexDirection:'column',padding:'24px 0',position:'fixed',height:'100vh'},
  logoWrap:{padding:'0 20px 24px',borderBottom:'1px solid #ffffff0f',marginBottom:16},
  logo:{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,background:'linear-gradient(135deg,#7c6af7,#a78bfa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  logoSub:{fontSize:11,color:'#55556a',letterSpacing:'1px'},
  nav:{display:'flex',flexDirection:'column',gap:2,padding:'0 12px'},
  navItem:{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:8,cursor:'pointer',fontSize:13,color:'#8888a8'},
  active:{background:'#7c6af720',color:'#a78bfa'},
  footer:{marginTop:'auto',padding:'16px 16px 0',borderTop:'1px solid #ffffff0f',display:'flex',alignItems:'center',gap:10},
  av:{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#f59e0b,#fbbf24)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'white'},
  uname:{fontSize:12,fontWeight:500},umeta:{fontSize:11,color:'#55556a'},
  logoutBtn:{marginLeft:'auto',background:'none',border:'1px solid #ffffff0f',color:'#8888a8',borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:14},
  main:{marginLeft:220,flex:1,padding:32},
  topbar:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28},
  title:{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:700},
  badge:{background:'#f59e0b20',border:'1px solid #f59e0b40',color:'#f59e0b',padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:600},
  statsGrid:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14},
  statCard:{background:'#111118',border:'1px solid #ffffff0f',borderRadius:14,padding:'18px 20px'},
  statLabel:{fontSize:11,color:'#55556a',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8},
  statVal:{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:700},
  statSub:{fontSize:11,color:'#55556a',marginTop:4},
  card:{background:'#111118',border:'1px solid #ffffff0f',borderRadius:16,overflow:'hidden'},
  cardTitle:{fontSize:14,fontWeight:600,padding:'20px 20px 16px',borderBottom:'1px solid #ffffff0f'},
  table:{width:'100%',borderCollapse:'collapse'},
  th:{background:'#1a1a24',padding:'10px 16px',textAlign:'left',fontSize:11,color:'#55556a',textTransform:'uppercase',letterSpacing:'1px',fontWeight:500,borderBottom:'1px solid #ffffff0f'},
  td:{padding:'11px 16px',borderBottom:'1px solid #ffffff08',fontSize:13,verticalAlign:'middle'},
  tr:{},
  chip:{fontSize:11,fontWeight:600,padding:'3px 9px',borderRadius:20},
  holidayForm:{display:'flex',gap:10,padding:'16px 20px',borderBottom:'1px solid #ffffff0f',flexWrap:'wrap'},
  input:{background:'#1a1a24',border:'1px solid #ffffff0f',borderRadius:10,padding:'9px 12px',color:'#e8e8f0',fontSize:13,outline:'none',fontFamily:'inherit'},
  addBtn:{background:'linear-gradient(135deg,#7c6af7,#a78bfa)',color:'white',border:'none',borderRadius:10,padding:'9px 18px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'},
  delBtn:{background:'none',border:'1px solid #ef444440',color:'#ef4444',borderRadius:6,padding:'4px 10px',fontSize:11,cursor:'pointer'},
  toast:{position:'fixed',bottom:24,right:24,border:'1px solid',borderRadius:12,padding:'14px 20px',fontSize:13,fontWeight:500,zIndex:1000},
};
