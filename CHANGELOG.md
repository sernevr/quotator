# Changelog

## [1.2.1] - 2026-01-16

### UI Improvements

- **Modern Icon Library**: Replaced all Unicode symbols and emoji icons with Lucide React icons for a consistent, professional appearance
- **Icon Consistency**: All icons now use the same stroke-based design language with appropriate sizing (14-20px)

### Technical Changes

- Added `lucide-react` dependency for modern SVG icons
- Updated components with Lucide icons:
  - `Header.jsx`: Upload, Download, BarChart3, MessageSquare, Sun, Moon, HelpCircle, RefreshCw
  - `QuoteTable.jsx`: Check, X, Pencil, Trash2
  - `ResourceForm.jsx`: RotateCcw
  - `Toast.jsx`: CheckCircle, XCircle, AlertTriangle, Info
  - `SearchFilter.jsx`: Search, X
  - `QuoteSelector.jsx`: Trash2, Copy, Plus
  - `App.jsx`: X (modal close)
- Updated CSS for proper SVG icon alignment in buttons and interactive elements

### Dependencies

- Added: `lucide-react` (modern React icon library)

---

## [1.2.0] - 2026-01-16

### New Features

#### Header Improvements

- **Renamed App Title**: Changed from "Quotator" to "HWC Quote Generator" for clarity
- **Icon-Only Buttons**: Header actions now use compact icon buttons for import, export, analytics, verbosity, dark mode, and help
- **Verbosity Toggle**: New toggle to control toast notification detail level. When enabled, shows additional context like quote IDs and file hashes
- **Import/Export in Header**: Moved CSV import/export buttons to header for better accessibility

#### Layout Improvements

- **Collapsible Sidebar**: Toggle sidebar visibility with button or `Ctrl+B` shortcut. Useful for maximizing content area
- **Collapsible Resource Form**: "Add Resource" section can now be collapsed/expanded. Toggle with `R` shortcut
- **Cost Analytics Modal**: Cost breakdown chart moved to modal popup, accessible via analytics icon or `A` shortcut
- **Summary Cards Above Table**: Resource summary (vCPUs, RAM, Storage, Cost) displayed above the quote table for quick reference

#### Pricing Display Improvements

- **Monthly Payment for Reserved**: For 1-Year and 3-Year reserved instances, now shows monthly payment amount alongside total cost (e.g., "$150.00/mo" with "(1800.00 total)")
- **Table Footer Monthly View**: Summary row displays monthly cost for reserved instances

#### Form Improvements

- **Count Input**: Add multiple identical resources at once with count field (1-100). Codes auto-increment with suffix (-01, -02, etc.)
- **Auto-Increment Code**: When code ends with number (e.g., WS-001), next batch auto-increments (WS-002)
- **Auto-Generate Description**: Description auto-populates from selected specs. Toggle auto-generation with icon button
- **Description Beside Code**: Code and description fields now on same row for compact layout

#### Table Improvements

- **Collapsible Specs Columns**: Toggle vCPUs/RAM/Disk columns visibility with "Show Specs"/"Hide Specs" button
- **Inline Edit**: Edit resource instance type and disk directly in table row. Click edit icon to enter edit mode, check to save, X to cancel
- **Quote UUID Display**: Shows quote ID in greyed-out style below quote name for reference

#### Import Improvements

- **Hash-Based Deduplication**: Imported files are hashed (SHA-256) to prevent duplicate imports in same session
- **Merge or Create**: When importing, choose to merge into current quote or create new quote
- **Import Shortcut**: `Ctrl+I` keyboard shortcut for quick CSV import

### Updated Keyboard Shortcuts

- `N` - Create new quote
- `Ctrl+D` - Duplicate current quote
- `Ctrl+E` - Export to CSV
- `Ctrl+I` - Import CSV (new)
- `Ctrl+B` - Toggle sidebar (new)
- `R` - Toggle resource form (new)
- `A` - Toggle analytics modal (new)
- `/` - Focus search input
- `?` - Show keyboard shortcuts help
- `Esc` - Close dialogs

### Technical Changes

- Added new React component: `QuoteSummary.jsx` for summary cards section
- Added `VerbosityContext` in App.jsx for controlling toast detail level
- Updated `Header.jsx` with icon buttons, verbosity toggle, import/export
- Updated `ResourceForm.jsx` with count input, auto-generate description
- Updated `QuoteTable.jsx` with inline editing, collapsible specs, monthly pricing display
- Extended CSS with ~200 lines for new features (sidebar toggle, collapsible sections, inline edit, etc.)

### Dependencies

No new dependencies added.

---

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
