import React from 'react'
import { Upload, Download, BarChart3, MessageSquare, Sun, Moon, HelpCircle, RefreshCw } from 'lucide-react'
import { useVerbosity } from '../App'

export function Header({
  onRefreshPricing,
  isDark,
  onToggleDarkMode,
  onShowHelp,
  onExport,
  onImport,
  canExport,
  onToggleAnalytics
}) {
  const { verbose, toggleVerbose } = useVerbosity()

  return (
    <header className="header">
      <div className="header-brand">
        <h1>HWC Quote Generator</h1>
      </div>
      <div className="header-actions">
        <button
          className="header-btn icon-btn"
          onClick={onImport}
          title="Import CSV (Ctrl+I)"
        >
          <Upload size={18} />
        </button>
        <button
          className="header-btn icon-btn"
          onClick={onExport}
          disabled={!canExport}
          title="Export CSV (Ctrl+E)"
        >
          <Download size={18} />
        </button>
        <div className="header-separator" />
        <button
          className="header-btn icon-btn"
          onClick={onToggleAnalytics}
          title="Cost Analytics (A)"
        >
          <BarChart3 size={18} />
        </button>
        <button
          className={`header-btn icon-btn ${verbose ? 'active' : ''}`}
          onClick={toggleVerbose}
          title={verbose ? 'Verbose notifications ON' : 'Verbose notifications OFF'}
        >
          <MessageSquare size={18} />
        </button>
        <button
          className="header-btn icon-btn"
          onClick={onToggleDarkMode}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="header-separator" />
        <button
          className="header-btn icon-btn"
          onClick={onShowHelp}
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle size={18} />
        </button>
        <button
          className="header-btn"
          onClick={onRefreshPricing}
          title="Refresh pricing data from Huawei Cloud"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  )
}

export default Header
