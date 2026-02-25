import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { ServiceWizard } from "./service-wizard"
import { ServiceList } from "./service-list"

export default async function Dashboard() {
  const session = await auth()
  if (!session) return redirect("/")

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-zinc-400 mt-2">
              Bienvenido, {session.user?.name || "Usuario"}
            </p>
          </div>
          
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-red-600/10 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-600/20 transition-colors cursor-pointer border border-red-600/20"
            >
              Cerrar sesión
            </button>
          </form>
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
