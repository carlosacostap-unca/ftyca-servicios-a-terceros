"use client"

import { useChat } from "@ai-sdk/react"
import { ServiceForm } from "./service-form"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import type { UIMessage, UIDataTypes } from "ai"

export function ServiceWizard() {
  type DraftTool = {
    input: { title: string; category: string; description: string }
    output: { title: string; category: string; description: string; status: string }
  }
  type Tools = { generateServiceDraft: DraftTool }
  type DraftMessage = UIMessage<unknown, UIDataTypes, Tools>

  const { messages, sendMessage, status } = useChat<DraftMessage>()
  
  const [input, setInput] = useState("")
  const isLoading = status === "streaming"

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput("")
  }
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  type DraftToolPart = Extract<DraftMessage["parts"][number], { type: "tool-generateServiceDraft" }>

  const isDraftToolPart = useCallback(
    (part: DraftMessage["parts"][number]): part is DraftToolPart =>
      part.type === "tool-generateServiceDraft",
    []
  )

  const getMessageText = (message: DraftMessage) => {
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("")
  }

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

  const extractDraft = (value: unknown) => {
    if (!value || typeof value !== "object") return null
    const maybeDraft = value as { title?: unknown; category?: unknown; description?: unknown }
    if (typeof maybeDraft.title !== "string") return null
    if (typeof maybeDraft.category !== "string") return null
    if (typeof maybeDraft.description !== "string") return null
    return {
      title: maybeDraft.title,
      category: maybeDraft.category,
      description: maybeDraft.description,
    }
  }

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const latestDraftPart = useMemo(
    () =>
      [...messages]
        .reverse()
        .flatMap((message) => message.parts)
        .find(
          (part) =>
            isDraftToolPart(part) && part.state === "output-available"
        ) ?? null,
    [messages, isDraftToolPart]
  )

  const draft = useMemo(
    () => (latestDraftPart ? extractDraft(latestDraftPart.output) : null),
    [latestDraftPart]
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chat Section */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col h-[600px]">
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-blue-500">✨</span> Asistente IA
          </h2>
          <p className="text-xs text-zinc-400">Describe tu servicio y te ayudaré a redactarlo.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 py-10">
              <p>👋 ¡Hola! Soy tu asistente.</p>
              <p className="text-sm mt-2">Cuéntame qué servicio quieres ofrecer (ej. &quot;Doy clases de Python&quot; o &quot;Hacemos análisis de agua&quot;).</p>
            </div>
          )}
          
          {messages.map((m) => {
            const messageText = getMessageText(m)
            return (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                {messageText &&
                  (m.role === "assistant" ? (
                    <div
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(messageText),
                      }}
                    />
                  ) : (
                    <p>{messageText}</p>
                  ))}
                {m.parts
                  .filter(isDraftToolPart)
                  .map((part) => (
                    <div
                      key={part.toolCallId}
                      className="mt-2 text-xs bg-zinc-950/50 p-2 rounded border border-zinc-700 text-green-400"
                    >
                      {part.state === "output-available"
                        ? "✅ Borrador generado/actualizado"
                        : part.state === "output-error"
                        ? "⚠️ Error al generar borrador"
                        : "⚙️ Generando borrador..."}
                    </div>
                  ))}
              </div>
            </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800 bg-zinc-950/50">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe aquí..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>

      {/* Form Section */}
      <div className="relative">
        {draft ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="mb-4 bg-blue-900/20 border border-blue-800 text-blue-200 px-4 py-3 rounded-md text-sm">
                💡 He completado el formulario con la información. Puedes editarlo manualmente o pedirme más cambios en el chat.
             </div>
             <ServiceForm key={latestDraftPart?.toolCallId || "draft"} initialData={draft} />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed">
            <div className="text-center text-zinc-500 px-6">
              <div className="text-4xl mb-3 opacity-20">📝</div>
              <p>El formulario se completará automáticamente</p>
              <p className="text-sm">cuando tengamos suficiente información.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
