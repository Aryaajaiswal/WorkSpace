import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { settings, loading: settingsLoading, updateSettings, getSetting } = useSettings();
  const [activeTab, setActiveTab] = useState('seats');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    // Seat settings
    designated_seat_count: '40',
    floater_seat_count: '10',
    zone_a_name: 'Zone A — Designated Seats',
    zone_b_name: 'Zone B — Floater Seats',
    // Floater settings
    floater_booking_hour: '15',
    // Batch settings
    batch1_week1_days: '1,2,3',
    batch1_week2_days: '4,5',
    batch2_week1_days: '4,5',
    batch2_week2_days: '1,2,3',
    // Company settings
    company_name: 'WorkSpace',
    app_subtitle: 'Seat Booking'
  });

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setFormData({
        designated_seat_count: settings.designated_seat_count || '40',
        floater_seat_count: settings.floater_seat_count || '10',
        zone_a_name: settings.zone_a_name || 'Zone A — Designated Seats',
        zone_b_name: settings.zone_b_name || 'Zone B — Floater Seats',
        floater_booking_hour: settings.floater_booking_hour || '15',
        batch1_week1_days: settings.batch1_week1_days || '1,2,3',
        batch1_week2_days: settings.batch1_week2_days || '4,5',
        batch2_week1_days: settings.batch2_week1_days || '4,5',
        batch2_week2_days: settings.batch2_week2_days || '1,2,3',
        company_name: settings.company_name || 'WorkSpace',
        app_subtitle: settings.app_subtitle || 'Seat Booking'
      });
    }
  }, [settings]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        showToast('Settings saved successfully!');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const dayOptions = [
    { value: '1', label: 'Mon' },
    { value: '2', label: 'Tue' },
    { value: '3', label: 'Wed' },
    { value: '4', label: 'Thu' },
    { value: '5', label: 'Fri' }
  ];

  const renderDaySelector = (name, label) => {
    const currentDays = formData[name].split(',').map(d => d.trim());
    return (
      <div style={s.field}>
        <label style={s.label}>{label}</label>
        <div style={s.daySelector}>
          {dayOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              style={{
                ...s.dayBtn,
                ...(currentDays.includes(opt.value) ? s.dayBtnActive : {})
              }}
              onClick={() => {
                const newDays = currentDays.includes(opt.value)
                  ? currentDays.filter(d => d !== opt.value)
                  : [...currentDays, opt.value].sort();
                setFormData(prev => ({ ...prev, [name]: newDays.join(',') }));
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input type="hidden" name={name} value={formData[name]} />
      </div>
    );
  };

  if (settingsLoading) {
    return <div style={s.loading}>Loading settings...</div>;
  }

  return (
    <div style={s.page}>
      <aside style={s.sidebar}>
        <div style={s.logoWrap}>
          <div style={s.logo}>WorkSpace</div>
          <div style={s.logoSub}>Admin Panel</div>
        </div>
        <nav style={s.nav}>
          {[
            ['seats', '💺', 'Seat Config'],
            ['floater', '🎫', 'Floater Settings'],
            ['batch', '📅', 'Batch Schedule'],
            ['company', '🏢', 'Company Info']
          ].map(([id, icon, label]) => (
            <div
              key={id}
              style={{ ...s.navItem, ...(activeTab === id ? s.active : {}) }}
              onClick={() => setActiveTab(id)}
            >
              <span>{icon}</span>{label}
            </div>
          ))}
        </nav>
        <div style={s.footer}>
          <div style={s.av}>A</div>
          <div>
            <div style={s.uname}>{user?.name}</div>
            <div style={s.umeta}>Administrator</div>
          </div>
          <button style={s.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>↩</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <div style={s.title}>System Settings</div>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* SEAT CONFIGURATION */}
        {activeTab === 'seats' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Seat Configuration</div>
            <div style={s.grid}>
              <div style={s.field}>
                <label style={s.label}>Designated Seat Count</label>
                <input
                  style={s.input}
                  type="number"
                  name="designated_seat_count"
                  value={formData.designated_seat_count}
                  onChange={handleChange}
                  min="1"
                />
                <div style={s.hint}>Number of permanent designated seats (Zone A)</div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Floater Seat Count</label>
                <input
                  style={s.input}
                  type="number"
                  name="floater_seat_count"
                  value={formData.floater_seat_count}
                  onChange={handleChange}
                  min="1"
                />
                <div style={s.hint}>Number of floater seats available for booking (Zone B)</div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Zone A Display Name</label>
                <input
                  style={s.input}
                  type="text"
                  name="zone_a_name"
                  value={formData.zone_a_name}
                  onChange={handleChange}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>Zone B Display Name</label>
                <input
                  style={s.input}
                  type="text"
                  name="zone_b_name"
                  value={formData.zone_b_name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {/* FLOATER SETTINGS */}
        {activeTab === 'floater' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Floater Booking Settings</div>
            <div style={s.field}>
              <label style={s.label}>Booking Opens At (Hour)</label>
              <select
                style={s.select}
                name="floater_booking_hour"
                value={formData.floater_booking_hour}
                onChange={handleChange}
              >
                {Array.from({ length: 12 }, (_, i) => i + 8).map(hour => (
                  <option key={hour} value={hour.toString()}>
                    {hour}:00 {hour < 12 ? 'AM' : 'PM'}
                  </option>
                ))}
              </select>
              <div style={s.hint}>Time when floater seats become available for booking (for next day)</div>
            </div>
          </div>
        )}

        {/* BATCH SCHEDULE */}
        {activeTab === 'batch' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Batch Schedule Configuration</div>
            <p style={s.info}>Configure which days each batch works during each week.</p>
            
            <div style={s.batchSection}>
              <h4 style={s.batchTitle}>Batch 1</h4>
              <div style={s.grid}>
                {renderDaySelector('batch1_week1_days', 'Week 1 Days')}
                {renderDaySelector('batch1_week2_days', 'Week 2 Days')}
              </div>
            </div>
            
            <div style={s.batchSection}>
              <h4 style={s.batchTitle}>Batch 2</h4>
              <div style={s.grid}>
                {renderDaySelector('batch2_week1_days', 'Week 1 Days')}
                {renderDaySelector('batch2_week2_days', 'Week 2 Days')}
              </div>
            </div>
          </div>
        )}

        {/* COMPANY INFO */}
        {activeTab === 'company' && (
          <div style={s.card}>
            <div style={s.cardTitle}>Company Information</div>
            <div style={s.grid}>
              <div style={s.field}>
                <label style={s.label}>Company Name</label>
                <input
                  style={s.input}
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>App Subtitle</label>
                <input
                  style={s.input}
                  type="text"
                  name="app_subtitle"
                  value={formData.app_subtitle}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {toast && (
        <div style={{
          ...s.toast,
          background: toast.type === 'error' ? '#ef444420' : '#22c55e20',
          borderColor: toast.type === 'error' ? '#ef444450' : '#22c55e50',
          color: toast.type === 'error' ? '#ef4444' : '#22c55e'
        }}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}

const s = {
  loading: { textAlign: 'center', padding: 40, color: '#8888a8' },
  page: { display: 'flex', minHeight: '100vh', background: '#0a0a0f', color: '#e8e8f0', fontFamily: "'DM Sans',sans-serif" },
  sidebar: { width: 220, background: '#111118', borderRight: '1px solid #ffffff0f', display: 'flex', flexDirection: 'column', padding: '24px 0', position: 'fixed', height: '100vh' },
  logoWrap: { padding: '0 20px 24px', borderBottom: '1px solid #ffffff0f', marginBottom: 16 },
  logo: { fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  logoSub: { fontSize: 11, color: '#55556a', letterSpacing: '1px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#8888a8', transition: 'all .15s' },
  active: { background: '#7c6af720', color: '#a78bfa' },
  footer: { marginTop: 'auto', padding: '16px 16px 0', borderTop: '1px solid #ffffff0f', display: 'flex', alignItems: 'center', gap: 10 },
  av: { width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f59e0b,#fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' },
  uname: { fontSize: 12, fontWeight: 500 },
  umeta: { fontSize: 11, color: '#55556a' },
  logoutBtn: { marginLeft: 'auto', background: 'none', border: '1px solid #ffffff0f', color: '#8888a8', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14 },
  main: { marginLeft: 220, flex: 1, padding: 32 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  title: { fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700 },
  saveBtn: { background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: '#111118', border: '1px solid #ffffff0f', borderRadius: 16, overflow: 'hidden' },
  cardTitle: { fontSize: 14, fontWeight: 600, padding: '20px 20px 16px', borderBottom: '1px solid #ffffff0f' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, padding: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 500, color: '#8888a8' },
  input: { background: '#1a1a24', border: '1px solid #ffffff0f', borderRadius: 10, padding: '12px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit' },
  select: { background: '#1a1a24', border: '1px solid #ffffff0f', borderRadius: 10, padding: '12px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  hint: { fontSize: 11, color: '#55556a', marginTop: 4 },
  daySelector: { display: 'flex', gap: 6 },
  dayBtn: { flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid #ffffff0f', background: '#1a1a24', color: '#8888a8', fontSize: 11, fontWeight: 500, cursor: 'pointer', transition: 'all .15s' },
  dayBtnActive: { background: '#7c6af720', border: '1px solid #7c6af7', color: '#a78bfa' },
  batchSection: { padding: '20px', borderBottom: '1px solid #ffffff0f' },
  batchTitle: { fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 16 },
  info: { padding: '0 20px', fontSize: 13, color: '#8888a8', marginBottom: 20 },
  toast: { position: 'fixed', bottom: 24, right: 24, border: '1px solid', borderRadius: 12, padding: '14px 20px', fontSize: 13, fontWeight: 500, zIndex: 1000 },
};
