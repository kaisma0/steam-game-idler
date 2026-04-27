import { useEffect } from 'react'
import { useUserStore } from '@/shared/stores'

export function useCheckSubscription() {
  const setIsSubscribed = useUserStore(state => state.setIsSubscribed)
  const setSubscriptionTier = useUserStore(state => state.setSubscriptionTier)

  useEffect(() => {
    setIsSubscribed(true)
    setSubscriptionTier('gamer')
  }, [setIsSubscribed, setSubscriptionTier])
}
