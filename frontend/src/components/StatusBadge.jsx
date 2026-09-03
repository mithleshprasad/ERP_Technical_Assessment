import { memo } from 'react';

const STYLES = {
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
};

function StatusBadge({ status }) {
  return <span className={`badge ${STYLES[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

export default memo(StatusBadge);
