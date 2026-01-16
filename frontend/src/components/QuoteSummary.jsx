import React, { useMemo } from 'react'

export function QuoteSummary({ summary, quoteId, pricingMode, items }) {
  const calculations = useMemo(() => {
    if (!items || items.length === 0) return null

    const getMultiplier = () => {
      switch (pricingMode) {
        case 'yearly1': return { hours: 720 * 12, discount: 0.6, months: 12 }
        case 'yearly3': return { hours: 720 * 12 * 3, discount: 0.4, months: 36 }
        default: return { hours: 720, discount: 1.0, months: 1 }
      }
    }

    const { hours, discount, months } = getMultiplier()
    const totalFlavorCost = items.reduce((sum, item) => sum + (item.flavor_price || 0), 0)
    const totalDiskCost = items.reduce((sum, item) => sum + (item.disk_price || 0), 0)

    const periodFlavorCost = totalFlavorCost * hours * discount
    const periodDiskCost = pricingMode === 'monthly' ? totalDiskCost : totalDiskCost * (hours / 720)
    const totalPeriodCost = periodFlavorCost + periodDiskCost
    const monthlyPayment = months > 1 ? totalPeriodCost / months : null

    return { totalPeriodCost, monthlyPayment, months }
  }, [items, pricingMode])

  const getPricingLabel = () => {
    switch (pricingMode) {
      case 'yearly1': return '1-Year Reserved'
      case 'yearly3': return '3-Year Reserved'
      default: return 'Monthly'
    }
  }

  if (!summary) return null

  return (
    <div className="quote-summary-section">
      <div className="quote-summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Resources</span>
          <span className="summary-value">{summary.itemCount}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total vCPUs</span>
          <span className="summary-value">{summary.totalVCPUs}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total RAM</span>
          <span className="summary-value">{summary.totalRAM} GB</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Storage</span>
          <span className="summary-value">{summary.totalDisk} GB</span>
        </div>
        <div className="summary-card highlight">
          <span className="summary-label">Est. {getPricingLabel()} Cost</span>
          <span className="summary-value">${calculations?.totalPeriodCost?.toFixed(2) || '0.00'}</span>
          {calculations?.monthlyPayment && (
            <span className="monthly-payment">
              ${calculations.monthlyPayment.toFixed(2)}/mo
            </span>
          )}
          <span className="pricing-label">
            {pricingMode === 'yearly1' && '40% Discount Applied'}
            {pricingMode === 'yearly3' && '60% Discount Applied'}
          </span>
        </div>
      </div>
      {quoteId && (
        <div className="quote-uuid">
          Quote ID: {quoteId}
        </div>
      )}
    </div>
  )
}

export default QuoteSummary
