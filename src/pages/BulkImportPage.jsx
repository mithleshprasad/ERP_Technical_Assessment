import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { importProducts } from '../api/productApi';

export default function BulkImportPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
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
      <h1 className="text-2xl font-bold mb-1">Bulk Import Products</h1>
      <p className="text-sm text-slate-500 mb-4">
        Columns required: <span className="font-mono">Product Name, SKU, Price, Opening Stock</span>. Large files are
        parsed on a background worker thread, so the API keeps serving other requests while an import runs.
      </p>

      <form onSubmit={handleSubmit} className="card p-5 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block text-sm"
        />
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Importing...' : 'Upload & Import'}
        </button>
      </form>

      {report && (
        <div className="card p-5 mt-4">
          <div className="flex gap-6 mb-4 text-sm">
            <div>
              <div className="text-slate-400">Total rows</div>
              <div className="text-lg font-semibold">{report.totalRows}</div>
            </div>
            <div>
              <div className="text-slate-400">Imported</div>
              <div className="text-lg font-semibold text-green-600">{report.importedCount}</div>
            </div>
            <div>
              <div className="text-slate-400">Failed</div>
              <div className="text-lg font-semibold text-red-600">{report.failedCount}</div>
            </div>
          </div>

          {report.invalidRows?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>SKU</th>
                    <th>Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.invalidRows.map((r) => (
                    <tr key={r.row}>
                      <td>{r.row}</td>
                      <td className="text-slate-500">{r.sku || '-'}</td>
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
