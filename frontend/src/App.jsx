import React, { useState, useMemo, useCallback } from 'react'
import { Header } from './components/Header'
import { QuoteSelector } from './components/QuoteSelector'
import { ResourceForm } from './components/ResourceForm'
import { QuoteTable } from './components/QuoteTable'
import { ToastProvider, useToast } from './components/Toast'
import { CostChart } from './components/CostChart'
import { EmptyState } from './components/EmptyState'
import { SkeletonTable, SkeletonQuoteList, SkeletonForm } from './components/Skeleton'
import { usePricing } from './hooks/usePricing'
import { useQuote } from './hooks/useQuote'
import { useDarkMode } from './hooks/useDarkMode'
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts.jsx'

function PricingModeSelector({ pricingMode, onModeChange }) {
  return (
    <div className="pricing-mode-selector">
      <button
        className={`pricing-mode-btn ${pricingMode === 'monthly' ? 'active' : ''}`}
        onClick={() => onModeChange('monthly')}
      >
        Monthly
        <span className="discount">Pay as you go</span>
      </button>
      <button
        className={`pricing-mode-btn ${pricingMode === 'yearly1' ? 'active' : ''}`}
        onClick={() => onModeChange('yearly1')}
      >
        1-Year Reserved
        <span className="discount">Save 40%</span>
      </button>
      <button
        className={`pricing-mode-btn ${pricingMode === 'yearly3' ? 'active' : ''}`}
        onClick={() => onModeChange('yearly3')}
      >
        3-Year Reserved
        <span className="discount">Save 60%</span>
      </button>
    </div>
  )
}

function AppContent() {
  const toast = useToast()
  const { isDark, toggle: toggleDarkMode } = useDarkMode()
  const { flavors, diskTypes, loading: pricingLoading, error: pricingError, refreshPricing } = usePricing()
  const {
    quotes,
    currentQuote,
    items,
    loading: quoteLoading,
    createQuote,
    selectQuote,
    updateQuoteName,
    addItem,
    updateItem,
    deleteItem,
    deleteQuote,
    duplicateQuote,
    bulkDeleteItems
  } = useQuote()

  const [pricingMode, setPricingMode] = useState('monthly')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showHelp, setShowHelp] = useState(false)

  const loading = pricingLoading || quoteLoading

  // Filter and sort quotes
  const filteredQuotes = useMemo(() => {
    let filtered = quotes

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(q => q.name.toLowerCase().includes(term))
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default: // updated
          return new Date(b.updated_at) - new Date(a.updated_at)
      }
    })
  }, [quotes, searchTerm, sortBy])

  // Handlers with toast notifications
  const handleCreateQuote = useCallback(async () => {
    const quote = await createQuote()
    if (quote) {
      toast.success('Quote created successfully')
    }
  }, [createQuote, toast])

  const handleDeleteQuote = useCallback(async (id) => {
    await deleteQuote(id)
    toast.success('Quote deleted')
  }, [deleteQuote, toast])

  const handleDuplicateQuote = useCallback(async () => {
    if (!currentQuote) return
    const newQuote = await duplicateQuote(currentQuote.id)
    if (newQuote) {
      toast.success('Quote duplicated')
    }
  }, [currentQuote, duplicateQuote, toast])

  const handleAddItem = useCallback(async (itemData) => {
    const item = await addItem(itemData)
    if (item) {
      toast.success('Resource added')
    }
    return item
  }, [addItem, toast])

  const handleDeleteItem = useCallback(async (itemId) => {
    await deleteItem(itemId)
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }, [deleteItem])

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return
    if (!confirm(`Delete ${selectedItems.size} selected items?`)) return

    await bulkDeleteItems(Array.from(selectedItems))
    setSelectedItems(new Set())
    toast.success(`${selectedItems.size} items deleted`)
  }, [selectedItems, bulkDeleteItems, toast])

  const handleSelectItem = useCallback((itemId, selected) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback((selected) => {
    if (selected) {
      setSelectedItems(new Set(items.map(i => i.id)))
    } else {
      setSelectedItems(new Set())
    }
  }, [items])

  const handleRefreshPricing = useCallback(async () => {
    await refreshPricing()
    toast.info('Pricing data refreshed')
  }, [refreshPricing, toast])

  const handleExportCSV = useCallback(() => {
    if (!currentQuote || items.length === 0) return

    const headers = ['Hostname', 'Code', 'Instance Type', 'vCPUs', 'RAM (GB)', 'Disk Type', 'Disk (GB)', 'Hourly ($)', 'Monthly ($)']
    const rows = items.map(item => [
      item.hostname || '',
      item.code_number || '',
      item.flavor_name,
      item.vcpus,
      item.ram_gb,
      item.disk_type_name || '',
      item.disk_size_gb || '',
      item.flavor_price?.toFixed(4) || '0',
      ((item.flavor_price || 0) * 720 + (item.disk_price || 0)).toFixed(2)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentQuote.name.replace(/\s+/g, '_')}_quote.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }, [currentQuote, items, toast])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'n', description: 'New quote', action: handleCreateQuote },
    { key: 'd', ctrl: true, description: 'Duplicate quote', action: handleDuplicateQuote },
    { key: 'e', ctrl: true, description: 'Export CSV', action: handleExportCSV },
    { key: '/', description: 'Focus search', action: () => document.querySelector('.search-input')?.focus() },
    { key: '?', shift: true, description: 'Show shortcuts', action: () => setShowHelp(true) },
    { key: 'Escape', description: 'Close dialogs', action: () => setShowHelp(false) },
  ], [handleCreateQuote, handleDuplicateQuote, handleExportCSV])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="app">
      <Header
        onRefreshPricing={handleRefreshPricing}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        onShowHelp={() => setShowHelp(true)}
      />

      <main className="main-content">
        <aside className="sidebar">
          <QuoteSelector
            quotes={filteredQuotes}
            currentQuote={currentQuote}
            onSelect={selectQuote}
            onCreate={handleCreateQuote}
            onDelete={handleDeleteQuote}
            onDuplicate={handleDuplicateQuote}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            loading={quoteLoading}
          />
        </aside>

        <section className="content">
          {pricingError && (
            <div className="alert alert-error">
              {pricingError}
            </div>
          )}

          {loading && !currentQuote && (
            <div className="skeleton-loading">
              <SkeletonForm />
              <SkeletonTable rows={4} cols={10} />
            </div>
          )}

          {!loading && !currentQuote && (
            <EmptyState
              type="quotes"
              onAction={handleCreateQuote}
              actionLabel="Create Your First Quote"
            />
          )}

          {currentQuote && (
            <>
              <PricingModeSelector
                pricingMode={pricingMode}
                onModeChange={setPricingMode}
              />

              <CostChart items={items} pricingMode={pricingMode} />

              <ResourceForm
                flavors={flavors}
                diskTypes={diskTypes}
                onAddItem={handleAddItem}
                pricingMode={pricingMode}
              />

              <QuoteTable
                items={items}
                quoteName={currentQuote.name}
                onUpdateQuoteName={updateQuoteName}
                onUpdateItem={updateItem}
                onDeleteItem={handleDeleteItem}
                pricingMode={pricingMode}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onBulkDelete={handleBulkDelete}
                onExportCSV={handleExportCSV}
                onDuplicate={handleDuplicateQuote}
              />
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Quotator - Huawei Cloud Pricing (Istanbul Region) | Data auto-saved | Press ? for shortcuts</p>
      </footer>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="help-modal-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="help-modal-content">
              <KeyboardShortcutsHelp shortcuts={shortcuts} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
