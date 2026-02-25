"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { getPocketBaseClient } from "@/lib/pocketbase"
import { ServiceWizard } from "./service-wizard"
import { ServiceList } from "./service-list"

export default function Dashboard() {
  const router = useRouter()
  const pb = useMemo(() => getPocketBaseClient(), [])
  const [userName, setUserName] = useState("Usuario")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const syncAuth = () => {
      if (!pb.authStore.isValid) {
        router.replace("/")
        return
      }
      const model = pb.authStore.model as { name?: string; email?: string } | null
      setUserName(model?.name || model?.email || "Usuario")
      setIsReady(true)
    }

    syncAuth()
    const unsubscribe = pb.authStore.onChange(() => syncAuth())
    return () => unsubscribe()
  }, [pb, router])

  const handleSignOut = () => {
    pb.authStore.clear()
    router.replace("/")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-zinc-400 mt-2">
              {isReady ? `Bienvenido, ${userName}` : "Cargando sesión..."}
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg bg-red-600/10 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600/20 transition-colors cursor-pointer border border-red-600/20"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-white">Crear Nuevo Servicio</h2>
            <ServiceWizard />
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-6 text-white">Mis Servicios</h2>
            <ServiceList />
          </section>
        </main>
      </div>
    </div>
  )
}
