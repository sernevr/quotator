import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback((event) => {
    // Don't trigger if user is typing in an input
    if (
      event.target.tagName === 'INPUT' ||
      event.target.tagName === 'TEXTAREA' ||
      event.target.isContentEditable
    ) {
      // Allow Escape to work even in inputs
      if (event.key !== 'Escape') return
    }

    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey

    for (const shortcut of shortcuts) {
      const matches =
        shortcut.key.toLowerCase() === key &&
        (shortcut.ctrl ?? false) === ctrl &&
        (shortcut.shift ?? false) === shift &&
        (shortcut.alt ?? false) === alt

      if (matches && shortcut.action) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function KeyboardShortcutsHelp({ shortcuts }) {
  return (
    <div className="shortcuts-help">
      <h4>Keyboard Shortcuts</h4>
      <div className="shortcuts-list">
        {shortcuts.map((shortcut, idx) => (
          <div key={idx} className="shortcut-item">
            <span className="shortcut-keys">
              {shortcut.ctrl && <kbd>Ctrl</kbd>}
              {shortcut.shift && <kbd>Shift</kbd>}
              {shortcut.alt && <kbd>Alt</kbd>}
              <kbd>{shortcut.key.toUpperCase()}</kbd>
            </span>
            <span className="shortcut-desc">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default useKeyboardShortcuts
