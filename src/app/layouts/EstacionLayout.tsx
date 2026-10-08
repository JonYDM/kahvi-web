import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LogOut, KeyRound } from "lucide-react";
import { useAuth } from "@/features/auth";
import { rolLabel } from "@/lib/enums";
import { Avatar } from "@/components/ui";
import { CambiarMiPinModal } from "@/features/usuarios";

/**
 * Layout minimal para estaciones de trabajo (Mesero, Cocina, Caja).
 * Sin barra de navegación inferior — cada estación tiene una sola pantalla.
 * El contenido ocupa todo el espacio disponible sin padding extra abajo.
 */
export function EstacionLayout() {
  const { sesion, cerrarSesion } = useAuth();
  const [pinAbierto, setPinAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-dvh bg-crema">
      {/* Header minimal */}
      <header
        className="fixed inset-x-0 top-0 z-40 bg-crema/95 backdrop-blur-sm border-b border-outline-variant/30"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
          {/* Logo Kahvi */}
          <div className="flex items-center gap-2">
            <img src="/vito.png" alt="Vito" className="h-8 w-8 rounded-full object-cover" />
            <span className="font-bold text-cafe-intenso">Kahvi</span>
          </div>

          {/* Perfil + menú */}
          <div className="relative">
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-2 pr-3 hover:bg-surface-container transition-colors"
            >
              <Avatar
                nombre={sesion?.nombre ?? ""}
                className="h-8 w-8 text-xs"
              />
              <div className="hidden sm:block text-left">
                <p className="text-label-sm font-semibold text-on-surface leading-none">
                  {sesion?.nombre?.split(" ")[0]}
                </p>
                <p className="text-[10px] text-on-surface-variant leading-none mt-0.5">
                  {sesion?.rol !== undefined ? rolLabel[sesion.rol] : ""}
                </p>
              </div>
            </button>

            {menuAbierto && (
              <>
                {/* Overlay */}
                <button
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuAbierto(false)}
                  aria-label="Cerrar menú"
                />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl border border-outline-variant/30 bg-crema shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setPinAbierto(true); setMenuAbierto(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <KeyRound className="h-4 w-4 text-on-surface-variant" />
                    Cambiar PIN
                  </button>
                  <div className="border-t border-outline-variant/20" />
                  <button
                    onClick={() => { cerrarSesion(); setMenuAbierto(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-body-sm text-error-st hover:bg-error-container/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido — padding top solo para el header, sin padding bottom extra */}
      <main
        className="mx-auto w-full max-w-2xl px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem)" }}
      >
        <Outlet />
      </main>

      <CambiarMiPinModal open={pinAbierto} onClose={() => setPinAbierto(false)} />
    </div>
  );
}
