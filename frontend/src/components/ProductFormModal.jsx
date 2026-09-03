import { useState } from 'react';
import Modal from './Modal';

export default function ProductFormModal({ initial, onClose, onSubmit, isSubmitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    sku: initial?.sku || '',
    price: initial?.price ?? '',
  });

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, price: Number(form.price) });
  };

  return (
    <Modal title={initial ? 'Edit Product' : 'New Product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={handleChange('name')} required />
        </div>
        <div>
          <label className="label">SKU</label>
          <input className="input" value={form.sku} onChange={handleChange('sku')} required />
        </div>
        <div>
          <label className="label">Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
            <input
              className="input pl-7"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange('price')}
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
