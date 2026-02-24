import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { getCompanyInfo } = useSettings();
  
  // Get dynamic company info
  const companyInfo = getCompanyInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>{companyInfo.name}</div>
        <div style={styles.subtitle}>{companyInfo.subtitle}</div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@wissen.com"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.hint}>
          <strong>Demo credentials:</strong><br />
          Admin: admin@wissen.com / admin123<br />
          Employee: (see seeded emails) / pass123
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0a0a0f',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    background: '#111118', border: '1px solid #ffffff12',
    borderRadius: 20, padding: '40px 36px', width: 380,
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800,
    background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: 4,
  },
  subtitle: { fontSize: 12, color: '#55556a', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: '#8888a8', fontWeight: 500 },
  input: {
    background: '#1a1a24', border: '1px solid #ffffff0f', borderRadius: 10,
    padding: '11px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit',
  },
  error: {
    background: '#ef444420', border: '1px solid #ef444450',
    color: '#ef4444', borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
  btn: {
    background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
    color: 'white', border: 'none', borderRadius: 10,
    padding: '12px', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 4, fontFamily: 'inherit',
  },
  hint: {
    marginTop: 24, padding: '12px 14px',
    background: '#1a1a24', border: '1px solid #ffffff0f',
    borderRadius: 10, fontSize: 11, color: '#55556a', lineHeight: 1.8,
  },
};
