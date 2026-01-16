import React from 'react'

export function Header({ onRefreshPricing, isDark, onToggleDarkMode, onShowHelp }) {
  return (
    <header className="header">
      <div className="header-brand">
        <h1>Quotator</h1>
        <span className="header-subtitle">Huawei Cloud Pricing Quote Generator</span>
      </div>
      <div className="header-actions">
        <button
          className="theme-toggle"
          onClick={onToggleDarkMode}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-toggle-icon">{isDark ? '☀' : '☾'}</span>
          {isDark ? 'Light' : 'Dark'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onShowHelp}
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
        <button
          className="btn btn-secondary"
          onClick={onRefreshPricing}
          title="Refresh pricing data from Huawei Cloud"
        >
          ↻ Refresh Pricing
        </button>
      </div>
    </header>
  )
}

export default Header
