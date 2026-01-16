import React, { useMemo } from 'react'

export function CostChart({ items, pricingMode }) {
  const data = useMemo(() => {
    if (!items || items.length === 0) return null

    const getMultiplier = () => {
      switch (pricingMode) {
        case 'yearly1': return { hours: 720 * 12, discount: 0.6 }
        case 'yearly3': return { hours: 720 * 12 * 3, discount: 0.4 }
        default: return { hours: 720, discount: 1.0 }
      }
    }

    const { hours, discount } = getMultiplier()

    const computeCost = items.reduce((sum, item) => {
      return sum + (item.flavor_price || 0) * hours * discount
    }, 0)

    const storageCost = items.reduce((sum, item) => {
      const diskCost = pricingMode === 'monthly'
        ? (item.disk_price || 0)
        : (item.disk_price || 0) * (hours / 720)
      return sum + diskCost
    }, 0)

    const total = computeCost + storageCost
    if (total === 0) return null

    const computePercent = (computeCost / total) * 100
    const storagePercent = (storageCost / total) * 100

    return {
      compute: { cost: computeCost, percent: computePercent },
      storage: { cost: storageCost, percent: storagePercent },
      total
    }
  }, [items, pricingMode])

  if (!data) {
    return (
      <div className="cost-chart-empty">
        <p>Add resources to see cost breakdown</p>
      </div>
    )
  }

  const computeDeg = (data.compute.percent / 100) * 360

  return (
    <div className="cost-chart">
      <h4>Cost Breakdown</h4>
      <div className="cost-chart-content">
        <div
          className="donut-chart"
          style={{
            background: `conic-gradient(
              var(--huawei-blue) 0deg ${computeDeg}deg,
              var(--huawei-green) ${computeDeg}deg 360deg
            )`
          }}
        >
          <div className="donut-hole">
            <span className="donut-total">${data.total.toFixed(0)}</span>
          </div>
        </div>
        <div className="cost-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--huawei-blue)' }}></span>
            <span className="legend-label">Compute</span>
            <span className="legend-value">${data.compute.cost.toFixed(2)}</span>
            <span className="legend-percent">{data.compute.percent.toFixed(0)}%</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--huawei-green)' }}></span>
            <span className="legend-label">Storage</span>
            <span className="legend-value">${data.storage.cost.toFixed(2)}</span>
            <span className="legend-percent">{data.storage.percent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CostChart
