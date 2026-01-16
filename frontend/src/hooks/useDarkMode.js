import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('quotator-dark-mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark-mode')
    } else {
      root.classList.remove('dark-mode')
    }
    localStorage.setItem('quotator-dark-mode', isDark)
  }, [isDark])

  const toggle = () => setIsDark(prev => !prev)

  return { isDark, toggle }
}

export default useDarkMode
