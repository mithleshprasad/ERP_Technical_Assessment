import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="card w-full max-w-md p-6 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
