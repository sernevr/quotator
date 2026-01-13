import { useCallback, useRef, useEffect } from 'react'
import cache from '../utils/cache'

// Hook for auto-saving data to both cache and API
export function useAutoSave(cacheType, apiSaveFunction) {
  const saveTimeoutRef = useRef(null)
  const lastSavedRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const save = useCallback(async (id, data) => {
    // Skip if data unchanged
    const dataStr = JSON.stringify(data)
    if (lastSavedRef.current === dataStr) {
      return
    }

    // Save to cache immediately (non-blocking)
    cache.set(cacheType, id, data)

    // Clear pending API save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounced API save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiSaveFunction(id, data)
        lastSavedRef.current = dataStr
      } catch (e) {
        console.error('API save failed, data preserved in cache:', e)
      }
    }, 500)
  }, [cacheType, apiSaveFunction])

  // Load from cache first, fallback to API
  const load = useCallback(async (id, apiFetchFunction) => {
    // Try cache first
    const cached = await cache.get(cacheType, id)
    if (cached) {
      return cached
    }

    // Fetch from API
    try {
      const data = await apiFetchFunction(id)
      cache.set(cacheType, id, data)
      return data
    } catch (e) {
      console.error('Failed to load data:', e)
      return null
    }
  }, [cacheType])

  return { save, load }
}

export default useAutoSave
