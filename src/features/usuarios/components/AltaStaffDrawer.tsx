import { useState } from "react";
import { AtSign, Check, Copy, type LucideIcon } from "lucide-react";
import { Button, Drawer, Input, Pasos, type Paso } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/feedback/useToast";
import type { RolUsuario, UsuarioCreado } from "@/types/api";
import { contactoValido, DATOS_VACIOS, nombreValido, type DatosPersonales } from "../datosPersonales";
import { CamposContacto, CamposNombre } from "./CamposDatosPersonales";

export interface OpcionRol {
  valor: RolUsuario;
  label: string;
  detalle: string;
  icon: LucideIcon;
}

export interface AltaStaffPayload {
  datos: DatosPersonales;
  pin: string;
  rol: RolUsuario | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  /** Si viene, el primer paso es elegir el rol (alta de Vet/Recep). */
  roles?: OpcionRol[];
  guardando: boolean;
  onCrear: (payload: AltaStaffPayload) => Promise<UsuarioCreado>;
}

/**
 * Alta de staff en pasos cortos: [rol] → nombre y apellidos → contacto → PIN.
 * El usuario lo genera el backend (nombre.apellidopaterno) y se muestra al final con Copiar.
 */
export function AltaStaffDrawer({ open, onClose, titulo, descripcion, roles, guardando, onCrear }: Props) {
  const toast = useToast();
  const [rol, setRol] = useState<RolUsuario | null>(roles?.[0]?.valor ?? null);
  const [datos, setDatos] = useState<DatosPersonales>(DATOS_VACIOS);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<UsuarioCreado | null>(null);

  // El drawer puede quedar montado entre aperturas: al cerrar se limpia todo.
  function cerrar() {
    setRol(roles?.[0]?.valor ?? null);
    setDatos(DATOS_VACIOS);
    setPin("");
    setError(null);
    setCreado(null);
    onClose();
  }

  async function guardar() {
    setError(null);
    try {
      setCreado(await onCrear({ datos, pin, rol }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el usuario.");
      throw err;
    }
  }

  async function copiarUsuario() {
    if (!creado) return;
    try {
      await navigator.clipboard.writeText(creado.nombreUsuario);
      toast.exito("Usuario copiado");
    } catch {
      toast.error("No se pudo copiar; anótalo a mano.");
    }
  }

  const pasos: Paso[] = [];
  if (roles?.length) {
    pasos.push({
      contenido: (
        <div>
          <p className="mb-1.5 text-label-md font-semibold text-on-surface-variant">Rol</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((r) => {
              const activo = rol === r.valor;
              return (
                <button
                  key={r.valor}
                  type="button"
                  onClick={() => setRol(r.valor)}
                  aria-pressed={activo}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors",
                    activo
                      ? "border-primary-container bg-primary-container/10 text-primary-container"
                      : "border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant",
                  )}
                >
                  <r.icon className="h-5 w-5" aria-hidden />
                  <span className="text-label-md font-bold">{r.label}</span>
                  <span className="text-body-sm opacity-80">{r.detalle}</span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    });
  }
  pasos.push(
    { valido: nombreValido(datos), contenido: <CamposNombre datos={datos} onChange={setDatos} mostrarUsuario /> },
    { valido: contactoValido(datos), contenido: <CamposContacto datos={datos} onChange={setDatos} /> },
    {
      valido: pin.length === 6,
      contenido: (
        <div className="space-y-4">
          <Input
            label="PIN de acceso"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            hint="6 dígitos. Si lo olvida, se le puede resetear."
            required
          />
          {error && (
            <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container">
              {error}
            </p>
          )}
        </div>
      ),
    },
  );

  return (
    <Drawer open={open} onClose={cerrar} title={creado ? "Usuario creado" : titulo} descripcion={descripcion}>
      {creado ? (
        <div className="flex flex-col items-center gap-5 pt-2 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
            <Check className="h-9 w-9" strokeWidth={3} aria-hidden />
          </span>
          <div className="space-y-1">
            <p className="text-headline-sm font-bold text-on-surface">{creado.nombreCompleto}</p>
            <p className="text-body-md text-on-surface-variant">
              Entrégale su usuario y el PIN que capturaste para que entre a Kahvi.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl bg-primary-container/10 p-4 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary">
              <AtSign className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label-md font-semibold text-on-surface-variant">Usuario</span>
              <span className="block truncate text-headline-sm font-bold text-primary-container">
                {creado.nombreUsuario}
              </span>
            </span>
            <Button variant="soft" size="icon" onClick={copiarUsuario} aria-label="Copiar usuario">
              <Copy className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <Button fullWidth onClick={cerrar}>
            Listo
          </Button>
        </div>
      ) : (
        <Pasos guardando={guardando} textoFinal="Crear usuario" onFinalizar={guardar} pasos={pasos} />
      )}
    </Drawer>
  );
}
