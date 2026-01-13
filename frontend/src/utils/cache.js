import localforage from 'localforage'

// Configure localforage for optimal performance
localforage.config({
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
  name: 'quotator',
  storeName: 'quote_data',
  description: 'Quotator local cache'
})

// Lightweight cache with automatic cleanup
const CACHE_VERSION = 'v1'
const MAX_CACHE_ITEMS = 100

class QuotatorCache {
  constructor() {
    this.memoryCache = new Map()
    this.pendingSaves = new Map()
    this.debounceMs = 300
  }

  // Generate cache key
  key(type, id = 'default') {
    return `${CACHE_VERSION}:${type}:${id}`
  }

  // Get from memory first, then storage
  async get(type, id = 'default') {
    const cacheKey = this.key(type, id)

    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)
    }

    try {
      const value = await localforage.getItem(cacheKey)
      if (value !== null) {
        this.memoryCache.set(cacheKey, value)
      }
      return value
    } catch (e) {
      console.warn('Cache read error:', e)
      return null
    }
  }

  // Set with debounce for performance
  async set(type, id, value) {
    const cacheKey = this.key(type, id)

    // Update memory immediately
    this.memoryCache.set(cacheKey, value)

    // Debounce storage writes
    if (this.pendingSaves.has(cacheKey)) {
      clearTimeout(this.pendingSaves.get(cacheKey))
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        try {
          await localforage.setItem(cacheKey, value)
          this.pendingSaves.delete(cacheKey)
          resolve(true)
        } catch (e) {
          console.warn('Cache write error:', e)
          resolve(false)
        }
      }, this.debounceMs)

      this.pendingSaves.set(cacheKey, timeoutId)
    })
  }

  // Remove specific item
  async remove(type, id = 'default') {
    const cacheKey = this.key(type, id)
    this.memoryCache.delete(cacheKey)

    if (this.pendingSaves.has(cacheKey)) {
      clearTimeout(this.pendingSaves.get(cacheKey))
      this.pendingSaves.delete(cacheKey)
    }

    try {
      await localforage.removeItem(cacheKey)
    } catch (e) {
      console.warn('Cache remove error:', e)
    }
  }

  // Clear all cache
  async clear() {
    this.memoryCache.clear()
    this.pendingSaves.forEach(timeout => clearTimeout(timeout))
    this.pendingSaves.clear()

    try {
      await localforage.clear()
    } catch (e) {
      console.warn('Cache clear error:', e)
    }
  }

  // Cleanup old entries
  async cleanup() {
    try {
      const keys = await localforage.keys()
      const oldKeys = keys.filter(k => !k.startsWith(CACHE_VERSION))

      for (const key of oldKeys) {
        await localforage.removeItem(key)
      }

      // Limit cache size
      if (keys.length > MAX_CACHE_ITEMS) {
        const toRemove = keys.slice(0, keys.length - MAX_CACHE_ITEMS)
        for (const key of toRemove) {
          await localforage.removeItem(key)
          this.memoryCache.delete(key)
        }
      }
    } catch (e) {
      console.warn('Cache cleanup error:', e)
    }
  }
}

export const cache = new QuotatorCache()

// Run cleanup on load
cache.cleanup()

export default cache
