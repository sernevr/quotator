import React from 'react'

export function QuoteSelector({
  quotes,
  currentQuote,
  onSelect,
  onCreate,
  onDelete
}) {
  return (
    <div className="quote-selector">
      <div className="quote-selector-header">
        <h3>Quotes</h3>
        <button className="btn btn-primary btn-sm" onClick={onCreate}>
          + New Quote
        </button>
      </div>

      <div className="quote-list">
        {quotes.length === 0 ? (
          <p className="quote-empty">No quotes yet. Create one to get started.</p>
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
    </div>
  )
}

export default QuoteSelector
