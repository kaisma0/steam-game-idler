import type { ActivePageType } from '@/shared/types'
import { useCallback, useEffect } from 'react'
import { useNavigationStore, useStateStore } from '@/shared/stores'

const SIDEBAR_PAGES: ActivePageType[] = [
  'games',
  'idling',
  'customlists/favorites',
  'freeGames',
  'customlists/card-farming',
  'customlists/achievement-unlocker',
  'customlists/auto-idle',
  'inventoryManager',
]

export function useKeyboardShortcuts() {
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      return

    const {
      activePage,
      previousActivePage,
      setActivePage,
      setPreviousActivePage,
      setCurrentSettingsTab,
    } = useNavigationStore.getState()
    const {
      setShowSearchModal,
      sidebarCollapsed,
      setSidebarCollapsed,
      setTransitionDuration,
      isCardFarming,
      isAchievementUnlocker,
      setShowAchievements,
      setShowAchievementOrder,
    } = useStateStore.getState()

    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      if (activePage === 'idling' || activePage === 'freeGames') return
      e.preventDefault()
      setShowSearchModal(true)
      return
    }

    if (!e.ctrlKey && !e.metaKey) return

    const effectivePage = activePage === 'settings' ? previousActivePage : activePage

    if (e.key === ']') {
      e.preventDefault()
      const currentIndex = SIDEBAR_PAGES.indexOf(effectivePage)
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % SIDEBAR_PAGES.length
      setActivePage(SIDEBAR_PAGES[nextIndex])
    } else if (e.key === '[') {
      e.preventDefault()
      const currentIndex = SIDEBAR_PAGES.indexOf(effectivePage)
      const prevIndex =
        currentIndex === -1 ? 0 : (currentIndex - 1 + SIDEBAR_PAGES.length) % SIDEBAR_PAGES.length
      setActivePage(SIDEBAR_PAGES[prevIndex])
    } else if (e.key === ',') {
      e.preventDefault()
      if (isCardFarming || isAchievementUnlocker) return
      if (activePage === 'settings') {
        setActivePage(previousActivePage)
        setCurrentSettingsTab('general')
        setPreviousActivePage('games')
      } else {
        setShowAchievements(false)
        setShowAchievementOrder(false)
        setPreviousActivePage(activePage)
        setActivePage('settings')
      }
    } else if ((e.key === 'w' || e.key === 'W') && !e.shiftKey) {
      e.preventDefault()
      setTransitionDuration('300ms')
      setSidebarCollapsed(!sidebarCollapsed)
      localStorage.setItem('sidebarCollapsed', String(!sidebarCollapsed))
      setTimeout(() => setTransitionDuration('0ms'), 100)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])
}
