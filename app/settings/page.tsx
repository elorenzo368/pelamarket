'use client'
import { useRef, useState, useEffect } from 'react'
import { useAppStore } from '@store/useStore'
import { AutoDetectService } from '@services/autoDetect'
import { importFromCraftworldTips } from '@utils/craftworldTipsImport'

export default function SettingsPage() {
  const { multipliers, setMultipliers, exportAll, importAll, resetAll, resources, advanced, setWorkshopStars, setMasteryLevel, isExampleData, toggleExampleData } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const levelRef = useRef<HTMLInputElement>(null)
  const [voyaId, setVoyaId] = useState('')
  const [detectUrl, setDetectUrl] = useState('')

  useEffect(() => {
    setVoyaId(localStorage.getItem('cw:voyaId') || '')
    setDetectUrl(localStorage.getItem('cw:detectUrl') || '')
  }, [])
  useEffect(() => { try { localStorage.setItem('cw:voyaId', voyaId) } catch {} }, [voyaId])
  useEffect(() => { try { localStorage.setItem('cw:detectUrl', detectUrl) } catch {} }, [detectUrl])

  const onImport = async (file: File) => {
    const txt = await file.text()
    importAll(txt)
  }

  const onDetect = async () => {
    const data = await AutoDetectService.tryLoad({ voyaId, urlTemplate: detectUrl })
    if (!data) { alert('No se pudo detectar automáticamente.'); return }
    const ok = confirm(`Se detectaron ${data.resources.length} recursos y ${data.factories.length} fábricas. ¿Sobrescribir setup actual?`)
    if (ok) { importAll(JSON.stringify(data, null, 2)) }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="card grid gap-4">
        <h2 className="font-semibold">Multiplicadores de velocidad (globales)</h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="grid gap-1"><span className="text-sm text-white/70">Workers %</span><input type="number" step="0.01" className="input" value={multipliers.workersPct ?? 0} onChange={e => setMultipliers({ ...multipliers, workersPct: Number(e.target.value) })} /></label>
          <label className="grid gap-1"><span className="text-sm text-white/70">Workshop %</span><input type="number" step="0.01" className="input" value={multipliers.workshopPct ?? 0} onChange={e => setMultipliers({ ...multipliers, workshopPct: Number(e.target.value) })} /></label>
          <label className="grid gap-1"><span className="text-sm text-white/70">Ads %</span><input type="number" step="0.01" className="input" value={multipliers.adsPct ?? 0} onChange={e => setMultipliers({ ...multipliers, adsPct: Number(e.target.value) })} /></label>
          <label className="grid gap-1"><span className="text-sm text-white/70">Custom %</span><input type="number" step="0.01" className="input" value={multipliers.customPct ?? 0} onChange={e => setMultipliers({ ...multipliers, customPct: Number(e.target.value) })} /></label>
        </div>
        <div className="text-sm text-white/60">Efectivo = (1 + workers) × (1 + workshop) × (1 + workshop★(recurso)) × (1 + ads) × (1 + custom)</div>
      </div>

      <div className="card grid gap-4">
        <h2 className="font-semibold">Modo avanzado (por recurso)</h2>
        <div className="text-sm text-white/60">Workshop ★ (0–5 en pasos de 0.5) y Mastery (0–10). Afectan velocidad y eficiencia de insumos.</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Recurso</th><th>Workshop ★</th><th>Mastery</th></tr></thead>
            <tbody>
              {resources.map(r => {
                const starsHalf = advanced.workshopStarsHalf?.[r.id] ?? 0
                const mastery = advanced.masteryLevel?.[r.id] ?? 0
                return (
                  <tr key={r.id}>
                    <td className="font-medium">{r.name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={10} step={1} className="w-40" value={starsHalf} onChange={e => setWorkshopStars(r.id, Number(e.target.value))} />
                        <span className="text-white/70 text-sm">{(starsHalf/2).toFixed(1)}★</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={10} step={1} className="w-40" value={mastery} onChange={e => setMasteryLevel(r.id, Number(e.target.value))} />
                        <span className="text-white/70 text-sm">Lv {mastery}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card grid gap-4">
        <h2 className="font-semibold">Precios (overlay)</h2>
        <div className="text-sm text-white/60">
          Elegí la fuente de precios. Se aplican como <b>overlay</b> en cálculos (sin pisar tus recursos) salvo que habilites “Aplicar overlay a recursos”.
        </div>
        <PriceControls />
      </div>

      <div className="card grid gap-3">
        <h2 className="font-semibold">Import / Export</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="checkbox" checked={isExampleData} onChange={e => toggleExampleData(e.target.checked)} /> Cargar datos de ejemplo</label>
          <button className="btn" onClick={() => { const blob = new Blob([exportAll()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'craftworld-setup.json'; a.click(); URL.revokeObjectURL(a.href) }}>Exportar JSON</button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f) }} />
          <button className="btn" onClick={() => fileRef.current?.click()}>Importar JSON</button>
          <button className="btn" onClick={async () => {
            const raw = prompt('Pega aquí JS/JSON de craftworld.tips (FACTORY_PRODUCTION_DATA o const u=...):')
            if (!raw) return
            const levelStr = levelRef.current?.value || '1'
            const level = Math.max(1, Math.min(50, parseInt(levelStr || '1')))
            try {
              const data = importFromCraftworldTips(raw, level)
              if (!data) { alert('No se pudo parsear. Revisa el texto.'); return }
              if (confirm(`Se importarán ${data.factories.length} fábricas al nivel L${level}. ¿Sobrescribir setup actual?`)) {
                importAll(JSON.stringify(data))
              }
            } catch (e) {
              alert('Error importando: ' + (e as Error).message)
            }
          }}>Importar craftworld.tips</button>
          <input ref={levelRef} type="number" min={1} max={50} defaultValue={1} className="input max-w-24" title="Nivel por defecto L" />
          <input className="input max-w-24" placeholder="Voya ID" value={voyaId} onChange={e => setVoyaId(e.target.value)} />
          <input className="input w-64" placeholder="URL plantilla" value={detectUrl} onChange={e => setDetectUrl(e.target.value)} />
          <button className="btn" onClick={onDetect}>Probar detección</button>
          <button className="btn" onClick={() => { if (confirm('Esto borrará tu setup local. ¿Continuar?')) resetAll() }}>Reset</button>
        </div>
      </div>
    </div>
  )
}

function PriceControls() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [snapshotName, setSnapshotName] = useState<string>('')
  const { priceProviderId, setProvider, priceTTLms, setTTL, priceRemoteUrl, setRemoteUrl, applyOverlayToResources, refreshPrices, importSnapshotText, priceLastUpdated } = useAppStore()
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString()

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between text-sm">
        <span>{priceProviderId === 'remote-json' ? '🟢 Live' : priceProviderId === 'snapshot' ? '🟡 Snapshot' : '⚪ Manual'}</span>
        <span className="text-white/60">{priceLastUpdated ? `Última actualización: ${formatTime(priceLastUpdated)}` : 'Sin actualizar'}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="grid gap-1">
          <span className="text-sm text-white/70">Fuente</span>
          <select className="select" value={priceProviderId} onChange={e => setProvider(e.target.value as any)}>
            <option value="manual">Manual (precios de recursos)</option>
            <option value="snapshot">Snapshot JSON (archivo/pegar)</option>
            <option value="remote-json">Remote JSON (URL pública)</option>
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-white/70">TTL (ms)</span>
          <input className="input" type="number" min={1000} value={priceTTLms} onChange={e => setTTL(Number(e.target.value))} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm text-white/70">Aplicar overlay a recursos</span>
          <select className="select" value={String(applyOverlayToResources)} onChange={e => useAppStore.setState({ applyOverlayToResources: e.target.value === 'true' })}>
            <option value="false">No</option>
            <option value="true">Sí (pisar precios locales)</option>
          </select>
        </label>
      </div>

      {priceProviderId === 'snapshot' && (
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const txt = await f.text()
              await importSnapshotText(txt)
              setSnapshotName(f.name)
            }} />
          <button className="btn" onClick={() => fileRef.current?.click()}>Subir snapshot</button>
          <span className="text-white/60 text-sm">{snapshotName || 'Ningún archivo seleccionado'}</span>
          <button className="btn" onClick={async () => {
            const raw = prompt('Pegá aquí JSON de snapshot de precios:')
            if (!raw) return
            await importSnapshotText(raw)
            setSnapshotName('pegado-manual.json')
          }}>Pegar JSON</button>
          <button className="btn" onClick={async () => {
            const demo = { prices: { COPPER: { currentPrice: 10 } } }
            await importSnapshotText(JSON.stringify(demo))
            setSnapshotName('demo.json')
          }}>Probar snapshot de ejemplo</button>
        </div>
      )}

      {priceProviderId === 'remote-json' && (
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-white/70">URL</span>
            <input className="input" placeholder="https://example.com/prices.json" value={priceRemoteUrl ?? ''} onChange={e => setRemoteUrl(e.target.value)} />
          </label>
        </div>
      )}

      <div className="flex gap-2">
        <button className="btn" onClick={() => refreshPrices()}>Refrescar ahora</button>
      </div>
    </div>
  )
}