import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create axios instance with auth interceptor
const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setSettings(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err.message);
      // Set defaults on error
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.post('/settings/bulk', { settings: newSettings });
      setSettings(res.data);
      return true;
    } catch (err) {
      console.error('Failed to update settings:', err);
      return false;
    }
  };

  const updateSetting = async (key, value) => {
    try {
      await api.put(`/settings/${key}`, { value });
      await fetchSettings();
      return true;
    } catch (err) {
      console.error('Failed to update setting:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSetting = (key, defaultValue = '') => {
    if (!settings) return defaultValue;
    return settings[key] || defaultValue;
  };

  const value = {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateSetting,
    getSetting,
    // Helper getters
    getSeatCounts: () => ({
      designated: parseInt(getSetting('designated_seat_count', '40'), 10),
      floater: parseInt(getSetting('floater_seat_count', '10'), 10)
    }),
    getZoneNames: () => ({
      zoneA: getSetting('zone_a_name', 'Zone A — Designated Seats'),
      zoneB: getSetting('zone_b_name', 'Zone B — Floater Seats')
    }),
    getCompanyInfo: () => ({
      name: getSetting('company_name', 'WorkSpace'),
      subtitle: getSetting('app_subtitle', 'Seat Booking')
    }),
    getFloaterBookingHour: () => parseInt(getSetting('floater_booking_hour', '15'), 10),
    getFloaterTime: () => {
      const hour = parseInt(getSetting('floater_booking_hour', '15'), 10);
      return `${String(hour).padStart(2, '0')}:00`;
    }
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Default settings fallback
function getDefaultSettings() {
  return {
    designated_seat_count: '40',
    floater_seat_count: '10',
    zone_a_name: 'Zone A — Designated Seats',
    zone_b_name: 'Zone B — Floater Seats',
    floater_booking_hour: '15',
    batch1_week1_days: '1,2,3',
    batch1_week2_days: '4,5',
    batch2_week1_days: '4,5',
    batch2_week2_days: '1,2,3',
    company_name: 'WorkSpace',
    app_subtitle: 'Seat Booking'
  };
}
