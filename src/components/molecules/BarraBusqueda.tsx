import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui";

interface Props {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Nombre accesible (por defecto el placeholder). */
  etiqueta?: string;
}

/** Searchbar estándar de las listas (variante soft con lupa), igual en staff, SuperAdmin y portal. */
export function BarraBusqueda({ valor, onChange, placeholder, etiqueta }: Props) {
  return (
    <div className="relative">
      <MagnifyingGlass
        weight='light'
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant"
        aria-hidden
      />
      <Input
        variant="soft"
        type="search"
        aria-label={etiqueta ?? placeholder}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 pl-12"
      />
    </div>
  );
}




