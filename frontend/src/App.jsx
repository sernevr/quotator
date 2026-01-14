import React, { useState } from 'react'
import { Header } from './components/Header'
import { QuoteSelector } from './components/QuoteSelector'
import { ResourceForm } from './components/ResourceForm'
import { QuoteTable } from './components/QuoteTable'
import { usePricing } from './hooks/usePricing'
import { useQuote } from './hooks/useQuote'

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

function App() {
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
    deleteQuote
  } = useQuote()

  const [pricingMode, setPricingMode] = useState('monthly')

  const loading = pricingLoading || quoteLoading

  return (
    <div className="app">
      <Header onRefreshPricing={refreshPricing} />

      <main className="main-content">
        <aside className="sidebar">
          <QuoteSelector
            quotes={quotes}
            currentQuote={currentQuote}
            onSelect={selectQuote}
            onCreate={() => createQuote()}
            onDelete={deleteQuote}
          />
        </aside>

        <section className="content">
          {pricingError && (
            <div className="alert alert-error">
              {pricingError}
            </div>
          )}

          {loading && (
            <div className="loading">Loading...</div>
          )}

          {!loading && !currentQuote && (
            <div className="empty-state">
              <h2>Welcome to Quotator</h2>
              <p>Huawei Cloud Pricing Quote Generator for Istanbul Region</p>
              <button className="btn btn-primary btn-lg" onClick={() => createQuote()}>
                Create Your First Quote
              </button>
            </div>
          )}

          {!loading && currentQuote && (
            <>
              <PricingModeSelector
                pricingMode={pricingMode}
                onModeChange={setPricingMode}
              />

              <ResourceForm
                flavors={flavors}
                diskTypes={diskTypes}
                onAddItem={addItem}
                pricingMode={pricingMode}
              />

              <QuoteTable
                items={items}
                quoteName={currentQuote.name}
                onUpdateQuoteName={updateQuoteName}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                pricingMode={pricingMode}
              />
            </>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Quotator - Huawei Cloud Pricing (Istanbul Region) | Data auto-saved</p>
      </footer>
    </div>
  )
}

export default App
