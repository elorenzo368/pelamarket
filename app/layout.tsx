import './globals.css'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Providers } from './providers'

export const metadata = {
  title: 'Craft World – DynoCoin Analytics',
  description: 'Local-first analytics para maximizar DynoCoin y optimizar recursos.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>

      <body>
        <Providers>
          <header className="border-b border-white/10">
            <nav className="container py-4 flex items-center gap-3">
              <Link className="btn" href="/">Dashboard</Link>
              <Link className="btn" href="/factories">Fábricas</Link>
              <Link className="btn" href="/resources">Recursos</Link>
              <Link className="btn" href="/settings">Settings</Link>
              <div className="ml-auto text-sm text-white/60">Local-first • v0.3.0</div>
            </nav>
          </header>
          <main className="container py-6">{children}</main>
          <footer className="container py-8 text-center text-white/40 text-sm">
            Craft World – DynoCoin Analytics • Local storage • Reemplazable por DB
          </footer>
        </Providers>
      </body>
    </html>
  )
}