import React, { useMemo } from 'react'

export function QuoteTable({
  items,
  quoteName,
  onUpdateQuoteName,
  onUpdateItem,
  onDeleteItem,
  pricingMode
}) {
  const getPricingLabel = () => {
    switch (pricingMode) {
      case 'yearly1': return '1-Year Reserved'
      case 'yearly3': return '3-Year Reserved'
      default: return 'Monthly'
    }
  }

  const getMultiplier = () => {
    switch (pricingMode) {
      case 'yearly1': return { hours: 720 * 12, discount: 0.6 }  // 40% discount
      case 'yearly3': return { hours: 720 * 12 * 3, discount: 0.4 }  // 60% discount
      default: return { hours: 720, discount: 1.0 }  // No discount
    }
  }

  const summary = useMemo(() => {
    const { hours, discount } = getMultiplier()

    const totalVCPUs = items.reduce((sum, item) => sum + (item.vcpus || 0), 0)
    const totalRAM = items.reduce((sum, item) => sum + (item.ram_gb || 0), 0)
    const totalDisk = items.reduce((sum, item) => sum + (item.disk_size_gb || 0), 0)
    const totalFlavorCost = items.reduce((sum, item) => sum + (item.flavor_price || 0), 0)
    const totalDiskCost = items.reduce((sum, item) => sum + (item.disk_price || 0), 0)

    // Calculate period cost based on mode
    const periodFlavorCost = totalFlavorCost * hours * discount
    const periodDiskCost = pricingMode === 'monthly' ? totalDiskCost : totalDiskCost * (hours / 720)

    return {
      itemCount: items.length,
      totalVCPUs,
      totalRAM,
      totalDisk,
      hourlyFlavorCost: totalFlavorCost,
      periodFlavorCost,
      periodDiskCost,
      totalPeriodCost: periodFlavorCost + periodDiskCost
    }
  }, [items, pricingMode])

  const calculateItemPeriodCost = (item) => {
    const { hours, discount } = getMultiplier()
    const flavorCost = (item.flavor_price || 0) * hours * discount
    const diskCost = pricingMode === 'monthly'
      ? (item.disk_price || 0)
      : (item.disk_price || 0) * (hours / 720)
    return flavorCost + diskCost
  }

  if (items.length === 0) {
    return (
      <div className="quote-table-empty">
        <p>No resources added yet. Use the form above to add resources.</p>
      </div>
    )
  }

  return (
    <div className="quote-table-container">
      <div className="quote-header">
        <input
          type="text"
          value={quoteName}
          onChange={(e) => onUpdateQuoteName(e.target.value)}
          className="quote-name-input"
          placeholder="Quote name..."
        />
      </div>

      <table className="quote-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Hostname</th>
            <th>Code</th>
            <th>Instance Type</th>
            <th>vCPUs</th>
            <th>RAM (GB)</th>
            <th>Disk Type</th>
            <th>Disk (GB)</th>
            <th>Description</th>
            <th>Hourly ($)</th>
            <th>{getPricingLabel()} ($)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const hourlyTotal = item.flavor_price || 0
            const periodTotal = calculateItemPeriodCost(item)

            return (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={item.hostname || ''}
                    onChange={(e) => onUpdateItem(item.id, { hostname: e.target.value })}
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.code_number || ''}
                    onChange={(e) => onUpdateItem(item.id, { code_number: e.target.value })}
                    className="table-input table-input-sm"
                  />
                </td>
                <td>{item.flavor_name}</td>
                <td className="text-center">{item.vcpus}</td>
                <td className="text-center">{item.ram_gb}</td>
                <td>{item.disk_type_name || '-'}</td>
                <td className="text-center">{item.disk_size_gb || '-'}</td>
                <td>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                    className="table-input"
                  />
                </td>
                <td className="text-right">{hourlyTotal.toFixed(4)}</td>
                <td className="text-right">{periodTotal.toFixed(2)}</td>
                <td>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => onDeleteItem(item.id)}
                    title="Remove resource"
                  >
                    x
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="summary-row">
            <td colSpan="4"><strong>Total ({summary.itemCount} items)</strong></td>
            <td className="text-center"><strong>{summary.totalVCPUs}</strong></td>
            <td className="text-center"><strong>{summary.totalRAM}</strong></td>
            <td></td>
            <td className="text-center"><strong>{summary.totalDisk}</strong></td>
            <td></td>
            <td className="text-right"><strong>{summary.hourlyFlavorCost.toFixed(4)}</strong></td>
            <td className="text-right"><strong>{summary.totalPeriodCost.toFixed(2)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div className="quote-summary">
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
          <span className="summary-value">${summary.totalPeriodCost.toFixed(2)}</span>
          <span className="pricing-label">
            {pricingMode === 'yearly1' && '40% Discount Applied'}
            {pricingMode === 'yearly3' && '60% Discount Applied'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default QuoteTable
