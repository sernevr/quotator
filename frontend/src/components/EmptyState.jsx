import React from 'react'

export function EmptyState({ type = 'quotes', onAction, actionLabel }) {
  const illustrations = {
    quotes: (
      <svg viewBox="0 0 200 150" className="empty-illustration">
        <rect x="30" y="30" width="140" height="90" rx="8" fill="var(--huawei-gray-200)" />
        <rect x="40" y="45" width="80" height="8" rx="4" fill="var(--huawei-gray-400)" />
        <rect x="40" y="60" width="100" height="6" rx="3" fill="var(--huawei-gray-300)" />
        <rect x="40" y="72" width="60" height="6" rx="3" fill="var(--huawei-gray-300)" />
        <rect x="40" y="90" width="40" height="20" rx="4" fill="var(--primary)" opacity="0.3" />
        <circle cx="150" cy="100" r="25" fill="var(--primary)" opacity="0.15" />
        <path d="M142 100 L150 108 L162 92" stroke="var(--primary)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    ),
    items: (
      <svg viewBox="0 0 200 150" className="empty-illustration">
        <rect x="20" y="40" width="160" height="20" rx="4" fill="var(--huawei-gray-200)" />
        <rect x="20" y="65" width="160" height="20" rx="4" fill="var(--huawei-gray-200)" />
        <rect x="20" y="90" width="160" height="20" rx="4" fill="var(--huawei-gray-200)" />
        <circle cx="100" cy="75" r="35" fill="var(--primary)" opacity="0.1" />
        <path d="M90 75 L110 75 M100 65 L100 85" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 200 150" className="empty-illustration">
        <circle cx="85" cy="70" r="35" stroke="var(--huawei-gray-400)" strokeWidth="4" fill="none" />
        <line x1="110" y1="95" x2="140" y2="125" stroke="var(--huawei-gray-400)" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 70 Q85 55 100 70" stroke="var(--huawei-gray-300)" strokeWidth="2" fill="none" />
      </svg>
    )
  }

  const messages = {
    quotes: {
      title: 'Welcome to Quotator',
      description: 'Create your first quote to start building cloud infrastructure pricing estimates for Huawei Cloud Istanbul Region.'
    },
    items: {
      title: 'No Resources Yet',
      description: 'Use the form above to add ECS instances and storage to your quote.'
    },
    search: {
      title: 'No Results Found',
      description: 'Try adjusting your search terms or filters.'
    }
  }

  const { title, description } = messages[type] || messages.quotes

  return (
    <div className="empty-state">
      {illustrations[type]}
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction && (
        <button className="btn btn-primary btn-lg" onClick={onAction}>
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  )
}

export default EmptyState
