"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getPocketBaseClient } from "@/lib/pocketbase"

type Service = {
  id: string
  title: string
  description: string
  category: string
  user: string
  created: string
  updated: string
}

export default function ServiceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const pb = useMemo(() => getPocketBaseClient(), [])
  const serviceId = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id),
    [params]
  )
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadService = useCallback(
    async (userId: string, id: string) => {
      setIsLoading(true)
      setError("")
      try {
        const record = await pb
          .collection("services")
          .getOne(id, { $autoCancel: false })
        if (record.user !== userId) {
          setError("No tienes permiso para ver este servicio")
          setService(null)
          return
        }
        setService({
          id: record.id,
          title: record.title,
          description: record.description,
          category: record.category,
          user: record.user,
          created: record.created,
          updated: record.updated,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "No se pudo cargar el servicio"
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [pb]
  )

  useEffect(() => {
    const model = pb.authStore.model as { id?: string } | null
    if (!model?.id) {
      router.replace("/")
      return
    }
    if (!serviceId) {
      return
    }
    loadService(model.id, serviceId)
  }, [loadService, pb, router, serviceId])

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Detalle del servicio</h1>
            <p className="text-zinc-400 text-sm">
              Información completa del servicio registrado
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {serviceId && (
              <Link
                href={`/dashboard/services/${serviceId}/edit`}
                className="rounded-lg bg-blue-600/20 text-blue-200 px-4 py-2 text-sm font-medium hover:bg-blue-600/30 transition-colors border border-blue-500/30"
              >
                Editar
              </Link>
            )}
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-800/60 text-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-700/60 transition-colors border border-zinc-700"
            >
              Volver al panel
            </Link>
          </div>
        </header>

        {!serviceId ? (
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <p className="text-red-500 text-sm">
              No se encontró el servicio solicitado
            </p>
          </div>
        ) : isLoading ? (
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <p className="text-zinc-500 italic">Cargando servicio...</p>
          </div>
        ) : error ? (
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : service ? (
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{service.title}</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Creado: {new Date(service.created).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs bg-zinc-700 text-zinc-300 px-3 py-1 rounded-full self-start">
                {service.category}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Descripción</h3>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                {service.description || "Sin descripción"}
              </p>
            </div>

            <div className="text-xs text-zinc-500">
              Última actualización: {new Date(service.updated).toLocaleDateString()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
