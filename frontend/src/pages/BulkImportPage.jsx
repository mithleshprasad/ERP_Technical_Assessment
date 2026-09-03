import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle } from 'lucide-react';
import { importProducts } from '../api/productApi';

export default function BulkImportPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);

  const mutation = useMutation({
    mutationFn: importProducts,
    onSuccess: (result) => {
      setReport(result);
      toast.success(`Imported ${result.importedCount} of ${result.totalRows} rows`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Import failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Choose a CSV or Excel file first');
      return;
    }
    mutation.mutate(file);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Bulk Import Products</h1>
      <p className="text-sm text-slate-500 mb-6 max-w-xl">
        Columns required: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Product Name, SKU, Price, Opening Stock</span>.
        Large files are parsed on a background worker thread, so the API keeps serving other requests while an import runs.
      </p>

      <form onSubmit={handleSubmit} className="card p-6">
        <label
          htmlFor="import-file"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors"
        >
          <div className="h-11 w-11 rounded-full bg-white shadow-sm flex items-center justify-center">
            {file ? <FileSpreadsheet size={20} className="text-brand-600" /> : <UploadCloud size={20} className="text-slate-400" />}
          </div>
          <p className="text-sm font-medium text-slate-700">{file ? file.name : 'Click to choose a file'}</p>
          <p className="text-xs text-slate-400">CSV, XLSX, or XLS</p>
          <input
            id="import-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </label>

        <button type="submit" className="btn-primary w-full mt-5 !py-2.5" disabled={mutation.isPending}>
          {mutation.isPending ? 'Importing...' : 'Upload & Import'}
        </button>
      </form>

      {report && (
        <div className="card p-6 mt-4">
          <div className="flex gap-8 mb-5">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Total rows</div>
              <div className="text-2xl font-bold text-slate-800">{report.totalRows}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Imported</div>
              <div className="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={18} /> {report.importedCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Failed</div>
              <div className="text-2xl font-bold text-red-500 flex items-center gap-1.5">
                <XCircle size={18} /> {report.failedCount}
              </div>
            </div>
          </div>

          {report.invalidRows?.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>SKU</th>
                    <th>Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {report.invalidRows.map((r) => (
                    <tr key={r.row}>
                      <td className="font-medium text-slate-700">{r.row}</td>
                      <td className="text-slate-500 font-mono text-xs">{r.sku || '-'}</td>
                      <td className="text-red-600 text-xs">{r.reasons.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
