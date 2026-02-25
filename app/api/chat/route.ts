import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, tool, stepCountIs, zodSchema } from 'ai';
import type { UIMessage, UIDataTypes, UITools } from "ai";
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Polyfill 'parts' for ai@6 compatibility if missing
  const safeMessages = Array.isArray(messages) ? messages : [];
  type SafeMessage = Omit<UIMessage<unknown, UIDataTypes, UITools>, "id">;
  const fixedMessages = safeMessages.flatMap((message): SafeMessage[] => {
    const messageObj =
      message && typeof message === "object"
        ? (message as Record<string, unknown>)
        : {};
    const role = messageObj.role;
    if (role !== "system" && role !== "user" && role !== "assistant") {
      return [];
    }
    const parts = Array.isArray(messageObj.parts)
      ? messageObj.parts
      : typeof messageObj.content === "string"
      ? [{ type: "text", text: messageObj.content }]
      : [];
    return [
      {
        ...messageObj,
        parts,
        role,
      } as SafeMessage,
    ];
  });

  const modelMessages = await convertToModelMessages(fixedMessages);

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    stopWhen: stepCountIs(5),
    system: `Eres un asistente experto ayudando a investigadores de la Facultad de Tecnología y Ciencias Aplicadas a definir sus "Servicios a Terceros".
    Tu objetivo es obtener la siguiente información para completar un formulario:
    1. Título del servicio (claro y profesional).
    2. Categoría (Opciones válidas: Consultoría, Capacitación, Laboratorio, Desarrollo, Otro).
    3. Descripción detallada (qué incluye, entregables, metodología breve).

    Instrucciones:
    - Saluda amablemente y pregunta qué tipo de servicio quieren ofrecer.
    - Haz UNA pregunta a la vez para no abrumar.
    - Si la descripción es muy corta, pide más detalles amablemente.
    - Sugiere mejoras si el título suena poco profesional.
    - Cuando tengas TODA la información (Título, Categoría y Descripción), LLAMA INMEDIATAMENTE a la herramienta "generateServiceDraft".
    - NO pidas confirmación final ("¿Quieres que genere el borrador?"), simplemente hazlo cuando tengas los datos.
    - Mantén un tono profesional pero cercano.`,
    messages: modelMessages,
    tools: {
      generateServiceDraft: tool({
        description: 'Genera el borrador del servicio una vez que se han recolectado todos los datos necesarios.',
        inputSchema: zodSchema(z.object({
          title: z.string().describe('El título final y profesional del servicio.'),
          category: z.enum(['Consultoría', 'Capacitación', 'Laboratorio', 'Desarrollo', 'Otro']).describe('La categoría del servicio.'),
          description: z.string().describe('La descripción completa y detallada del servicio.'),
        })),
        execute: async ({ title, category, description }: { title: string, category: string, description: string }) => {
          return { title, category, description, status: 'drafted' };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
