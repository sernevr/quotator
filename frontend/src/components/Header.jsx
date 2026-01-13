import React from 'react'

export function Header({ onRefreshPricing }) {
  return (
    <header className="header">
      <div className="header-brand">
        <h1>Quotator</h1>
        <span className="header-subtitle">Huawei Cloud Pricing Quote Generator</span>
      </div>
      <div className="header-actions">
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
