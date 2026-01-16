import React from 'react'
import { QuoteFilter } from './SearchFilter'
import { SkeletonQuoteList } from './Skeleton'

export function QuoteSelector({
  quotes,
  currentQuote,
  onSelect,
  onCreate,
  onDelete,
  onDuplicate,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  loading
}) {
  return (
    <div className="quote-selector">
      <div className="quote-selector-header">
        <h3>Quotes</h3>
        <button className="btn btn-primary btn-sm" onClick={onCreate}>
          + New
        </button>
      </div>

      <QuoteFilter
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />

      <div className="quote-list">
        {loading ? (
          <SkeletonQuoteList count={4} />
        ) : quotes.length === 0 ? (
          <p className="quote-empty">
            {searchTerm ? 'No quotes match your search.' : 'No quotes yet. Create one to get started.'}
          </p>
        ) : (
          quotes.map(quote => (
            <div
              key={quote.id}
              className={`quote-item ${currentQuote?.id === quote.id ? 'active' : ''}`}
              onClick={() => onSelect(quote.id)}
            >
              <span className="quote-item-name">{quote.name}</span>
              <button
                className="btn-icon btn-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this quote?')) {
                    onDelete(quote.id)
                  }
                }}
                title="Delete quote"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {currentQuote && (
        <div className="quote-actions">
          <button
            className="quote-action-btn"
            onClick={onDuplicate}
            title="Duplicate this quote"
          >
            ⎘ Duplicate
          </button>
        </div>
      )}
    </div>
  )
}

export default QuoteSelector
