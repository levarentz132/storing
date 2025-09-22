
import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001';

function StockPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ item_code: '', nama_barang: '', type: '', quantity: '' });

  useEffect(() => {
    fetch(`${API_URL}/stock`)
      .then(res => res.json())
      .then(data => setItems(data.data || []));
  }, []);

  const handleEditClick = (item) => {
    setEditItem(item);
    setForm(item);
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setForm({ item_code: '', nama_barang: '', type: '', quantity: '' });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/stock/${editItem.item_code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowEditModal(false);
    window.location.reload();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowAddModal(false);
    window.location.reload();
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4 d-flex justify-content-between align-items-center">
        <span>Current Stock</span>
        <button className="btn btn-primary" onClick={handleAddClick}>+ New Stock</button>
      </h1>
      <div className="row mb-2">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search stock (item code, nama_barang...)"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {[...new Set(items.map(item => item.type).filter(Boolean))].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>Item Code</th>
            <th>Name</th>
            <th>Type</th>
            <th>Quantity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items
            .filter(item =>
              (!typeFilter || item.type === typeFilter) &&
              (
                search === '' ||
                (item.item_code && item.item_code.toLowerCase().includes(search.toLowerCase())) ||
                (item.nama_barang && item.nama_barang.toLowerCase().includes(search.toLowerCase()))
              )
            )
            .map(item => (
              <tr key={item.item_code}>
                <td>{item.item_code}</td>
                <td>{item.nama_barang}</td>
                <td>{item.type}</td>
                <td>{item.quantity}</td>
                <td>
                  <button className="btn btn-sm btn-warning" disabled onClick={() => handleEditClick(item)}>Edit</button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleEditSubmit}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Stock</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input className="form-control mb-2" name="item_code" value={form.item_code} disabled />
                  <input className="form-control mb-2" name="nama_barang" value={form.nama_barang} onChange={handleFormChange} placeholder="Name" required />
                  <input className="form-control mb-2" name="type" value={form.type} onChange={handleFormChange} placeholder="Type" required />
                  <input className="form-control mb-2" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="Quantity" type="number" required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog">
            <form onSubmit={handleAddSubmit}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New Stock</h5>
                  <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input className="form-control mb-2" name="item_code" value={form.item_code} onChange={handleFormChange} placeholder="Item Code" required />
                  <input className="form-control mb-2" name="nama_barang" value={form.nama_barang} onChange={handleFormChange} placeholder="Name" required />
                  <input className="form-control mb-2" name="type" value={form.type} onChange={handleFormChange} placeholder="Type" required />
                  <input className="form-control mb-2" name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="Quantity" type="number" required />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockPage;
