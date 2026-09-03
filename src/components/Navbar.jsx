import { memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-brand-700 mr-4">Mini ERP</span>
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          <NavLink to="/inventory" className={linkClass}>Inventory</NavLink>
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <NavLink to="/orders" className={linkClass}>Orders</NavLink>
          )}
          <NavLink to="/orders/new" className={linkClass}>New Order</NavLink>
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <NavLink to="/products/import" className={linkClass}>Bulk Import</NavLink>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {user.name} <span className="badge bg-slate-100 text-slate-600 ml-1">{user.role}</span>
          </span>
          <button onClick={handleSignOut} className="btn-secondary">
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default memo(Navbar);
