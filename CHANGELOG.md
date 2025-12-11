# Changelog & System Status

## v1.1.0 - Date Dial & Retro UI Overhaul
**Date:** 2025-12-07

### 🚀 New Features
- **Enhanced Date Dial**:
    - **Smart Navigation**: Added Day, Week, and Month view modes.
    - **Repair Status**: Added "Repair" job count to the status reader.
    - **Smooth Animation**: Implemented pixel-perfect, physics-based scrolling for Month transitions with Quintic easing.
    - **Retro Styling**: "Radio Red" indicator and plastic lens effect for 90s nostalgia.
- **Unified Build**: Single-file HTML distribution (`dist/index.html`) via `vite-plugin-singlefile`.

### 📦 Modules & Components Working
- **Core**:
    - `App.tsx`: Main application shell.
    - `AppContext.tsx`: Global state management (Jobs, Settings, Logs).
- **Views**:
    - `JobsTable.tsx`: Main job management grid with filtering, sorting, and status updates.
    - `PropertiesView.tsx`: Property management with modal editing.
    - `SettingsView.tsx`: Application configuration (Pricing, Data Management).
    - `Dashboard.tsx`: High-level metrics and charts.
- **Components**:
    - `DateHeader.tsx`: The new retro date dial with physics-based scrolling.
    - `Sidebar.tsx`: Navigation and file import (CSV/JSON).
    - `StatusBoard.tsx`: Quick status overview (Active, Pending, Completed).
    - `JobEditModal.tsx`: Detailed job editing and "Manage Extras".
    - `InvoiceStagingModal.tsx`: Invoice generation workflow.
    - `ContactsPortals.tsx`: Contact management integration.

---

## v1.0.0 - Initial Release
**Date:** 2025-12-01
- **Core Features**:
    - Basic Job Management (CRUD).
    - Import/Export functionality (CSV/JSON).
    - Local Storage persistence.
    - "Blank Screen" crash fix (System Logs integration).
