export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-14 text-slate-400 text-sm">
      <div className="h-4 w-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      {label}
    </div>
  );
}
