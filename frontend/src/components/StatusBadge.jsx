import { memo } from 'react';
import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';

const CONFIG = {
  COMPLETED: { style: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  PENDING: { style: 'bg-amber-50 text-amber-700', icon: Clock },
  FAILED: { style: 'bg-red-50 text-red-700', icon: XCircle },
  CANCELLED: { style: 'bg-slate-100 text-slate-600', icon: Ban },
};

function StatusBadge({ status }) {
  const { style, icon: Icon } = CONFIG[status] || { style: 'bg-slate-100 text-slate-600', icon: Clock };
  return (
    <span className={`badge ${style}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

export default memo(StatusBadge);
