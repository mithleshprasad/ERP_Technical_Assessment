import { memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of{' '}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </span>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={15} /> Previous
        </button>
        <button className="btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default memo(Pagination);
