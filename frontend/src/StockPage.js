import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001';

function StockPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/stock`)
      .then(res => res.json())
      .then(data => setItems(data.data || []));
  }, []);

  return (
    <div className="container py-4">
      <h1 className="mb-4">Current Stock</h1>
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
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default StockPage;
