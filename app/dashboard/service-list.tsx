import { getUserServices } from "@/app/actions/services"

export async function ServiceList() {
  const services = await getUserServices()

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Mis Servicios</h2>
      
      {services.length === 0 ? (
        <p className="text-zinc-500 italic">No has registrado servicios aún.</p>
      ) : (
        <ul className="space-y-4">
          {services.map((service) => (
            <li key={service.id} className="p-4 bg-zinc-800 rounded-md border border-zinc-700 hover:border-zinc-600 transition-colors">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-white text-lg">{service.title}</h3>
                <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full">
                  {service.category}
                </span>
              </div>
              <p className="text-zinc-400 mt-2 text-sm line-clamp-2">
                {service.description || "Sin descripción"}
              </p>
              <div className="mt-3 text-xs text-zinc-500">
                Creado: {new Date(service.created).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
