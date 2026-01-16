import React, { useMemo, useState } from 'react'
import { EmptyState } from './EmptyState'

export function QuoteTable({
  items,
  quoteName,
  quoteId,
  onUpdateQuoteName,
  onUpdateItem,
  onDeleteItem,
  pricingMode,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  onBulkDelete,
  flavors,
  diskTypes
}) {
  const [showSpecs, setShowSpecs] = useState(true)
  const [editingRow, setEditingRow] = useState(null)
  const [editData, setEditData] = useState({})

  const getPricingLabel = () => {
    switch (pricingMode) {
      case 'yearly1': return '1-Year Reserved'
      case 'yearly3': return '3-Year Reserved'
      default: return 'Monthly'
    }
  }

  const getMultiplier = () => {
    switch (pricingMode) {
      case 'yearly1': return { hours: 720 * 12, discount: 0.6, months: 12 }
      case 'yearly3': return { hours: 720 * 12 * 3, discount: 0.4, months: 36 }
      default: return { hours: 720, discount: 1.0, months: 1 }
    }
  }

  const startEdit = (item) => {
    setEditingRow(item.id)
    setEditData({
      flavor_id: item.flavor_id,
      disk_type_id: item.disk_type_id || '',
      disk_size_gb: item.disk_size_gb || 100
    })
  }

  const saveEdit = (itemId) => {
    const flavor = flavors?.find(f => f.id === editData.flavor_id)
    const disk = diskTypes?.find(d => d.id === editData.disk_type_id)

    if (flavor) {
      onUpdateItem(itemId, {
        flavor_id: editData.flavor_id,
        flavor_name: flavor.name,
        vcpus: flavor.vcpus,
        ram_gb: flavor.ram_gb,
        flavor_price: flavor.price_hourly,
        disk_type_id: editData.disk_type_id || null,
        disk_type_name: disk?.name || null,
        disk_size_gb: editData.disk_type_id ? editData.disk_size_gb : null,
        disk_price: disk ? disk.price_per_gb * editData.disk_size_gb : null
      })
    }
    setEditingRow(null)
    setEditData({})
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  const summary = useMemo(() => {
    const { hours, discount } = getMultiplier()

    const totalVCPUs = items.reduce((sum, item) => sum + (item.vcpus || 0), 0)
    const totalRAM = items.reduce((sum, item) => sum + (item.ram_gb || 0), 0)
    const totalDisk = items.reduce((sum, item) => sum + (item.disk_size_gb || 0), 0)
    const totalFlavorCost = items.reduce((sum, item) => sum + (item.flavor_price || 0), 0)
    const totalDiskCost = items.reduce((sum, item) => sum + (item.disk_price || 0), 0)

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

  const allSelected = items.length > 0 && selectedItems.size === items.length
  const someSelected = selectedItems.size > 0 && selectedItems.size < items.length

  const { months } = getMultiplier()

  if (items.length === 0) {
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
          {quoteId && <span className="quote-uuid">{quoteId}</span>}
        </div>
        <EmptyState type="items" />
      </div>
    )
  }

  return (
    <div className="quote-table-container">
      <div className="quote-header">
        <div className="quote-header-main">
          <input
            type="text"
            value={quoteName}
            onChange={(e) => onUpdateQuoteName(e.target.value)}
            className="quote-name-input"
            placeholder="Quote name..."
          />
          {quoteId && <span className="quote-uuid">{quoteId}</span>}
        </div>
        <div className="quote-header-actions">
          <button
            className={`btn btn-sm ${showSpecs ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowSpecs(!showSpecs)}
            title="Toggle specs column"
          >
            {showSpecs ? 'Hide Specs' : 'Show Specs'}
          </button>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="bulk-actions">
          <span className="bulk-count">{selectedItems.size} selected</span>
          <button className="bulk-btn bulk-btn-danger" onClick={onBulkDelete}>
            Delete Selected
          </button>
          <button className="bulk-btn" onClick={() => onSelectAll(false)}>
            Clear Selection
          </button>
        </div>
      )}

      <table className="quote-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                className="bulk-checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            <th>#</th>
            <th>Hostname</th>
            <th>Code</th>
            <th>Instance Type</th>
            {showSpecs && (
              <>
                <th>vCPUs</th>
                <th>RAM (GB)</th>
                <th>Disk Type</th>
                <th>Disk (GB)</th>
              </>
            )}
            <th>Description</th>
            <th>Hourly ($)</th>
            <th>
              {getPricingLabel()} ($)
              {months > 1 && <span className="th-subtext">/mo</span>}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const hourlyTotal = item.flavor_price || 0
            const periodTotal = calculateItemPeriodCost(item)
            const monthlyPayment = months > 1 ? periodTotal / months : periodTotal
            const isSelected = selectedItems.has(item.id)
            const isEditing = editingRow === item.id

            return (
              <tr key={item.id} className={`${isSelected ? 'selected-row' : ''} ${isEditing ? 'editing-row' : ''}`}>
                <td>
                  <input
                    type="checkbox"
                    className="bulk-checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectItem(item.id, e.target.checked)}
                  />
                </td>
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
                <td>
                  {isEditing ? (
                    <select
                      value={editData.flavor_id}
                      onChange={(e) => setEditData({ ...editData, flavor_id: e.target.value })}
                      className="table-select"
                    >
                      {flavors?.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  ) : item.flavor_name}
                </td>
                {showSpecs && (
                  <>
                    <td className="text-center">{item.vcpus}</td>
                    <td className="text-center">{item.ram_gb}</td>
                    <td>
                      {isEditing ? (
                        <select
                          value={editData.disk_type_id}
                          onChange={(e) => setEditData({ ...editData, disk_type_id: e.target.value })}
                          className="table-select"
                        >
                          <option value="">No disk</option>
                          {diskTypes?.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      ) : (item.disk_type_name || '-')}
                    </td>
                    <td className="text-center">
                      {isEditing && editData.disk_type_id ? (
                        <input
                          type="number"
                          value={editData.disk_size_gb}
                          onChange={(e) => setEditData({ ...editData, disk_size_gb: parseInt(e.target.value) || 0 })}
                          className="table-input table-input-sm"
                          min="10"
                        />
                      ) : (item.disk_size_gb || '-')}
                    </td>
                  </>
                )}
                <td>
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                    className="table-input"
                  />
                </td>
                <td className="text-right">{hourlyTotal.toFixed(4)}</td>
                <td className="text-right">
                  <span className="price-main">{monthlyPayment.toFixed(2)}</span>
                  {months > 1 && (
                    <span className="price-total">({periodTotal.toFixed(2)} total)</span>
                  )}
                </td>
                <td className="actions-cell">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-icon btn-save"
                        onClick={() => saveEdit(item.id)}
                        title="Save changes"
                      >
                        ✓
                      </button>
                      <button
                        className="btn-icon btn-cancel"
                        onClick={cancelEdit}
                        title="Cancel editing"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => startEdit(item)}
                        title="Edit resource specs"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDeleteItem(item.id)}
                        title="Remove resource"
                      >
                        ×
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="summary-row">
            <td></td>
            <td colSpan="4"><strong>Total ({summary.itemCount} items)</strong></td>
            {showSpecs && (
              <>
                <td className="text-center"><strong>{summary.totalVCPUs}</strong></td>
                <td className="text-center"><strong>{summary.totalRAM}</strong></td>
                <td></td>
                <td className="text-center"><strong>{summary.totalDisk}</strong></td>
              </>
            )}
            <td></td>
            <td className="text-right"><strong>{summary.hourlyFlavorCost.toFixed(4)}</strong></td>
            <td className="text-right">
              <strong>
                {months > 1 ? (summary.totalPeriodCost / months).toFixed(2) : summary.totalPeriodCost.toFixed(2)}
              </strong>
              {months > 1 && (
                <span className="price-total">({summary.totalPeriodCost.toFixed(2)} total)</span>
              )}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default QuoteTable
