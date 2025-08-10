# Craft World – DynoCoin Analytics (Local-First) v0.3.0

Minimal, rápido y extensible. Next.js (App Router) + TypeScript + Tailwind v4 + Zustand. Arquitectura limpia, **storage intercambiable**, cálculos de producción y márgenes con **multiplicadores avanzados** (Workshop ★ y Mastery) y **overlay de precios** (manual/snapshot/URL).

## Scripts
```bash
pnpm install
pnpm dev
pnpm test
```

## How to QA
1. En **Settings**, activar "Cargar datos de ejemplo" para reinstalar el seed. Debe aparecer el banner amarillo.
2. En **Precios**, seleccionar "Snapshot" y usar el botón **Probar snapshot de ejemplo**. La píldora debe mostrar 🟡 Snapshot y en /resources aparecerá una estrella junto al precio de Copper.
3. Importar un JSON de craftworld.tips desde Settings y verificar que se agregan fábricas.
4. Completar los campos **Voya ID** y **URL plantilla** y pulsar **Probar detección** (requiere una URL pública que devuelva ExportShape). Confirmar el modal para sobrescribir.
5. Utilizar **Exportar JSON** y luego **Importar JSON** para validar el flujo completo.
