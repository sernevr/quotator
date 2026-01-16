import React, { useState, useCallback, useEffect } from 'react'
import { pricingApi } from '../utils/api'

export function ResourceForm({
  flavors,
  diskTypes,
  onAddItem,
  pricingMode
}) {
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [selectedDisk, setSelectedDisk] = useState('')
  const [diskSize, setDiskSize] = useState(100)
  const [hostname, setHostname] = useState('')
  const [codeNumber, setCodeNumber] = useState('')
  const [description, setDescription] = useState('')
  const [count, setCount] = useState(1)
  const [autoDescription, setAutoDescription] = useState(true)

  // Best match state
  const [searchCpu, setSearchCpu] = useState('')
  const [searchRam, setSearchRam] = useState('')
  const [matchResults, setMatchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Auto-generate description when flavor or disk changes
  useEffect(() => {
    if (!autoDescription) return
    const flavor = flavors.find(f => f.id === selectedFlavor)
    const disk = diskTypes.find(d => d.id === selectedDisk)
    if (flavor) {
      let desc = `${flavor.name} - ${flavor.vcpus}vCPU/${flavor.ram_gb}GB`
      if (disk && diskSize) {
        desc += ` + ${diskSize}GB ${disk.name}`
      }
      setDescription(desc)
    }
  }, [selectedFlavor, selectedDisk, diskSize, flavors, diskTypes, autoDescription])

  const getFlavorPrice = (flavor) => {
    if (!flavor) return 0
    switch (pricingMode) {
      case 'yearly1': return flavor.price_yearly_1 || flavor.price_hourly * 720 * 12 * 0.6
      case 'yearly3': return flavor.price_yearly_3 || flavor.price_hourly * 720 * 12 * 3 * 0.4
      default: return flavor.price_monthly || flavor.price_hourly * 720
    }
  }

  const getPricePeriod = () => {
    switch (pricingMode) {
      case 'yearly1': return '/year'
      case 'yearly3': return '/3 years'
      default: return '/month'
    }
  }

  const handleSearch = useCallback(async () => {
    const vcpus = parseInt(searchCpu)
    const ramGb = parseFloat(searchRam)

    if (!vcpus || !ramGb || vcpus < 1 || ramGb < 0.5) {
      return
    }

    setSearching(true)
    try {
      const results = await pricingApi.findBestMatch(vcpus, ramGb)
      setMatchResults(results || [])
    } catch (e) {
      console.error('Search failed:', e)
      // Fallback to client-side filtering
      const filtered = flavors
        .filter(f => f.vcpus >= vcpus && f.ram_gb >= ramGb)
        .sort((a, b) => (a.price_hourly || 0) - (b.price_hourly || 0))
        .slice(0, 5)
      setMatchResults(filtered)
    } finally {
      setSearching(false)
    }
  }, [searchCpu, searchRam, flavors])

  const handleSelectMatch = (flavor) => {
    setSelectedFlavor(flavor.id)
    setMatchResults([])
    setSearchCpu('')
    setSearchRam('')
  }

  const handleAdd = useCallback(() => {
    if (!selectedFlavor) {
      alert('Please select an instance type')
      return
    }

    const flavor = flavors.find(f => f.id === selectedFlavor)
    const disk = diskTypes.find(d => d.id === selectedDisk)

    const item = {
      flavor_id: selectedFlavor,
      flavor_name: flavor?.name || '',
      vcpus: flavor?.vcpus || 0,
      ram_gb: flavor?.ram_gb || 0,
      flavor_price: flavor?.price_hourly || 0,
      disk_type_id: selectedDisk || null,
      disk_type_name: disk?.name || null,
      disk_size_gb: selectedDisk ? diskSize : null,
      disk_price: disk ? disk.price_per_gb * diskSize : null,
      hostname: hostname || `server-${Date.now()}`,
      code_number: codeNumber,
      description: description
    }

    onAddItem(item, count)

    // Reset form but auto-increment code if pattern detected
    if (codeNumber) {
      const match = codeNumber.match(/^(.*?)(\d+)$/)
      if (match) {
        const nextNum = parseInt(match[2]) + count
        setCodeNumber(`${match[1]}${String(nextNum).padStart(match[2].length, '0')}`)
      }
    }
    setHostname('')
    setCount(1)
    if (!autoDescription) setDescription('')
  }, [selectedFlavor, selectedDisk, diskSize, hostname, codeNumber, description, count, flavors, diskTypes, onAddItem, autoDescription])

  return (
    <div className="resource-form">
      <h3>Add Resource</h3>

      {/* Best Match Finder */}
      <div className="best-match-finder">
        <h4>Find Best ECS Match</h4>
        <div className="best-match-inputs">
          <div className="form-group">
            <label>Required vCPUs</label>
            <input
              type="number"
              value={searchCpu}
              onChange={(e) => setSearchCpu(e.target.value)}
              className="form-input"
              placeholder="e.g., 4"
              min="1"
              max="128"
            />
          </div>
          <div className="form-group">
            <label>Required RAM (GB)</label>
            <input
              type="number"
              value={searchRam}
              onChange={(e) => setSearchRam(e.target.value)}
              className="form-input"
              placeholder="e.g., 8"
              min="0.5"
              max="512"
              step="0.5"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            disabled={searching || !searchCpu || !searchRam}
          >
            {searching ? 'Searching...' : 'Find'}
          </button>
        </div>

        {matchResults.length > 0 && (
          <div className="best-match-results">
            <h5>Best Matches (click to select)</h5>
            <div className="match-list">
              {matchResults.map(flavor => (
                <div
                  key={flavor.id}
                  className="match-item"
                  onClick={() => handleSelectMatch(flavor)}
                >
                  <div className="match-item-info">
                    <div className="match-item-name">{flavor.name}</div>
                    <div className="match-item-specs">
                      {flavor.vcpus} vCPU, {flavor.ram_gb} GB RAM
                    </div>
                  </div>
                  <div className="match-item-price">
                    <div className="price-value">${getFlavorPrice(flavor).toFixed(2)}</div>
                    <div className="price-period">{getPricePeriod()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Instance Type (ECS)</label>
          <select
            value={selectedFlavor}
            onChange={(e) => setSelectedFlavor(e.target.value)}
            className="form-select"
          >
            <option value="">Select instance type...</option>
            {flavors.map(flavor => (
              <option key={flavor.id} value={flavor.id}>
                {flavor.name} - {flavor.vcpus} vCPU, {flavor.ram_gb}GB RAM - ${getFlavorPrice(flavor).toFixed(2)}{getPricePeriod()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Disk Type (EVS)</label>
          <select
            value={selectedDisk}
            onChange={(e) => setSelectedDisk(e.target.value)}
            className="form-select"
          >
            <option value="">No additional disk</option>
            {diskTypes.map(disk => (
              <option key={disk.id} value={disk.id}>
                {disk.name} - ${disk.price_per_gb}/GB/month
              </option>
            ))}
          </select>
        </div>

        {selectedDisk && (
          <div className="form-group form-group-sm">
            <label>Size (GB)</label>
            <input
              type="number"
              value={diskSize}
              onChange={(e) => setDiskSize(parseInt(e.target.value) || 0)}
              className="form-input"
              min="10"
              max="32768"
            />
          </div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Hostname</label>
          <input
            type="text"
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
            className="form-input"
            placeholder="e.g., web-server-01"
          />
        </div>

        <div className="form-group">
          <label>Code Number</label>
          <input
            type="text"
            value={codeNumber}
            onChange={(e) => setCodeNumber(e.target.value)}
            className="form-input"
            placeholder="e.g., WS-001"
          />
        </div>

        <div className="form-group">
          <label>
            Description
            <button
              type="button"
              className={`auto-toggle ${autoDescription ? 'active' : ''}`}
              onClick={() => setAutoDescription(!autoDescription)}
              title={autoDescription ? 'Auto-generate ON' : 'Auto-generate OFF'}
            >
              ⟳
            </button>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setAutoDescription(false)
            }}
            className="form-input"
            placeholder={autoDescription ? 'Auto-generated from specs' : 'e.g., Production web server'}
          />
        </div>
      </div>

      <div className="form-row form-row-actions">
        <div className="form-group form-group-sm">
          <label>Count</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="form-input"
            min="1"
            max="100"
          />
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          + Add {count > 1 ? `${count} Resources` : 'Resource'}
        </button>
      </div>
    </div>
  )
}

export default ResourceForm
