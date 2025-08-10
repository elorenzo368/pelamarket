'use client'
import { useState } from 'react'
import { useAppStore } from '@store/useStore'
import { Resource } from '@domain/types'
import { v4 as uuidv4 } from 'uuid'

export default function ResourcesPage() {
  const { resources, upsertResource, deleteResource, priceOverlay } = useAppStore()
  const [draft, setDraft] = useState<Resource>({ id: uuidv4(), name: '' })
  const [search, setSearch] = useState('')

  const onSave = () => { if (!draft.name.trim()) return; upsertResource(draft); setDraft({ id: uuidv4(), name: '' }) }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold">Recursos</h1>
        <input className="input max-w-xs" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card grid gap-3">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1"><span className="text-sm text-white/70">Nombre</span><input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Copper, Water..." /></label>
          <label className="grid gap-1"><span className="text-sm text-white/70">Ticker (opcional)</span><input className="input" value={draft.ticker ?? ''} onChange={e => setDraft({ ...draft, ticker: e.target.value })} placeholder="Cu, H2O..." /></label>
          <label className="grid gap-1"><span className="text-sm text-white/70">Precio de mercado (DINO)</span><input type="number" min={0} className="input" value={draft.marketPriceDino ?? 0} onChange={e => setDraft({ ...draft, marketPriceDino: Number(e.target.value) })} /></label>
        </div>
        <label className="grid gap-1"><span className="text-sm text-white/70">Notas</span><textarea className="textarea" value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
        <div className="flex gap-2"><button className="btn" onClick={onSave}>Agregar/Actualizar</button><button className="btn" onClick={() => setDraft({ id: uuidv4(), name: '' })}>Limpiar</button></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Ticker</th><th>Precio DINO</th><th>Notas</th><th>Acciones</th></tr></thead>
          <tbody>
            {resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || (r.ticker ?? '').toLowerCase().includes(search.toLowerCase())).map(r => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td>{r.ticker ?? '—'}</td>
                <td>{(priceOverlay[r.id]?.price ?? r.marketPriceDino ?? 0).toFixed(2)}{priceOverlay[r.id] && <span className="ml-1 text-xs text-amber-400" title={`overlay: ${priceOverlay[r.id].source}`}>★</span>}</td>
                <td className="text-white/70">{r.notes ?? '—'}</td>
                <td><div className="flex gap-2"><button className="btn" onClick={() => setDraft(r)}>Editar</button><button className="btn" onClick={() => deleteResource(r.id)}>Borrar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}