import type { ReactNode } from "react";
import { At } from "@phosphor-icons/react";
import { Input } from "@/components/ui";
import {
  curpInvalida,
  normalizarCurp,
  normalizarTelefono,
  usuarioSugerido,
  type DatosPersonales,
} from "../datosPersonales";

interface Props {
  datos: DatosPersonales;
  onChange: (d: DatosPersonales) => void;
}

/** Paso "Nombre": nombre(s) + apellidos, con vista previa del usuario si se pide. */
export function CamposNombre({ datos, onChange, mostrarUsuario = false }: Props & { mostrarUsuario?: boolean }) {
  const set = (k: keyof DatosPersonales) => (v: string) => onChange({ ...datos, [k]: v.slice(0, 80) });
  const sugerido = mostrarUsuario ? usuarioSugerido(datos.nombre, datos.paterno) : null;
  return (
    <div className="space-y-4">
      <Input
        label="Nombre(s)"
        value={datos.nombre}
        onChange={(e) => set("nombre")(e.target.value)}
        autoComplete="given-name"
        autoFocus
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Apellido paterno"
          value={datos.paterno}
          onChange={(e) => set("paterno")(e.target.value)}
          autoComplete="family-name"
          required
        />
        <Input label="Materno (opcional)" value={datos.materno} onChange={(e) => set("materno")(e.target.value)} />
      </div>
      {sugerido && (
        <p className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-3 text-body-sm text-on-surface-variant">
          <At weight='light' className="h-4 w-4 shrink-0 text-primary-container" aria-hidden />
          <span>
            Su usuario será <strong className="font-bold text-on-surface">{sugerido}</strong>
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Paso "Contacto": teléfono + CURP opcional. En edición, `curpActual` muestra la CURP
 * enmascarada y el campo vacío significa "conservarla"; `accionCurp` permite quitarla.
 */
export function CamposContacto({
  datos,
  onChange,
  curpActual,
  accionCurp,
}: Props & { curpActual?: string | null; accionCurp?: ReactNode }) {
  const invalida = curpInvalida(datos.curp);
  const hintCurp = curpActual ? `Actual: ${curpActual}. Déjala vacía para conservarla.` : "18 caracteres";
  return (
    <div className="space-y-4">
      <Input
        label="Teléfono"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={datos.telefono}
        onChange={(e) => onChange({ ...datos, telefono: normalizarTelefono(e.target.value) })}
        hint="10 dígitos"
        required
      />
      <div className="space-y-1.5">
        <Input
          label={curpActual ? "Nueva CURP (opcional)" : "CURP (opcional)"}
          value={datos.curp}
          onChange={(e) => onChange({ ...datos, curp: normalizarCurp(e.target.value) })}
          autoCapitalize="characters"
          spellCheck={false}
          error={invalida ? "Revisa el formato (18 caracteres)." : undefined}
          hint={invalida ? undefined : hintCurp}
        />
        {accionCurp}
      </div>
    </div>
  );
}






