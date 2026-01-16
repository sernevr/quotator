import React, { useState, useMemo, useCallback, createContext, useContext } from 'react'
import { X } from 'lucide-react'
import { Header } from './components/Header'
import { QuoteSelector } from './components/QuoteSelector'
import { ResourceForm } from './components/ResourceForm'
import { QuoteTable } from './components/QuoteTable'
import { ToastProvider, useToast } from './components/Toast'
import { CostChart } from './components/CostChart'
import { EmptyState } from './components/EmptyState'
import { SkeletonTable, SkeletonQuoteList, SkeletonForm } from './components/Skeleton'
import { QuoteSummary } from './components/QuoteSummary'
import { usePricing } from './hooks/usePricing'
import { useQuote } from './hooks/useQuote'
import { useDarkMode } from './hooks/useDarkMode'
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts.jsx'

// Verbosity context for controlling toast detail level
const VerbosityContext = createContext({ verbose: false, setVerbose: () => {} })
export const useVerbosity = () => useContext(VerbosityContext)

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
  const { verbose } = useVerbosity()
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
    bulkDeleteItems,
    importQuote
  } = useQuote()

  const [pricingMode, setPricingMode] = useState('monthly')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [showHelp, setShowHelp] = useState(false)
  const [showCostChart, setShowCostChart] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [importedHashes, setImportedHashes] = useState(new Set())

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
        default:
          return new Date(b.updated_at) - new Date(a.updated_at)
      }
    })
  }, [quotes, searchTerm, sortBy])

  // Calculate summary for current quote
  const summary = useMemo(() => {
    if (!items || items.length === 0) return null

    const totalVCPUs = items.reduce((sum, item) => sum + (item.vcpus || 0), 0)
    const totalRAM = items.reduce((sum, item) => sum + (item.ram_gb || 0), 0)
    const totalDisk = items.reduce((sum, item) => sum + (item.disk_size_gb || 0), 0)

    return { itemCount: items.length, totalVCPUs, totalRAM, totalDisk }
  }, [items])

  // Handlers
  const handleCreateQuote = useCallback(async () => {
    const quote = await createQuote()
    if (quote) {
      toast.success('Quote created')
      if (verbose) toast.info(`Quote ID: ${quote.id}`)
    }
  }, [createQuote, toast, verbose])

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

  const handleAddItem = useCallback(async (itemData, count = 1) => {
    const addedItems = []
    for (let i = 0; i < count; i++) {
      const suffix = count > 1 ? `-${String(i + 1).padStart(2, '0')}` : ''
      const item = await addItem({
        ...itemData,
        code_number: itemData.code_number ? `${itemData.code_number}${suffix}` : '',
        description: itemData.description ? `${itemData.description}${suffix}` :
          `${itemData.flavor_name} - ${itemData.vcpus}vCPU/${itemData.ram_gb}GB${itemData.disk_size_gb ? ` + ${itemData.disk_size_gb}GB ${itemData.disk_type_name}` : ''}`
      })
      if (item) addedItems.push(item)
    }
    if (addedItems.length > 0) {
      toast.success(`${addedItems.length} resource${addedItems.length > 1 ? 's' : ''} added`)
    }
    return addedItems
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
      if (selected) next.add(itemId)
      else next.delete(itemId)
      return next
    })
  }, [])

  const handleSelectAll = useCallback((selected) => {
    setSelectedItems(selected ? new Set(items.map(i => i.id)) : new Set())
  }, [items])

  const handleRefreshPricing = useCallback(async () => {
    await refreshPricing()
    toast.info('Pricing data refreshed')
  }, [refreshPricing, toast])

  // Generate file hash for import deduplication
  const generateHash = async (content) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(content)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const handleExportCSV = useCallback(() => {
    if (!currentQuote || items.length === 0) return

    const headers = ['Hostname', 'Code', 'Instance Type', 'vCPUs', 'RAM (GB)', 'Disk Type', 'Disk (GB)', 'Description', 'Hourly ($)', 'Monthly ($)']
    const rows = items.map(item => [
      item.hostname || '',
      item.code_number || '',
      item.flavor_name,
      item.vcpus,
      item.ram_gb,
      item.disk_type_name || '',
      item.disk_size_gb || '',
      item.description || '',
      item.flavor_price?.toFixed(4) || '0',
      ((item.flavor_price || 0) * 720 + (item.disk_price || 0)).toFixed(2)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentQuote.name.replace(/\s+/g, '_')}_quote.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }, [currentQuote, items, toast])

  const handleImportCSV = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const content = await file.text()
      const hash = await generateHash(content)

      if (importedHashes.has(hash)) {
        toast.warning('This file has already been imported')
        return
      }

      const lines = content.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        toast.error('Invalid CSV file')
        return
      }

      const mergeChoice = currentQuote
        ? confirm('Merge into current quote? Click Cancel to create a new quote.')
        : false

      let targetQuote = currentQuote
      if (!mergeChoice || !currentQuote) {
        const name = prompt('Enter name for new quote:', file.name.replace('.csv', ''))
        if (!name) return
        targetQuote = await createQuote(name)
      }

      // Parse CSV and add items
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
      let imported = 0

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^,]+)/g)?.map(v => v.replace(/"/g, '').trim()) || []
        if (values.length < 4) continue

        const hostname = values[headers.indexOf('hostname')] || ''
        const code = values[headers.indexOf('code')] || ''
        const flavorName = values[headers.indexOf('instance type')] || ''
        const vcpus = parseInt(values[headers.indexOf('vcpus')]) || 0
        const ramGb = parseFloat(values[headers.indexOf('ram (gb)')]) || 0
        const diskType = values[headers.indexOf('disk type')] || ''
        const diskSize = parseInt(values[headers.indexOf('disk (gb)')]) || 0
        const desc = values[headers.indexOf('description')] || ''

        // Find matching flavor
        const flavor = flavors.find(f => f.name === flavorName || (f.vcpus === vcpus && f.ram_gb === ramGb))
        const disk = diskTypes.find(d => d.name === diskType)

        if (flavor) {
          await addItem({
            flavor_id: flavor.id,
            flavor_name: flavor.name,
            vcpus: flavor.vcpus,
            ram_gb: flavor.ram_gb,
            flavor_price: flavor.price_hourly,
            disk_type_id: disk?.id || null,
            disk_type_name: disk?.name || null,
            disk_size_gb: diskSize || null,
            disk_price: disk ? disk.price_per_gb * diskSize : null,
            hostname,
            code_number: code,
            description: desc
          })
          imported++
        }
      }

      setImportedHashes(prev => new Set([...prev, hash]))
      toast.success(`Imported ${imported} resources`)
      if (verbose) toast.info(`File hash: ${hash.substring(0, 8)}...`)
    }
    input.click()
  }, [currentQuote, createQuote, addItem, flavors, diskTypes, importedHashes, toast, verbose])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    { key: 'n', description: 'New quote', action: handleCreateQuote },
    { key: 'd', ctrl: true, description: 'Duplicate quote', action: handleDuplicateQuote },
    { key: 'e', ctrl: true, description: 'Export CSV', action: handleExportCSV },
    { key: 'i', ctrl: true, description: 'Import CSV', action: handleImportCSV },
    { key: 'b', ctrl: true, description: 'Toggle sidebar', action: toggleSidebar },
    { key: 'r', description: 'Toggle resource form', action: () => setShowResourceForm(p => !p) },
    { key: 'a', description: 'Toggle analytics', action: () => setShowCostChart(p => !p) },
    { key: '/', description: 'Focus search', action: () => document.querySelector('.search-input')?.focus() },
    { key: '?', shift: true, description: 'Show shortcuts', action: () => setShowHelp(true) },
    { key: 'Escape', description: 'Close dialogs', action: () => { setShowHelp(false); setShowCostChart(false) } },
  ], [handleCreateQuote, handleDuplicateQuote, handleExportCSV, handleImportCSV, toggleSidebar])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Header
        onRefreshPricing={handleRefreshPricing}
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        onShowHelp={() => setShowHelp(true)}
        onExport={handleExportCSV}
        onImport={handleImportCSV}
        canExport={currentQuote && items.length > 0}
        onToggleAnalytics={() => setShowCostChart(true)}
      />

      <main className="main-content">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
          {!sidebarCollapsed && (
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
          )}
        </aside>

        <section className="content">
          {pricingError && (
            <div className="alert alert-error">{pricingError}</div>
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

              {summary && (
                <QuoteSummary
                  summary={summary}
                  quoteId={currentQuote.id}
                  pricingMode={pricingMode}
                  items={items}
                />
              )}

              <div className="collapsible-section">
                <button
                  className="collapsible-header"
                  onClick={() => setShowResourceForm(!showResourceForm)}
                >
                  <span>{showResourceForm ? '▼' : '▶'} Add Resource</span>
                  <span className="collapsible-hint">Press R to toggle</span>
                </button>
                {showResourceForm && (
                  <ResourceForm
                    flavors={flavors}
                    diskTypes={diskTypes}
                    onAddItem={handleAddItem}
                    pricingMode={pricingMode}
                  />
                )}
              </div>

              <QuoteTable
                items={items}
                quoteName={currentQuote.name}
                quoteId={currentQuote.id}
                onUpdateQuoteName={updateQuoteName}
                onUpdateItem={updateItem}
                onDeleteItem={handleDeleteItem}
                pricingMode={pricingMode}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onBulkDelete={handleBulkDelete}
                flavors={flavors}
                diskTypes={diskTypes}
              />
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>HWC Quote Generator | Data auto-saved | Press ? for shortcuts</p>
      </footer>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>Keyboard Shortcuts</h3>
              <button className="help-modal-close" onClick={() => setShowHelp(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="help-modal-content">
              <KeyboardShortcutsHelp shortcuts={shortcuts} />
            </div>
          </div>
        </div>
      )}

      {showCostChart && (
        <div className="help-modal-overlay" onClick={() => setShowCostChart(false)}>
          <div className="help-modal cost-modal" onClick={e => e.stopPropagation()}>
            <div className="help-modal-header">
              <h3>Cost Analytics</h3>
              <button className="help-modal-close" onClick={() => setShowCostChart(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="help-modal-content">
              <CostChart items={items} pricingMode={pricingMode} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  const [verbose, setVerbose] = useState(() => {
    return localStorage.getItem('quotator-verbose') === 'true'
  })

  const toggleVerbose = useCallback(() => {
    setVerbose(prev => {
      const next = !prev
      localStorage.setItem('quotator-verbose', next)
      return next
    })
  }, [])

  return (
    <VerbosityContext.Provider value={{ verbose, setVerbose, toggleVerbose }}>
      <ToastProvider verbose={verbose}>
        <AppContent />
      </ToastProvider>
    </VerbosityContext.Provider>
  )
}

export default App
