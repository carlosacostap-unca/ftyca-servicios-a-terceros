"use server"

import { auth } from "@/auth"
import { getPocketBaseClient, getPocketBaseAdminClient } from "@/lib/pocketbase"
import { ClientResponseError, type RecordModel } from "pocketbase"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const ServiceSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  category: z.string().optional(),
})

export type Service = {
  id: string
  title: string
  description: string
  category: string
  user: string
  created: string
  updated: string
}

export async function createService(prevState: unknown, formData: FormData) {
  const session = await auth()
  
  if (!session?.user?.pocketbaseId) {
    return { message: "No autenticado o usuario no sincronizado", error: true }
  }

  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
  }

  const validatedFields = ServiceSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      message: "Error de validación",
      errors: validatedFields.error.flatten().fieldErrors,
      error: true
    }
  }

  try {
    const pb = await getPocketBaseAdminClient()
    
    // Note: This requires the 'services' collection to have 'Create' permission set to Public (empty string)
    // AND the 'user' field must be allowed to be set in the create rule.
    await pb.collection("services").create({
      ...validatedFields.data,
      user: session.user.pocketbaseId,
    })

    revalidatePath("/dashboard")
    return { message: "Servicio creado exitosamente", error: false }
  } catch (error: unknown) {
    console.error("Error creating service:", error)
    if (error instanceof ClientResponseError) {
      const apiMessage =
        typeof error.response?.message === "string"
          ? error.response.message
          : error.message
      return { message: apiMessage, error: true }
    }
    if (error instanceof Error) {
      return { message: error.message || "Error al crear el servicio", error: true }
    }
    return { message: "Error al crear el servicio", error: true }
  }
}

export async function getUserServices() {
  const session = await auth()
  
  if (!session?.user?.pocketbaseId) {
    return []
  }

  try {
    const pb = getPocketBaseClient()
    // Note: This requires the 'services' collection to have 'List/Search' permissions set to Public
    // or restricted via custom API rules (e.g., user = @request.query.filter.user)
    const records = await pb.collection("services").getList(1, 50, {
      filter: `user = "${session.user.pocketbaseId}"`,
      sort: '-created',
    })
    
    // Serialize to plain objects
    return records.items.map((record: RecordModel) => ({
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      user: record.user,
      created: record.created,
      updated: record.updated,
    })) as Service[]
  } catch (error) {
    console.error("Error fetching services:", error)
    return []
  }
}
