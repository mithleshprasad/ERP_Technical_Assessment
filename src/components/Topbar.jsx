import { memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Package, Boxes, ShoppingCart, PlusCircle, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_STYLES = {
  ADMIN: 'bg-violet-100 text-violet-700',
  MANAGER: 'bg-sky-100 text-sky-700',
  SALES_USER: 'bg-emerald-100 text-emerald-700',
};

const mobileLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
    isActive ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
  }`;

function Topbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER';

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
        <div className="lg:hidden font-semibold text-brand-700">Mini ERP</div>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{user.name}</p>
            <span className={`badge mt-1 ${ROLE_STYLES[user.role] || 'bg-slate-100 text-slate-600'}`}>
              {user.role.replace('_', ' ')}
            </span>
          </div>
          <button onClick={handleSignOut} className="btn-secondary !px-2.5" title="Sign out">
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 pb-3">
        <NavLink to="/" end className={mobileLinkClass}>
          <LayoutDashboard size={14} /> Dashboard
        </NavLink>
        <NavLink to="/products" end className={mobileLinkClass}>
          <Package size={14} /> Products
        </NavLink>
        <NavLink to="/inventory" className={mobileLinkClass}>
          <Boxes size={14} /> Inventory
        </NavLink>
        <NavLink to="/orders/new" className={mobileLinkClass}>
          <PlusCircle size={14} /> New Order
        </NavLink>
        {canManage && (
          <NavLink to="/orders" end className={mobileLinkClass}>
            <ShoppingCart size={14} /> Orders
          </NavLink>
        )}
        {canManage && (
          <NavLink to="/products/import" className={mobileLinkClass}>
            <UploadCloud size={14} /> Import
          </NavLink>
        )}
      </div>
    </header>
  );
}

export default memo(Topbar);
