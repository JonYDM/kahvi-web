import { Providers } from "./providers";
import { AppRouter } from "./router";

/** Raíz de la aplicación: providers globales + router. */
export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}


