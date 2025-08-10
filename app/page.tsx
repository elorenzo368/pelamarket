'use client'
import { useMemo } from 'react'
import { useAppStore } from '@store/useStore'
import { calcFactoryMetrics, sumHourlyMargin, findBottlenecks } from '@services/calc'
import Link from 'next/link'

export default function DashboardPage() {
  const { factories, resources, multipliers, advanced, priceOverlay } = useAppStore()
  const metrics = useMemo(() => factories.map(f => calcFactoryMetrics(f, resources, multipliers, advanced, priceOverlay)), [factories, resources, multipliers, advanced, priceOverlay])
  const totalDinoH = useMemo(() => sumHourlyMargin(metrics), [metrics])
  const top = useMemo(() => [...metrics].sort((a, b) => b.hourlyMarginDino - a.hourlyMarginDino).slice(0, 3), [metrics])
  const bottlenecks = useMemo(() => findBottlenecks(factories, resources, multipliers, advanced), [factories, resources, multipliers, advanced])

  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card"><div className="text-white/60 text-sm">DINO/h estimado</div><div className="text-3xl font-semibold mt-2">{totalDinoH.toFixed(2)}</div><div className="text-xs text-white/50 mt-1">Suma de márgenes/hora de todas las fábricas</div></div>
        <div className="card"><div className="text-white/60 text-sm">Fábricas</div><div className="text-3xl font-semibold mt-2">{factories.length}</div><div className="text-xs text-white/50 mt-1"><Link className="underline" href="/factories">Ver detalle →</Link></div></div>
        <div className="card"><div className="text-white/60 text-sm">Recursos</div><div className="text-3xl font-semibold mt-2">{resources.length}</div><div className="text-xs text-white/50 mt-1"><Link className="underline" href="/resources">Editar precios →</Link></div></div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Top fábricas por margen/h</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Fábrica</th><th>Lvl</th><th>Margen/h (DINO)</th><th>Outputs/h</th></tr></thead>
            <tbody>
              {top.map(m => (
                <tr key={m.factory.id}>
                  <td>{m.factory.name}</td><td>{m.factory.level}</td>
                  <td className={m.hourlyMarginDino >= 0 ? 'good' : 'err'}>{m.hourlyMarginDino.toFixed(2)}</td>
                  <td className="text-white/80">{m.outputsPerHour.map(o => (<span key={o.resourceId} className="mr-3">{o.name} <span className="text-white/60">×</span> {o.unitsPerHour.toFixed(2)}</span>))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Cuellos de botella</h2>
        {bottlenecks.length === 0 ? (<div className="text-white/60 text-sm">Sin cuellos de botella detectados. Buen trabajo.</div>) : (
          <ul className="list-disc pl-6">
            {bottlenecks.map(b => (<li key={b.resourceId}><span className="warn">{b.name}</span>: oferta neta/h <span className="err">{b.netSupply.toFixed(2)}</span> (negativa) → demanda excede producción.</li>))}
          </ul>
        )}
      </div>
    </div>
  )
}