import { Link } from 'react-router-dom';
import { Package, Boxes, PlusCircle, ShoppingCart, UploadCloud, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ICON_STYLES = [
  'bg-brand-50 text-brand-600',
  'bg-sky-50 text-sky-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-violet-50 text-violet-600',
];

export default function DashboardPage() {
  const { user } = useAuth();

  const cards = [
    { to: '/products', title: 'Products', desc: 'Browse, create, and manage the product catalog.', icon: Package },
    { to: '/inventory', title: 'Inventory', desc: 'Live stock levels per product across warehouses.', icon: Boxes },
    { to: '/orders/new', title: 'New Order', desc: 'Create a sales order and reserve stock.', icon: PlusCircle },
    ...(user.role !== 'SALES_USER'
      ? [
          { to: '/orders', title: 'Orders', desc: 'Search and filter all sales orders.', icon: ShoppingCart },
          { to: '/products/import', title: 'Bulk Import', desc: 'Import products in bulk from CSV/Excel.', icon: UploadCloud },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">
          Signed in as <span className="font-medium text-slate-700">{user.role.replace('_', ' ')}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="group card p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-150"
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-4 ${ICON_STYLES[i % ICON_STYLES.length]}`}>
                <Icon size={20} />
              </div>
              <h2 className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                {c.title}
                <ArrowRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h2>
              <p className="text-sm text-slate-500">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
