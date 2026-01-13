import React, { useState, useCallback } from 'react'

export function ResourceForm({
  flavors,
  diskTypes,
  onAddItem
}) {
  const [selectedFlavor, setSelectedFlavor] = useState('')
  const [selectedDisk, setSelectedDisk] = useState('')
  const [diskSize, setDiskSize] = useState(100)
  const [hostname, setHostname] = useState('')
  const [codeNumber, setCodeNumber] = useState('')
  const [description, setDescription] = useState('')

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

    onAddItem(item)

    // Reset form
    setHostname('')
    setCodeNumber('')
    setDescription('')
  }, [selectedFlavor, selectedDisk, diskSize, hostname, codeNumber, description, flavors, diskTypes, onAddItem])

  return (
    <div className="resource-form">
      <h3>Add Resource</h3>

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
                {flavor.name} - {flavor.vcpus} vCPU, {flavor.ram_gb}GB RAM - ${flavor.price_hourly}/hr
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
      </div>

      <div className="form-row">
        <div className="form-group form-group-full">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            placeholder="e.g., Production web server"
          />
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleAdd}>
        + Add Resource
      </button>
    </div>
  )
}

export default ResourceForm
