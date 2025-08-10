'use client'
import { ReactNode, useEffect, useState } from 'react'

interface HydrationSafeProps {
  children: ReactNode
  fallback?: ReactNode
  onHydrated?: () => void
}

export function HydrationSafe({ 
  children, 
  fallback = null, 
  onHydrated 
}: HydrationSafeProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    onHydrated?.()
  }, [onHydrated])

  if (!isHydrated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
