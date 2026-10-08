import { Coffee, ChefHat, Wallet } from "@phosphor-icons/react";
import { RolUsuario } from "@/types/api";
import { useCrearStaff } from "../hooks";
import { AltaStaffDrawer, type OpcionRol } from "./AltaStaffDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ROLES: OpcionRol[] = [
  { valor: RolUsuario.Mesero, label: "Mesero", detalle: "Toma y envía comandas", icon: Coffee },
  { valor: RolUsuario.Cocina, label: "Cocina", detalle: "Prepara y avanza pedidos", icon: ChefHat },
  { valor: RolUsuario.Caja, label: "Caja", detalle: "Cobra comandas", icon: Wallet },
];

/** Alta de Mesero, Cocina o Caja: rol → nombre → contacto → PIN. */
export function CrearStaffModal({ open, onClose }: Props) {
  const crear = useCrearStaff();
  return (
    <AltaStaffDrawer
      open={open}
      onClose={onClose}
      titulo="Nuevo integrante"
      descripcion="Dale acceso a alguien de tu equipo."
      roles={ROLES}
      guardando={crear.isPending}
      onCrear={({ datos, pin, rol }) =>
        crear.mutateAsync({
          nombre: datos.nombre.trim(),
          apellidoPaterno: datos.paterno.trim(),
          apellidoMaterno: datos.materno.trim() || null,
          telefono: datos.telefono,
          curp: datos.curp || null,
          pin,
          rol: (rol ?? RolUsuario.Mesero) as RolUsuario.Mesero | RolUsuario.Cocina | RolUsuario.Caja,
        })
      }
    />
  );
}
