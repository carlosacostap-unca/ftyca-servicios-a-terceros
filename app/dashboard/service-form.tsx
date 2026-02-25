"use client"

import { useMemo, useState } from "react"
import { getPocketBaseClient } from "@/lib/pocketbase"

const initialState = {
  message: "",
  error: false,
  errors: {} as Record<string, string[]>
}

export function ServiceForm({ initialData }: { initialData?: { title: string, description: string, category: string } }) {
  const pb = useMemo(() => getPocketBaseClient(), [])
  const [state, setState] = useState(initialState)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)
    setState(initialState)
    const formData = new FormData(event.currentTarget)
    const title = String(formData.get("title") || "").trim()
    const category = String(formData.get("category") || "")
    const description = String(formData.get("description") || "")

    if (title.length < 3) {
      setState({
        message: "Error de validación",
        error: true,
        errors: { title: ["El título debe tener al menos 3 caracteres"] },
      })
      setIsPending(false)
      return
    }

    const model = pb.authStore.model as { id?: string } | null
    if (!model?.id) {
      setState({
        message: "No autenticado",
        error: true,
        errors: {},
      })
      setIsPending(false)
      return
    }

    try {
      await pb.collection("services").create({
        title,
        category,
        description,
        user: model.id,
      })
      window.dispatchEvent(new Event("services:updated"))
      setState({
        message: "Servicio guardado correctamente",
        error: false,
        errors: {},
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear el servicio"
      setState({
        message,
        error: true,
        errors: {},
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Nuevo Servicio</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-400 mb-1">
            Título
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={initialData?.title}
            className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej: Consultoría en IA"
          />
          {state.errors?.title && (
            <p className="text-red-500 text-sm mt-1">{state.errors.title[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-400 mb-1">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialData?.category || "Consultoría"}
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
          <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initialData?.description}
            className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe el servicio..."
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Guardando..." : "Guardar Servicio"}
        </button>

        {state.message && (
          <p className={`text-sm mt-2 ${state.error ? "text-red-500" : "text-green-500"}`}>
            {state.message}
          </p>
        )}
      </form>
    </div>
  )
}
