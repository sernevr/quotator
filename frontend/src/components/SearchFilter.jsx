import React from 'react'
import { Search, X } from 'lucide-react'

export function SearchFilter({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="search-filter">
      <span className="search-icon">
        <Search size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function QuoteFilter({ searchTerm, onSearchChange, sortBy, onSortChange }) {
  return (
    <div className="quote-filter">
      <SearchFilter
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Search quotes..."
      />
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="filter-select"
      >
        <option value="updated">Recently Updated</option>
        <option value="created">Recently Created</option>
        <option value="name">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
      </select>
    </div>
  )
}

export default SearchFilter
