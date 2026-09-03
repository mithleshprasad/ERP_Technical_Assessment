import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, ShoppingCart, PlusCircle, UploadCloud, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
const linkClass = ({ isActive }) =>
  `${linkBase} ${
    isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
  }`;

function Sidebar() {
  const { user } = useAuth();
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-950">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Layers size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Mini ERP</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Order & Inventory</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Overview</p>
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Catalog</p>
        <NavLink to="/products" end className={linkClass}>
          <Package size={18} /> Products
        </NavLink>
        <NavLink to="/inventory" className={linkClass}>
          <Boxes size={18} /> Inventory
        </NavLink>
        {canManage && (
          <NavLink to="/products/import" className={linkClass}>
            <UploadCloud size={18} /> Bulk Import
          </NavLink>
        )}

        <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Sales</p>
        <NavLink to="/orders/new" className={linkClass}>
          <PlusCircle size={18} /> New Order
        </NavLink>
        {canManage && (
          <NavLink to="/orders" end className={linkClass}>
            <ShoppingCart size={18} /> Orders
          </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-[11px] text-slate-500">
        Mini ERP &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
