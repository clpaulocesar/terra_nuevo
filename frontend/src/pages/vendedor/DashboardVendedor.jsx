import { ClipboardList, ShoppingCart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DashboardVendedor.css';

export default function DashboardVendedor() {
  return <section className="seller-dashboard"><header><span>OPERACIÓN COMERCIAL</span><h1>Panel de vendedor</h1><p>Gestiona ventas en mostrador, pedidos y atención a clientes desde un solo lugar.</p></header><div className="seller-dashboard__actions"><Link to="/vendedor/ventas"><ShoppingCart size={21} /><div><b>Nueva venta</b><small>Registra una venta directa</small></div></Link><Link to="/vendedor/pedidos"><ClipboardList size={21} /><div><b>Consultar pedidos</b><small>Revisa el estado de los pedidos</small></div></Link><Link to="/vendedor/clientes"><Users size={21} /><div><b>Buscar clientes</b><small>Consulta y registra clientes</small></div></Link></div><section className="seller-dashboard__guide"><h2>Accesos de tu rol</h2><p>Como vendedor puedes realizar ventas directas, atender clientes y consultar pedidos. La configuración de productos, categorías, personal y reportes se administra desde el portal de administración.</p></section></section>;
}
