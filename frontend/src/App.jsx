import { CarritoProvider } from './context/CarritoContext.jsx';
import { ClienteProvider } from './context/ClienteContext.jsx';
import { SesionClienteProvider } from './context/SesionClienteContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <SesionClienteProvider><ClienteProvider><CarritoProvider><AppRoutes /></CarritoProvider></ClienteProvider></SesionClienteProvider>
  );
}
