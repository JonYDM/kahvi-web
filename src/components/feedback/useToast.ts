import toast from "react-hot-toast";

/**
 * API de toasts estable de la app (envuelve react-hot-toast). Mantener esta
 * fachada permite cambiar la librería sin tocar los consumidores.
 */
export function useToast() {
  return {
    exito: (mensaje: string) => toast.success(mensaje),
    error: (mensaje: string) => toast.error(mensaje),
    info: (mensaje: string) => toast(mensaje),
    mostrar: (mensaje: string) => toast(mensaje),
  };
}




