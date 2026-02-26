"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { getPocketBaseClient } from "@/lib/pocketbase"

export default function Home() {
  const router = useRouter()
  const pb = useMemo(() => getPocketBaseClient(), [])
  const [error, setError] = useState("")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const syncAuth = () => {
      if (pb.authStore.isValid) {
        router.replace("/dashboard")
        return
      }
      setIsReady(true)
    }

    syncAuth()
    const unsubscribe = pb.authStore.onChange(() => syncAuth())
    return () => unsubscribe()
  }, [pb, router])

  const handleGoogleLogin = () => {
    setError("")
    pb.collection("users")
      .authWithOAuth2({ provider: "google" })
      .then(() => router.replace("/dashboard"))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Error al iniciar sesión con Google"
        setError(message)
      })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <Image
            src="/logo_ftyca.png"
            alt="Facultad de Tecnología y Ciencias Aplicadas"
            width={320}
            height={320}
            className="mx-auto max-h-64 w-auto h-auto object-contain"
            priority
          />
          <p className="mx-auto max-w-[700px] text-zinc-400 md:text-xl">
            Gestión de Servicios a Terceros
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!isReady}
            className="flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
              <path d="M1 1h22v22H1z" fill="none" />
            </svg>
            Iniciar sesión con Google
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  )
}
