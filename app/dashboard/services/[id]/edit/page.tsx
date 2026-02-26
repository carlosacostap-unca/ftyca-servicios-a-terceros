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

export default function ServiceEditPage() {
  const router = useRouter()
  const params = useParams()
  const pb = useMemo(() => getPocketBaseClient(), [])
  const serviceId = useMemo(
    () => (Array.isArray(params?.id) ? params.id[0] : params?.id),
    [params]
  )
  const [service, setService] = useState<Service | null>(null)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Consultoría")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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
          setError("No tienes permiso para editar este servicio")
          setService(null)
          return
        }
        const loaded = {
          id: record.id,
          title: record.title,
          description: record.description,
          category: record.category,
          user: record.user,
          created: record.created,
          updated: record.updated,
        }
        setService(loaded)
        setTitle(loaded.title)
        setCategory(loaded.category || "Consultoría")
        setDescription(loaded.description || "")
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!serviceId) return
    if (title.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres")
      return
    }
    setIsSaving(true)
    setError("")
    try {
      await pb.collection("services").update(serviceId, {
        title: title.trim(),
        category,
        description,
      })
      router.replace(`/dashboard/services/${serviceId}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar el servicio"
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Editar servicio</h1>
            <p className="text-zinc-400 text-sm">
              Actualiza la información del servicio
            </p>
          </div>
          <Link
            href={serviceId ? `/dashboard/services/${serviceId}` : "/dashboard"}
            className="rounded-lg bg-zinc-800/60 text-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-700/60 transition-colors border border-zinc-700"
          >
            Volver
          </Link>
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
          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zinc-400 mb-1"
                >
                  Título
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-zinc-400 mb-1"
                >
                  Categoría
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Consultoría">Consultoría</option>
                  <option value="Capacitación">Capacitación</option>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-zinc-400 mb-1"
                >
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}
