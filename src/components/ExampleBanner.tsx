'use client'
import { useAppStore } from '@store/useStore'

export function ExampleBanner() {
  const isExample = useAppStore(s => s.isExampleData)
  if (!isExample) return null
  return <div className="bg-amber-500 text-black text-center py-1 text-sm">Estás viendo datos de ejemplo</div>
}

export default ExampleBanner
