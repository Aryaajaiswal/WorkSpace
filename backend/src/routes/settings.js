const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getAllSettings, getSetting, updateSetting, bulkUpdateSettings } = require('../controllers/settingsController');

// Public - get all settings (for frontend configuration) - no auth required for login page
router.get('/', getAllSettings);

// Public - get single setting - no auth required
router.get('/:key', getSetting);

// Admin - update a single setting
router.put('/:key', requireAuth, requireAdmin, updateSetting);

// Admin - bulk update settings
router.post('/bulk', requireAuth, requireAdmin, bulkUpdateSettings);

module.exports = router;
