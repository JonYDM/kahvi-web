import { type ReactNode, useState } from "react";
import { NavLink } from "react-router-dom";
import { Check, ChevronDown, KeyRound, LogOut, MapPin, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth";
import { rolLabel } from "@/lib/enums";
import { saludoPorHora } from "@/lib/saludo";
import { RolUsuario } from "@/types/api";
import { type NavItem } from "@/app/navigation";
import { usePermisos } from "@/lib/usePermisos";
import { Avatar } from "@/components/ui";
import { CambiarMiPinModal } from "@/features/usuarios";
import { HeaderTituloContext, useHeaderTitulo } from "./headerTitulo";

interface AppShellProps {
  nav: NavItem[];
  titulo: string;
  children: ReactNode;
}

/** Provider del estado del collapsing header. */
function HeaderTituloProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{
    titulo: string | null;
    subtitulo: ReactNode;
    accion: ReactNode;
    tituloSuave: boolean;
  }>({ titulo: null, subtitulo: null, accion: null, tituloSuave: false });
  const [colapsado, setColapsado] = useState(false);

  const registrar = (v: { titulo: string | null; subtitulo?: ReactNode; accion?: ReactNode; tituloSuave?: boolean }) =>
    setEstado({
      titulo: v.titulo,
      subtitulo: v.subtitulo ?? null,
      accion: v.accion ?? null,
      tituloSuave: v.tituloSuave ?? false,
    });

  return (
    <HeaderTituloContext.Provider
      value={{ ...estado, colapsado, registrar, setColapsado }}
    >
      {children}
    </HeaderTituloContext.Provider>
  );
}

export function AppShell({ nav, children }: AppShellProps) {
  return (
    <HeaderTituloProvider>
      <AppShellInterno nav={nav}>{children}</AppShellInterno>
    </HeaderTituloProvider>
  );
}

function AppShellInterno({ nav, children }: { nav: NavItem[]; children: ReactNode }) {
  const { sesion, cerrarSesion } = useAuth();
  const p = usePermisos();
  const items = nav.filter((i) => i.permiso === null || p(i.permiso));
  const primarios = items.filter((i) => !i.secundario);
  const secundarios = items.filter((i) => i.secundario);
  const [pinAbierto, setPinAbierto] = useState(false);
  const { titulo, subtitulo, accion } = useHeaderTitulo();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-white via-[#FAF6F0] to-[#F0E8DC]">
      {/* HEADER */}
      <header
        className="fixed inset-x-0 top-0 z-40 bg-crema/95 backdrop-blur-sm border-b border-outline-variant/30"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto w-[90%] max-w-2xl">
          <div className="flex h-14 items-center justify-between gap-3">
            {/* Izquierda: Vito + Kahvi */}
            <div className="flex min-w-0 items-center gap-2.5">
              {sesion && <ContextoHeader rol={sesion.rol} />}
            </div>
            {/* Derecha: perfil */}
            <div className="flex shrink-0 items-center gap-1">
              {sesion && (
                <PerfilMenu
                  nombre={sesion.nombre}
                  rol={sesion.rol}
                  onPin={() => setPinAbierto(true)}
                  onSalir={cerrarSesion}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        className="mx-auto w-[90%] max-w-2xl pb-32"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)" }}
      >
        {(subtitulo || accion || titulo) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {subtitulo && <div className="mb-1">{subtitulo}</div>}
              <h1 className="text-headline-lg-mobile font-bold tracking-tight text-cafe-intenso">
                {titulo}
              </h1>
            </div>
            {accion && <div className="shrink-0">{accion}</div>}
          </div>
        )}
        {children}
      </main>

      {/* BOTTOM-NAV — flotante */}
      <nav aria-label="Navegación principal" className="fixed inset-x-4 bottom-4 z-40"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      >
        <div
          className="flex items-center justify-around gap-1 rounded-2xl bg-[#FAF6F0]/95 px-2 py-2 backdrop-blur-xl"
          style={{
            boxShadow: "0 4px 24px -4px rgba(43,31,25,0.14), 0 1px 4px -1px rgba(43,31,25,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {primarios.map((item) => {
            const esInicio = item.to === "/app" || item.to === "/admin";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.split("/").length <= 2}
                className="flex flex-1 flex-col items-center"
              >
                {({ isActive }) =>
                  esInicio ? (
                    /* Botón central elevado — sobresale del nav como app nativa */
                    <span className="-mt-5 flex flex-col items-center gap-1">
                      <span
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                          isActive
                            ? "bg-cafe-intenso text-crema scale-110"
                            : "bg-cafe-intenso text-crema",
                        )}
                        style={{
                          boxShadow: isActive
                            ? "0 8px 24px -4px rgba(43,31,25,0.45), 0 2px 8px -2px rgba(43,31,25,0.25)"
                            : "0 4px 16px -4px rgba(43,31,25,0.30), 0 2px 6px -2px rgba(43,31,25,0.15)",
                        }}
                      >
                        <item.icon className="h-6 w-6" aria-hidden />
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold transition-colors",
                        isActive ? "text-cafe-intenso" : "text-on-surface-variant",
                      )}>
                        {item.label}
                      </span>
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-full py-1 text-[9px] font-semibold transition-colors",
                        isActive ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-full transition-colors",
                          isActive && "bg-primary-container/10",
                        )}
                      >
                        <item.icon className="h-[18px] w-[18px]" aria-hidden />
                      </span>
                      <span className="truncate px-0.5">{item.label}</span>
                    </span>
                  )
                }
              </NavLink>
            );
          })}

          {secundarios.length > 0 && <MenuMas items={secundarios} />}
        </div>
      </nav>

      <CambiarMiPinModal open={pinAbierto} onClose={() => setPinAbierto(false)} />
    </div>
  );
}

/** Popover con Vito saludando. */
function VitoPopover() {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Vito"
        aria-expanded={abierto}
        className="rounded-full transition-transform active:scale-95"
      >
        <img src="/vito.png" alt="Vito" className="h-8 w-8 rounded-full object-contain" />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-52 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-center shadow-lift">
            <img src="/vito.png" alt="Vito" className="mx-auto h-14 w-14 object-contain" />
            <p className="mt-1 font-marca text-base font-extrabold text-cafe-intenso">
              ¡{saludoPorHora()}!
            </p>
            <p className="mt-0.5 text-body-sm leading-snug text-on-surface-variant">
              Soy Vito, ¡qué gusto verte!
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Contenido izquierdo del header. */
function ContextoHeader({ rol }: { rol: RolUsuario }) {
  if (rol === RolUsuario.Administrador) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <VitoPopover />
        <SelectorSucursal />
      </div>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <VitoPopover />
      <span className="truncate font-marca text-headline-sm font-extrabold text-cafe-intenso">Kahvi</span>
    </div>
  );
}

const SUCURSALES_MOCK = [
  { id: "1", nombre: "Kahvi", zona: "Principal" },
];

/** Selector de sucursal (Administrador). */
function SelectorSucursal() {
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(SUCURSALES_MOCK[0]);

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-surface-container"
      >
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-marca text-headline-sm font-extrabold text-cafe-intenso">Kahvi</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
            <span className="truncate">{activa.zona}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 transition-transform", abierto && "rotate-180")}
              aria-hidden
            />
          </span>
        </span>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-lift">
            <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Tus sucursales
            </p>
            {SUCURSALES_MOCK.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiva(s); setAbierto(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-surface-container"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-container text-primary-container">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label-lg font-semibold text-on-surface">{s.zona}</span>
                  <span className="block text-body-sm text-on-surface-variant">{s.nombre}</span>
                </span>
                {s.id === activa.id && <Check className="h-4 w-4 text-primary-container" aria-hidden />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Botón "Más" del bottom-nav. */
function MenuMas({ items }: { items: NavItem[] }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="flex flex-1 flex-col items-center">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Más opciones"
        aria-expanded={abierto}
        className={cn(
          "flex flex-col items-center gap-0.5 rounded-full py-1 text-[9px] font-semibold transition-colors",
          abierto ? "text-primary-container" : "text-on-surface-variant hover:text-on-surface",
        )}
      >
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-full transition-colors",
            abierto && "bg-primary-container/10",
          )}
        >
          <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <span>Más</span>
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-56 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-lift">
            <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              Más módulos
            </p>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setAbierto(false)}
                className={({ isActive }) =>
                  cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-label-md font-medium transition-colors",
                    isActive
                      ? "bg-primary-container/10 text-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Menú de perfil del header. */
function PerfilMenu({
  nombre,
  rol,
  onPin,
  onSalir,
}: {
  nombre: string;
  rol: RolUsuario;
  onPin: () => void;
  onSalir: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Perfil"
        className="rounded-full p-0.5 transition-colors hover:bg-surface-container"
      >
        <Avatar nombre={nombre} size="sm" />
      </button>
      {abierto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-1.5 shadow-lift">
            <div className="flex items-center gap-2.5 px-2 py-2">
              <Avatar nombre={nombre} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-label-lg font-semibold text-on-surface">{nombre}</p>
                <p className="text-body-sm text-on-surface-variant">{rolLabel[rol]}</p>
              </div>
            </div>
            <div className="my-1 h-px bg-outline-variant/30" />
            <button
              onClick={() => { setAbierto(false); onPin(); }}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-label-md font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              Cambiar mi PIN
            </button>
            <button
              onClick={onSalir}
              className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-label-md font-medium text-error-st transition-colors hover:bg-error-container/40"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
