import { useState, useEffect, useCallback } from 'react'
import { pricingApi } from '../utils/api'
import cache from '../utils/cache'

export function usePricing() {
  const [flavors, setFlavors] = useState([])
  const [diskTypes, setDiskTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadPricing = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Try cache first
      const cachedFlavors = await cache.get('flavors', 'all')
      const cachedDisks = await cache.get('disks', 'all')

      if (cachedFlavors && cachedDisks) {
        setFlavors(cachedFlavors)
        setDiskTypes(cachedDisks)
      }

      // Fetch fresh data
      const [flavorData, diskData] = await Promise.all([
        pricingApi.getFlavors(),
        pricingApi.getDiskTypes()
      ])

      setFlavors(flavorData)
      setDiskTypes(diskData)

      // Update cache
      cache.set('flavors', 'all', flavorData)
      cache.set('disks', 'all', diskData)
    } catch (e) {
      setError('Failed to load pricing data. Is the API running?')
      console.error('Pricing load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPricing = useCallback(async () => {
    try {
      await pricingApi.refreshPricing()
      await loadPricing()
    } catch (e) {
      setError('Failed to refresh pricing data')
    }
  }, [loadPricing])

  useEffect(() => {
    loadPricing()
  }, [loadPricing])

  return { flavors, diskTypes, loading, error, refreshPricing }
}

export default usePricing
