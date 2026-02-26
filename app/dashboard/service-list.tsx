"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

export function ServiceList() {
  const pb = useMemo(() => getPocketBaseClient(), [])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const escapeHtml = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  const renderMarkdown = (value: string) => {
    const segments = value.split(/```/)
    return segments
      .map((segment, index) => {
        if (index % 2 === 1) {
          const code = escapeHtml(segment.trim())
          return `<pre><code>${code}</code></pre>`
        }
        let html = escapeHtml(segment)
        html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>")
        html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>")
        html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>")
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        html = html.replace(/\*(?!\*)([^*]+?)\*(?!\*)/g, "<em>$1</em>")
        html = html.replace(/`([^`]+)`/g, "<code>$1</code>")
        html = html.replace(/^[-*]\s+/gm, "• ")
        html = html.replace(/\n/g, "<br />")
        return html
      })
      .join("")
  }

  const loadServices = useCallback(async () => {
    const model = pb.authStore.model as { id?: string } | null
    if (!model?.id) {
      setServices([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const records = await pb.collection("services").getList(1, 50, {
        filter: `user = "${model.id}"`,
        sort: "-created",
        $autoCancel: false,
      })
      const mapped = records.items.map((record) => ({
        id: record.id,
        title: record.title,
        description: record.description,
        category: record.category,
        user: record.user,
        created: record.created,
        updated: record.updated,
      })) as Service[]
      setServices(mapped)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudieron cargar los servicios"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [pb])

  useEffect(() => {
    loadServices()
    const handleRefresh = () => loadServices()
    window.addEventListener("services:updated", handleRefresh)
    const unsubscribe = pb.authStore.onChange(() => loadServices())
    return () => {
      window.removeEventListener("services:updated", handleRefresh)
      unsubscribe()
    }
  }, [loadServices, pb])

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Mis Servicios</h2>
      
      {isLoading ? (
        <p className="text-zinc-500 italic">Cargando servicios...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : services.length === 0 ? (
        <p className="text-zinc-500 italic">No has registrado servicios aún.</p>
      ) : (
        <ul className="space-y-4">
          {services.map((service) => (
            <li key={service.id}>
              <Link
                href={`/dashboard/services/${service.id}`}
                className="block p-4 bg-zinc-800 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-white text-lg">{service.title}</h3>
                  <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                    {service.category}
                  </span>
                </div>
                <div
                  className="text-zinc-400 mt-2 text-sm line-clamp-2"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(
                      service.description?.trim() ? service.description : "Sin descripción"
                    ),
                  }}
                />
                <div className="mt-3 text-xs text-zinc-500">
                  Creado: {new Date(service.created).toLocaleDateString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
