'use client'
import { ReactNode, useEffect } from 'react'
import { useAppStore, useHydration } from '../src/store/useStore'
import { LocalStorageRepo } from '../src/repos/localStorageRepo'

export function Providers({ children }: { children: ReactNode }) {
  const isHydrated = useHydration()
  const initFromRepo = useAppStore(s => s.initFromRepo)
  const setHydrated = useAppStore(s => s.setHydrated)

  useEffect(() => {
    setHydrated()
  }, [setHydrated])

  useEffect(() => {
    if (isHydrated) {
      const initializeApp = async () => {
        try {
          await initFromRepo(new LocalStorageRepo())
        } catch (error) {
          console.error('Error initializing app:', error)
        }
      }
      initializeApp()
    }
  }, [initFromRepo, isHydrated])

  // Mostrar loading mientras se hidrata
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}