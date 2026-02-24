const db = require('../config/db');
const { clearSettingsCache } = require('../utils/batchUtils');

// Get all settings
async function getAllSettings(req, res) {
  try {
    const result = await db.query('SELECT * FROM system_settings ORDER BY key');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    console.error('getAllSettings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Get a single setting
async function getSetting(req, res) {
  const { key } = req.params;
  try {
    const result = await db.query('SELECT * FROM system_settings WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('getSetting error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Update a setting
async function updateSetting(req, res) {
  const { key } = req.params;
  const { value } = req.body;
  
  if (!value) return res.status(400).json({ error: 'Value is required.' });

  try {
    // Use UPSERT pattern - insert or update
    await db.query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
    
    // Clear cache so new settings take effect immediately
    clearSettingsCache();
    
    const result = await db.query('SELECT * FROM system_settings WHERE key = $1', [key]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateSetting error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

// Bulk update settings
async function bulkUpdateSettings(req, res) {
  const { settings } = req.body;
  
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required.' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      // Use UPSERT pattern - insert or update
      await db.query(
        `INSERT INTO system_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    
    // Clear cache so new settings take effect immediately
    clearSettingsCache();
    
    // Fetch all updated settings
    const result = await db.query('SELECT * FROM system_settings ORDER BY key');
    const allSettings = {};
    result.rows.forEach(row => {
      allSettings[row.key] = row.value;
    });
    
    res.json(allSettings);
  } catch (err) {
    console.error('bulkUpdateSettings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
}

module.exports = {
  getAllSettings,
  getSetting,
  updateSetting,
  bulkUpdateSettings
};
