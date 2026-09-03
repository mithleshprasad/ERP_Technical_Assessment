import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    { to: '/products', title: 'Products', desc: 'Browse, create, and manage the product catalog.' },
    { to: '/inventory', title: 'Inventory', desc: 'Live stock levels per product across warehouses.' },
    { to: '/orders/new', title: 'New Order', desc: 'Create a sales order and reserve stock.' },
    ...(user.role !== 'SALES_USER'
      ? [
          { to: '/orders', title: 'Orders', desc: 'Search and filter all sales orders.' },
          { to: '/products/import', title: 'Bulk Import', desc: 'Import products in bulk from CSV/Excel.' },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome, {user.name}</h1>
      <p className="text-slate-500 mb-6">Signed in as {user.role.replace('_', ' ')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card p-5 hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-brand-700 mb-1">{c.title}</h2>
            <p className="text-sm text-slate-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
