'use client'
import { useMemo, useState } from 'react'
import { useAppStore } from '@store/useStore'
import { Factory } from '@domain/types'
import { calcFactoryMetrics } from '@services/calc'
import { v4 as uuidv4 } from 'uuid'

function EmptyFactory(): Factory {
  return { id: uuidv4(), name: 'Nueva fábrica', level: 1, inputs: [], outputs: [], cycleTimeSec: 60, consumesDynoCoinPerCycle: 0, tags: [] }
}

export default function FactoriesPage() {
  const { factories, resources, multipliers, advanced, priceOverlay, upsertFactory, deleteFactory } = useAppStore()
  const [draft, setDraft] = useState<Factory | null>(null)
  const metrics = useMemo(() => factories.map(f => calcFactoryMetrics(f, resources, multipliers, advanced, priceOverlay)), [factories, resources, multipliers, advanced, priceOverlay])

  const onEdit = (f: Factory) => setDraft(JSON.parse(JSON.stringify(f)))
  const onNew = () => setDraft(EmptyFactory())
  const onSave = () => { if (!draft) return; upsertFactory(draft); setDraft(null) }
  const onAddIngr = (type: 'inputs'|'outputs') => { if (!draft) return; setDraft({ ...draft, [type]: [...draft[type], { resourceId: resources[0]?.id ?? '', qty: 1 }] }) }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Fábricas</h1><button className="btn" onClick={onNew}>+ Nueva</button></div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Nombre</th><th>Lvl</th><th>Ciclo (s)</th><th>Margen/h</th><th>Acciones</th></tr></thead>
          <tbody>
            {metrics.map(m => (
              <tr key={m.factory.id}>
                <td className="font-medium">{m.factory.name}</td><td>{m.factory.level}</td><td>{m.factory.cycleTimeSec}</td>
                <td className={m.hourlyMarginDino >= 0 ? 'good' : 'err'}>{m.hourlyMarginDino.toFixed(2)}</td>
                <td><div className="flex gap-2"><button className="btn" onClick={() => onEdit(m.factory)}>Editar</button><button className="btn" onClick={() => deleteFactory(m.factory.id)}>Borrar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="card grid gap-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Editar fábrica</h2><div className="flex gap-2"><button className="btn" onClick={() => setDraft(null)}>Cancelar</button><button className="btn" onClick={onSave}>Guardar</button></div></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1"><span className="text-sm text-white/70">Nombre</span><input className="input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
            <label className="grid gap-1"><span className="text-sm text-white/70">Nivel</span><input type="number" min={1} className="input" value={draft.level} onChange={e => setDraft({ ...draft, level: Number(e.target.value) })} /></label>
            <label className="grid gap-1"><span className="text-sm text-white/70">Ciclo (seg)</span><input type="number" min={1} className="input" value={draft.cycleTimeSec} onChange={e => setDraft({ ...draft, cycleTimeSec: Number(e.target.value) })} /></label>
          </div>
          <label className="grid gap-1"><span className="text-sm text-white/70">DINO por ciclo (opcional)</span><input type="number" min={0} className="input" value={draft.consumesDynoCoinPerCycle ?? 0} onChange={e => setDraft({ ...draft, consumesDynoCoinPerCycle: Number(e.target.value) })} /></label>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Inputs por ciclo</h3><button className="btn" onClick={() => onAddIngr('inputs')}>+ Input</button></div>
              <div className="grid gap-2">
                {draft.inputs.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr,120px,auto] items-center gap-2">
                    <select className="select" value={ing.resourceId} onChange={e => { const v = e.target.value; const copy = [...draft.inputs]; copy[idx] = { ...ing, resourceId: v }; setDraft({ ...draft, inputs: copy }) }}>
                      <option value="">— Recurso —</option>
                      {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <input type="number" min={0} className="input" value={ing.qty} onChange={e => { const v = Number(e.target.value); const copy = [...draft.inputs]; copy[idx] = { ...ing, qty: v }; setDraft({ ...draft, inputs: copy }) }} />
                    <button className="btn" onClick={() => { const copy = [...draft.inputs]; copy.splice(idx, 1); setDraft({ ...draft, inputs: copy }) }}>x</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Outputs por ciclo</h3><button className="btn" onClick={() => onAddIngr('outputs')}>+ Output</button></div>
              <div className="grid gap-2">
                {draft.outputs.map((ing, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr,120px,auto] items-center gap-2">
                    <select className="select" value={ing.resourceId} onChange={e => { const v = e.target.value; const copy = [...draft.outputs]; copy[idx] = { ...ing, resourceId: v }; setDraft({ ...draft, outputs: copy }) }}>
                      <option value="">— Recurso —</option>
                      {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <input type="number" min={0} className="input" value={ing.qty} onChange={e => { const v = Number(e.target.value); const copy = [...draft.outputs]; copy[idx] = { ...ing, qty: v }; setDraft({ ...draft, outputs: copy }) }} />
                    <button className="btn" onClick={() => { const copy = [...draft.outputs]; copy.splice(idx, 1); setDraft({ ...draft, outputs: copy }) }}>x</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <label className="grid gap-1"><span className="text-sm text-white/70">Notas</span><textarea className="textarea" value={draft.notes ?? ''} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
        </div>
      )}
    </div>
  )
}