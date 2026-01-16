import { useState, useEffect, useCallback, useRef } from 'react'
import { quoteApi, quoteItemApi } from '../utils/api'
import cache from '../utils/cache'

export function useQuote() {
  const [quotes, setQuotes] = useState([])
  const [currentQuote, setCurrentQuote] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const saveTimeoutRef = useRef({})

  // Load all quotes
  const loadQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const cached = await cache.get('quotes', 'list')
      if (cached) setQuotes(cached)

      const data = await quoteApi.getQuotes()
      setQuotes(data)
      cache.set('quotes', 'list', data)
    } catch (e) {
      console.error('Failed to load quotes:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new quote
  const createQuote = useCallback(async (name = 'New Quote') => {
    try {
      const quote = await quoteApi.createQuote({ name })
      setQuotes(prev => [...prev, quote])
      setCurrentQuote(quote)
      setItems([])
      cache.set('quotes', 'list', [...quotes, quote])
      return quote
    } catch (e) {
      console.error('Failed to create quote:', e)
      return null
    }
  }, [quotes])

  // Select quote
  const selectQuote = useCallback(async (quoteId) => {
    try {
      const quote = quotes.find(q => q.id === quoteId)
      if (quote) {
        setCurrentQuote(quote)

        // Load items
        const cached = await cache.get('items', quoteId)
        if (cached) setItems(cached)

        const itemData = await quoteItemApi.getItems(quoteId)
        setItems(itemData)
        cache.set('items', quoteId, itemData)
      }
    } catch (e) {
      console.error('Failed to select quote:', e)
    }
  }, [quotes])

  // Update quote name (auto-save)
  const updateQuoteName = useCallback((name) => {
    if (!currentQuote) return

    const updated = { ...currentQuote, name }
    setCurrentQuote(updated)
    cache.set('quote', currentQuote.id, updated)

    // Debounced API save
    if (saveTimeoutRef.current.quote) {
      clearTimeout(saveTimeoutRef.current.quote)
    }

    saveTimeoutRef.current.quote = setTimeout(async () => {
      try {
        await quoteApi.updateQuote(currentQuote.id, updated)
        setQuotes(prev => prev.map(q => q.id === currentQuote.id ? updated : q))
      } catch (e) {
        console.error('Failed to save quote:', e)
      }
    }, 500)
  }, [currentQuote])

  // Add item to quote
  const addItem = useCallback(async (itemData) => {
    if (!currentQuote) return null

    try {
      const item = await quoteItemApi.addItem(currentQuote.id, itemData)
      const newItems = [...items, item]
      setItems(newItems)
      cache.set('items', currentQuote.id, newItems)
      return item
    } catch (e) {
      console.error('Failed to add item:', e)
      return null
    }
  }, [currentQuote, items])

  // Update item (auto-save on typing)
  const updateItem = useCallback((itemId, updates) => {
    if (!currentQuote) return

    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    )
    setItems(updatedItems)
    cache.set('items', currentQuote.id, updatedItems)

    // Debounced API save
    const timeoutKey = `item-${itemId}`
    if (saveTimeoutRef.current[timeoutKey]) {
      clearTimeout(saveTimeoutRef.current[timeoutKey])
    }

    saveTimeoutRef.current[timeoutKey] = setTimeout(async () => {
      try {
        const item = updatedItems.find(i => i.id === itemId)
        await quoteItemApi.updateItem(currentQuote.id, itemId, item)
      } catch (e) {
        console.error('Failed to save item:', e)
      }
    }, 500)
  }, [currentQuote, items])

  // Delete item
  const deleteItem = useCallback(async (itemId) => {
    if (!currentQuote) return

    try {
      await quoteItemApi.deleteItem(currentQuote.id, itemId)
      const newItems = items.filter(i => i.id !== itemId)
      setItems(newItems)
      cache.set('items', currentQuote.id, newItems)
    } catch (e) {
      console.error('Failed to delete item:', e)
    }
  }, [currentQuote, items])

  // Bulk delete items
  const bulkDeleteItems = useCallback(async (itemIds) => {
    if (!currentQuote) return

    try {
      // Delete items in parallel
      await Promise.all(
        itemIds.map(id => quoteItemApi.deleteItem(currentQuote.id, id))
      )
      const newItems = items.filter(i => !itemIds.includes(i.id))
      setItems(newItems)
      cache.set('items', currentQuote.id, newItems)
    } catch (e) {
      console.error('Failed to bulk delete items:', e)
    }
  }, [currentQuote, items])

  // Delete quote
  const deleteQuote = useCallback(async (quoteId) => {
    try {
      await quoteApi.deleteQuote(quoteId)
      setQuotes(prev => prev.filter(q => q.id !== quoteId))
      if (currentQuote?.id === quoteId) {
        setCurrentQuote(null)
        setItems([])
      }
      cache.remove('items', quoteId)
    } catch (e) {
      console.error('Failed to delete quote:', e)
    }
  }, [currentQuote])

  // Duplicate quote
  const duplicateQuote = useCallback(async (quoteId) => {
    try {
      // Get original quote
      const originalQuote = quotes.find(q => q.id === quoteId)
      if (!originalQuote) return null

      // Create new quote with copy name
      const newQuote = await quoteApi.createQuote({
        name: `${originalQuote.name} (Copy)`
      })

      // Get original items
      const originalItems = await quoteItemApi.getItems(quoteId)

      // Copy all items to new quote
      const newItems = await Promise.all(
        originalItems.map(item => quoteItemApi.addItem(newQuote.id, {
          flavor_id: item.flavor_id,
          flavor_name: item.flavor_name,
          vcpus: item.vcpus,
          ram_gb: item.ram_gb,
          flavor_price: item.flavor_price,
          disk_type_id: item.disk_type_id,
          disk_type_name: item.disk_type_name,
          disk_size_gb: item.disk_size_gb,
          disk_price: item.disk_price,
          hostname: item.hostname,
          code_number: item.code_number,
          description: item.description
        }))
      )

      // Update state
      setQuotes(prev => [...prev, newQuote])
      setCurrentQuote(newQuote)
      setItems(newItems)
      cache.set('quotes', 'list', [...quotes, newQuote])
      cache.set('items', newQuote.id, newItems)

      return newQuote
    } catch (e) {
      console.error('Failed to duplicate quote:', e)
      return null
    }
  }, [quotes])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  return {
    quotes,
    currentQuote,
    items,
    loading,
    createQuote,
    selectQuote,
    updateQuoteName,
    addItem,
    updateItem,
    deleteItem,
    deleteQuote,
    duplicateQuote,
    bulkDeleteItems,
    loadQuotes
  }
}

export default useQuote
