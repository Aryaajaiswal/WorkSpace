# TODO - Dynamic Configuration Features

## Phase 1: Database & Backend
- [x] 1. Add settings table to schema.sql
- [x] 2. Create settings controller (backend/src/controllers/settingsController.js)
- [x] 3. Create settings routes (backend/src/routes/settings.js)
- [x] 4. Register settings routes in app.js
- [x] 5. Update batchUtils.js to use database settings
- [x] 6. Update seatController.js for dynamic seat counts

## Phase 2: Frontend Integration
- [x] 7. Add settings context (frontend/src/context/SettingsContext.jsx)
- [x] 8. Update App.jsx to include SettingsProvider
- [x] 9. Create Settings page (frontend/src/pages/Settings.jsx)
- [x] 10. Update SeatGrid.jsx for dynamic zone names
- [x] 11. Update FloaterTimer.jsx for dynamic time
- [x] 12. Update AdminDashboard.jsx navigation

## Phase 3: Testing
- [x] 13. Test all configurations
