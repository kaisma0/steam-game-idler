import type { ProTier } from '@/shared/utils'
import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'
import { GRANDFATHER_CUTOFF, logEvent } from '@/shared/utils'

export function useCheckForPro() {
  const userSummary = useUserStore(state => state.userSummary)
  const setIsPro = useUserStore(state => state.setIsPro)
  const setProTier = useUserStore(state => state.setProTier)

  useEffect(() => {
    setIsPro(true)
    setProTier('gamer')
  }, [setIsPro, setProTier])
}