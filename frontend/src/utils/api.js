const API_BASE = '/api'

// Debounce utility for API calls
const debounceMap = new Map()

function debounce(key, fn, delay = 500) {
  if (debounceMap.has(key)) {
    clearTimeout(debounceMap.get(key))
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      try {
        const result = await fn()
        debounceMap.delete(key)
        resolve(result)
      } catch (e) {
        reject(e)
      }
    }, delay)

    debounceMap.set(key, timeoutId)
  })
}

// Generic API request
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (e) {
    console.error('API request failed:', e)
    throw e
  }
}

// Pricing API
export const pricingApi = {
  // Get ECS flavors
  async getFlavors() {
    return request('/flavors')
  },

  // Get EVS disk types
  async getDiskTypes() {
    return request('/disks')
  },

  // Get all pricing data
  async getPricing() {
    return request('/pricing')
  },

  // Trigger crawl refresh
  async refreshPricing() {
    return request('/crawl', { method: 'POST' })
  }
}

// Quote API
export const quoteApi = {
  // Get all quotes
  async getQuotes() {
    return request('/quotes')
  },

  // Get single quote
  async getQuote(id) {
    return request(`/quotes/${id}`)
  },

  // Create quote
  async createQuote(quote) {
    return request('/quotes', {
      method: 'POST',
      body: JSON.stringify(quote)
    })
  },

  // Update quote (debounced)
  async updateQuote(id, quote) {
    return debounce(`quote-${id}`, () =>
      request(`/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(quote)
      })
    )
  },

  // Delete quote
  async deleteQuote(id) {
    return request(`/quotes/${id}`, { method: 'DELETE' })
  }
}

// Quote items API
export const quoteItemApi = {
  // Get items for quote
  async getItems(quoteId) {
    return request(`/quotes/${quoteId}/items`)
  },

  // Add item to quote
  async addItem(quoteId, item) {
    return request(`/quotes/${quoteId}/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    })
  },

  // Update item (debounced for typing)
  async updateItem(quoteId, itemId, item) {
    return debounce(`item-${itemId}`, () =>
      request(`/quotes/${quoteId}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(item)
      })
    )
  },

  // Delete item
  async deleteItem(quoteId, itemId) {
    return request(`/quotes/${quoteId}/items/${itemId}`, { method: 'DELETE' })
  }
}

export default { pricingApi, quoteApi, quoteItemApi }
