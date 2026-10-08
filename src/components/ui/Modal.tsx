/**
 * Modal ahora es un alias del Drawer responsivo (Vaul en móvil / Dialog en escritorio,
 * sin botón X, cierre por arrastre u overlay). Se mantiene el nombre `Modal` para no
 * tocar los ~16 formularios que ya lo importan; todos heredan el nuevo comportamiento.
 */
export { Drawer as Modal } from "./Drawer";


