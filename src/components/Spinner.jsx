export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
      <div className="h-4 w-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      {label}
    </div>
  );
}
