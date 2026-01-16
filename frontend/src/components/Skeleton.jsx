import React from 'react'

export function Skeleton({ width, height, variant = 'rect', className = '' }) {
  const style = {
    width: width || '100%',
    height: height || '1rem',
  }

  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
    />
  )
}

export function SkeletonTable({ rows = 5, cols = 8 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-header">
        {Array(cols).fill(0).map((_, i) => (
          <Skeleton key={i} height="2rem" />
        ))}
      </div>
      {Array(rows).fill(0).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-row">
          {Array(cols).fill(0).map((_, colIdx) => (
            <Skeleton key={colIdx} height="2.5rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonQuoteList({ count = 4 }) {
  return (
    <div className="skeleton-quote-list">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="skeleton-quote-item">
          <Skeleton width="70%" height="1.25rem" />
          <Skeleton width="24px" height="24px" variant="circle" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="skeleton-form">
      <Skeleton width="150px" height="1.5rem" className="mb-1" />
      <div className="skeleton-form-row">
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
      </div>
      <div className="skeleton-form-row">
        <Skeleton height="2.5rem" />
        <Skeleton height="2.5rem" />
        <Skeleton width="100px" height="2.5rem" />
      </div>
    </div>
  )
}

export default Skeleton
