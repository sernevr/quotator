# Changelog

## [1.1.0] - 2026-01-16

### New Features

#### UI/Design Improvements

- **Dark Mode Toggle**: Added system-aware dark mode with manual toggle. Persists user preference to localStorage. Toggle available in header with sun/moon icons.

- **Toast Notifications**: Replaced inline alerts with non-blocking toast notifications for success, error, warning, and info messages. Auto-dismiss after 3 seconds with click-to-dismiss support.

- **Cost Breakdown Chart**: Added donut chart visualization showing compute vs storage cost distribution. Updates dynamically based on selected pricing mode (Monthly/1-Year/3-Year).

- **Skeleton Loading States**: Implemented shimmer-effect skeleton screens for tables, quote lists, and forms to improve perceived loading performance.

- **Improved Empty States**: Added contextual SVG illustrations and clear call-to-action buttons for empty quotes list, empty items, and no search results.

#### UX Improvements

- **Quote Duplication**: One-click duplication of quotes including all items. Accessible via sidebar "Duplicate" button or Ctrl+D keyboard shortcut.

- **Export to CSV**: Export quote data as CSV file for sharing or external analysis. Available via "Export" dropdown in table header or Ctrl+E shortcut.

- **Search & Filter**: Real-time search filtering for quotes by name. Sort options include: Recently Updated, Recently Created, Name (A-Z), Name (Z-A).

- **Bulk Operations**: Checkbox selection for multiple quote items with bulk delete capability. Select all/none with header checkbox.

- **Keyboard Shortcuts**:
  - `N` - Create new quote
  - `Ctrl+D` - Duplicate current quote
  - `Ctrl+E` - Export to CSV
  - `/` - Focus search input
  - `?` - Show keyboard shortcuts help
  - `Esc` - Close dialogs

#### API Improvements

- **Pagination Support**: New `/quotes/paginated` endpoint with query parameters:
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 100, max: 100)
  - `sort_by` - Sort field: name, created_at, updated_at
  - `sort_order` - Sort direction: asc, desc
  - `search` - Search term for filtering by name

- **Standardized Error Responses**: Consistent error format with `error`, `code`, and optional `details` fields.

### Technical Changes

- Renamed `useKeyboardShortcuts.js` to `useKeyboardShortcuts.jsx` for JSX support
- Added new React components:
  - `Toast.jsx` - Toast notification system with context provider
  - `CostChart.jsx` - Donut chart for cost visualization
  - `Skeleton.jsx` - Loading skeleton components
  - `EmptyState.jsx` - Empty state illustrations
  - `SearchFilter.jsx` - Search and filter components
- Added new React hooks:
  - `useDarkMode.js` - Dark mode state management
  - `useKeyboardShortcuts.jsx` - Keyboard shortcut handling
- Updated `useQuote.js` with `duplicateQuote` and `bulkDeleteItems` functions
- Extended CSS with 600+ lines of new styles for all features
- Updated Rust API models with `PaginationQuery`, `PaginatedResponse`, and `ApiError` structs
- Added `get_quotes_paginated` database method with SQL injection protection

### Bug Fixes

- Fixed quote header layout to properly display export actions
- Added `selected-row` styling for bulk selection visibility

### Dependencies

No new dependencies added. All features implemented using existing React, Rust/Actix-web, and CSS capabilities.

---

## [1.0.0] - 2026-01-16

### Initial Release

- Huawei Cloud pricing quote generator for Istanbul region
- ECS instance selection with 24 flavors across s6/s7/c6/m6 series
- EVS disk type selection with 5 storage options
- Best Match Finder for CPU/RAM-based instance discovery
- Three pricing modes: Monthly, 1-Year Reserved (40% off), 3-Year Reserved (60% off)
- Auto-save with debouncing and local cache
- Docker Compose deployment with frontend, API, and crawler services
