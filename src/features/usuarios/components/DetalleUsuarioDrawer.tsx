import { useState, type ReactNode } from "react";
import { At, Buildings, Copy, File, Key, Pencil, Phone, Power, Warning } from "@phosphor-icons/react";
import { Avatar, Badge, Button, Drawer, Pasos, SkeletonFila } from "@/components/ui";
import { ApiError } from "@/lib/http";
import { rolLabel } from "@/lib/enums";
import { useToast } from "@/components/feedback/useToast";
import type { UsuarioDetalle } from "@/types/api";
import { useDetalleUsuario, useEditarDatosUsuario, useGestionarUsuario } from "../hooks";
import { contactoValido, nombreValido, type DatosPersonales } from "../datosPersonales";
import { CamposContacto, CamposNombre } from "./CamposDatosPersonales";

interface Props {
  open: boolean;
  onClose: () => void;
  usuarioId: string;
  /** Veterinaria del usuario (el SuperAdmin la ve; el Admin no la necesita). */
  veterinariaNombre?: string;
  /** Si viene, muestra "Resetear PIN" (el padre abre su drawer). */
  onResetearPin?: () => void;
}

/**
 * Detalle del usuario con sus datos reales (= UsuarioDetalleDto): usuario copiable, telÃ©fono,
 * CURP enmascarada y veterinaria. Desde aquÃ­ se editan los datos (mismo formulario que el
 * alta), se resetea el PIN y se activa/desactiva.
 */
export function DetalleUsuarioDrawer({ open, onClose, usuarioId, veterinariaNombre, onResetearPin }: Props) {
  const detalle = useDetalleUsuario(open ? usuarioId : null);
  const gestionar = useGestionarUsuario();
  const toast = useToast();
  const [modo, setModo] = useState<"ver" | "editar">("ver");
  const u = detalle.data;

  async function cambiarEstado() {
    if (!u) return;
    try {
      await gestionar.mutateAsync({ usuarioId: u.id, accion: u.activo ? 2 : 1 });
      toast.exito(u.activo ? "Usuario desactivado" : "Usuario activado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado.");
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.exito("Usuario copiado");
    } catch {
      toast.error("No se pudo copiar.");
    }
  }

  function cerrar() {
    setModo("ver");
    onClose();
  }

  const titulo = modo === "editar" ? "Editar datos" : "Detalle del usuario";

  return (
    <Drawer open={open} onClose={cerrar} title={titulo} descripcion={u?.nombre}>
      {detalle.isLoading || !u ? (
        detalle.isError ? (
          <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm text-on-error-container">
            No se pudo cargar el usuario.
          </p>
        ) : (
          <div className="space-y-3">
            <SkeletonFila />
            <SkeletonFila />
          </div>
        )
      ) : modo === "editar" ? (
        <EditarDatos usuario={u} onListo={() => setModo("ver")} />
      ) : (
        <div className="space-y-5">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <Avatar nombre={u.nombre} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-headline-sm font-bold text-on-surface">{u.nombre}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone="primary">{rolLabel[u.rol]}</Badge>
                {!u.activo && <Badge tone="danger">Inactivo</Badge>}
              </div>
            </div>
          </div>

          {/* Usuario (login) */}
          <div className="flex items-center gap-3 rounded-2xl bg-primary-container/10 p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary">
              <At weight='light' className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-label-md font-semibold text-on-surface-variant">Usuario</span>
              <span className="block truncate text-label-lg font-bold text-primary-container">{u.nombreUsuario}</span>
            </span>
            <Button variant="soft" size="icon" onClick={() => copiar(u.nombreUsuario)} aria-label="Copiar usuario">
              <Copy weight='light' className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          {/* Datos */}
          <dl className="divide-y divide-outline-variant/20 rounded-2xl bg-surface-container px-4">
            <Fila icon={<Phone weight='light' className="h-4 w-4" aria-hidden />} label="TelÃ©fono" valor={u.telefono} />
            <Fila icon={<File weight='light' className="h-4 w-4" aria-hidden />} label="CURP" valor={u.curpEnmascarada} vacio="No capturada" />
            {veterinariaNombre && (
              <Fila icon={<Buildings weight='light' className="h-4 w-4" aria-hidden />} label="Veterinaria" valor={veterinariaNombre} />
            )}
          </dl>

          {/* Usuarios creados antes de HU-SA4: faltan datos */}
          {!u.apellidoPaterno && (
            <p className="flex items-start gap-2 rounded-xl bg-warning/10 px-4 py-3 text-body-sm text-[#B45309]">
              <Warning weight='light' className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Faltan apellidos y telÃ©fono. ComplÃ©talos en "Editar datos".
            </p>
          )}

          {/* Acciones */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button variant="soft" size="sm" fullWidth onClick={() => setModo("editar")}>
                  <Pencil weight='light' className="h-4 w-4" aria-hidden />
                  Editar datos
                </Button>
              {onResetearPin && (
                <Button variant="soft" size="sm" fullWidth onClick={onResetearPin}>
                  <Key weight='light' className="h-4 w-4" aria-hidden />
                  Resetear PIN
                </Button>
              )}
            </div>
            <Button
              variant={u.activo ? "warning" : "outline"}
              size="sm"
              fullWidth
              className={u.activo ? undefined : "text-primary"}
              loading={gestionar.isPending}
              onClick={cambiarEstado}
            >
              <Power weight='light' className="h-4 w-4" aria-hidden />
              {u.activo ? "Desactivar acceso" : "Activar acceso"}
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function Fila({ icon, label, valor, vacio = "Sin capturar" }: { icon: ReactNode; label: string; valor: string | null; vacio?: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-on-surface-variant">{icon}</span>
      <dt className="flex-1 text-body-sm text-on-surface-variant">{label}</dt>
      <dd className={valor ? "font-mono text-label-md font-semibold text-on-surface" : "text-body-sm text-on-surface-variant/70"}>
        {valor ?? vacio}
      </dd>
    </div>
  );
}

/** EdiciÃ³n en 2 pasos (libre): nombre y apellidos â†’ telÃ©fono y CURP. El usuario de login no cambia. */
function EditarDatos({ usuario, onListo }: { usuario: UsuarioDetalle; onListo: () => void }) {
  const editar = useEditarDatosUsuario();
  const [datos, setDatos] = useState<DatosPersonales>({
    nombre: usuario.nombres,
    paterno: usuario.apellidoPaterno ?? "",
    materno: usuario.apellidoMaterno ?? "",
    telefono: usuario.telefono ?? "",
    curp: "",
  });
  const [quitarCurp, setQuitarCurp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    try {
      await editar.mutateAsync({
        id: usuario.id,
        body: {
          nombres: datos.nombre.trim(),
          apellidoPaterno: datos.paterno.trim(),
          apellidoMaterno: datos.materno.trim() || null,
          telefono: datos.telefono,
          // null = conservar la actual; "" = quitarla.
          curp: quitarCurp ? "" : datos.curp || null,
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los cambios.");
      throw err;
    }
  }

  const accionCurp = usuario.curpEnmascarada ? (
    <button
      type="button"
      onClick={() => {
        setQuitarCurp((q) => !q);
        setDatos((d) => ({ ...d, curp: "" }));
      }}
      className="text-label-md font-semibold text-on-surface-variant underline-offset-2 hover:underline"
    >
      {quitarCurp ? "Conservar la CURP actual" : "Quitar la CURP"}
    </button>
  ) : null;

  return (
    <Pasos
      libre
      guardando={editar.isPending}
      textoFinal="Guardar cambios"
      textoCompletado="Â¡Datos actualizados!"
      onFinalizar={guardar}
      onCompletado={onListo}
      pasos={[
        { valido: nombreValido(datos), contenido: <CamposNombre datos={datos} onChange={setDatos} /> },
        {
          valido: contactoValido(datos),
          contenido: (
            <div className="space-y-4">
              <CamposContacto
                datos={datos}
                onChange={setDatos}
                curpActual={quitarCurp ? null : usuario.curpEnmascarada}
                accionCurp={accionCurp}
              />
              {quitarCurp && (
                <p className="text-body-sm text-[#B45309]">La CURP se quitarÃ¡ al guardar.</p>
              )}
              {error && (
                <p role="alert" className="rounded-xl bg-error-container/60 px-4 py-3 text-body-sm font-medium text-on-error-container">
                  {error}
                </p>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}


