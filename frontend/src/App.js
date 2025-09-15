import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import StockPage from './StockPage';

const API_URL = 'http://localhost:3001';

// Add Bootstrap CDN to the document head
if (typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
  document.head.appendChild(link);
}

function MainPage() {
  // Transaction edit/delete state and handlers
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [editTransactionRequester, setEditTransactionRequester] = useState('');

  const handleEditTransaction = (tx) => {
    setEditTransaction(tx);
    setEditTransactionRequester(tx.requester || '');
    setShowEditTransactionModal(true);
  };

  const handleEditTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!editTransaction) return;
    await fetch(`${API_URL}/transactions/${editTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requester: editTransactionRequester }),
    });
    setShowEditTransactionModal(false);
    // Refresh transactions
    fetch(`${API_URL}/transactions`).then(res => res.json()).then(data => setTransactions(data.data || []));
  };

  const handleDeleteTransaction = async (tx) => {
    if (!window.confirm('Delete this transaction?')) return;
    await fetch(`${API_URL}/transactions/${tx.id}`, { method: 'DELETE' });
    // Refresh transactions
    fetch(`${API_URL}/transactions`).then(res => res.json()).then(data => setTransactions(data.data || []));
  };
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [items, setItems] = useState([]);
  // Manual nama_barang search state
  const [manualNama, setManualNama] = useState('');
  const [manualType, setManualType] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [input, setInput] = useState('');
  const [action, setAction] = useState('in');
  const [result, setResult] = useState(null);
  const [cart, setCart] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notification, setNotification] = useState('');
  const [requester, setRequester] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/stock`)
      .then(res => res.json())
      .then(data => setItems(data.data || []));
    fetch(`${API_URL}/transactions`)
      .then(res => res.json())
      .then(data => setTransactions(data.data || []));
  }, [result]);

  // Debounced manual search effect (runs when name OR type changes)
  useEffect(() => {
    // If both fields empty, clear results and skip
    if ((!manualNama || manualNama.trim() === '') && (!manualType || manualType.trim() === '')) {
      setManualResults([]);
      setManualError('');
      return;
    }
    setManualLoading(true);
    setManualError('');
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (manualNama) params.append('nama_barang', manualNama);
      if (manualType) params.append('type', manualType);
      fetch(`${API_URL}/stock/search?${params.toString()}`)
        .then(r => r.json())
        .then(d => {
          setManualResults(d.data || []);
          setManualLoading(false);
        })
        .catch(err => {
          setManualError('Search failed');
          setManualLoading(false);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [manualNama, manualType]);

  // Add manual result to cart
  const handleAddManualToCart = (item) => {
    setCart(prev => {
      const idx = prev.findIndex(p => p.item_code === item.item_code);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: Number(copy[idx].quantity) + 1, nama_barang: item.nama_barang || copy[idx].nama_barang, type: item.type || copy[idx].type };
        return copy;
      }
      return [...prev, { item_code: item.item_code, nama_barang: item.nama_barang || '-', type: item.type || '-', quantity: 1 }];
    });
  };

  // Add item to cart with duplicate merge and new product notification
  const handleAddToCart = (e) => {
    e.preventDefault();
    setNotification('');
    const codes = input.split(',').map(code => code.trim()).filter(Boolean);
    let newCart = [...cart];
    let newProductCodes = [];
    codes.forEach(code => {
      // Find item details from stock
      const itemDetails = items.find(item => item.item_code === code);
      const idx = newCart.findIndex(item => item.item_code === code);
      if (idx !== -1) {
        // If exists, increment quantity
        newCart[idx].quantity += 1;
      } else {
        if (!itemDetails) {
          newProductCodes.push(code);
          newCart.push({ item_code: code, quantity: 1, nama_barang: '-', type: '-' });
        } else {
          newCart.push({
            item_code: code,
            quantity: 1,
            nama_barang: itemDetails.nama_barang,
            type: itemDetails.type
          });
        }
      }
    });
    setCart(newCart);
    setInput('');
    if (newProductCodes.length > 0) {
      setNotification(`New product(s) detected: ${newProductCodes.join(', ')}`);
    }
  };

  // Submit cart to backend
  const handleSubmitCart = async () => {
    if (cart.length === 0 || !requester.trim()) return;
    const payload = { items: cart, requester };
    const endpoint = action === 'in' ? '/stock/in' : '/stock/out';
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    // Count successful items
    const successCount = data.results ? data.results.filter(r => r.status === 'updated' || r.status === 'inserted').length : 0;
    setResult({ ...data, successCount });
    setCart([]);
    setRequester('');
    // Fetch transactions after submission
    fetch(`${API_URL}/transactions`)
      .then(res => res.json())
      .then(data => setTransactions(data.data || []));
  };

  return (
    <div className="container py-4">
        <h1 className="mb-4">Stock Management</h1>

        {/* Manual nama_barang search */}
        <div className="mb-4 p-3 border rounded bg-light">
          <h5>Search product by Nama Barang</h5>
          <div className="row g-2">
            <div className="col-md-6">
              <input className="form-control" placeholder="Type product name..." value={manualNama} onChange={e => setManualNama(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input className="form-control" placeholder="Type (optional)" value={manualType} onChange={e => setManualType(e.target.value)} />
            </div>
            <div className="col-md-3 text-end">
              {manualLoading ? <span className="text-muted">Searching...</span> : manualError ? <span className="text-danger">{manualError}</span> : null}
            </div>
          </div>
          {manualResults.length > 0 && (
            <ul className="list-group mt-2">
              {manualResults.map(r => (
                <li key={r.item_code} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{r.nama_barang}</strong> <small className="text-muted">[{r.item_code}]</small>
                    {r.type && <div className="text-muted small">{r.type}</div>}
                  </div>
                  <button className="btn btn-sm btn-success" onClick={() => handleAddManualToCart(r)}>Add to Cart</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleAddToCart} className="mb-4">
        <div className="row mb-3">
          <div className="col-md-3">
            <label className="form-label">Action:</label>
            <select value={action} onChange={e => setAction(e.target.value)} className="form-select">
              <option value="in">IN</option>
              <option value="out">OUT</option>
            </select>
          </div>
          <div className="col-md-9">
            <label className="form-label">Scan/Input Item Codes (comma separated):</label>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="form-control"
              placeholder="e.g. 12345,67890,11223"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">Add to Cart</button>
      </form>

      {notification && (
        <div className="alert alert-warning" role="alert">{notification}</div>
      )}

      <div className="mb-4">
        <h3>Cart</h3>
        {cart.length === 0 ? <div className="text-muted">Cart is empty.</div> : (
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Item Code</th>
                <th>Nama Barang</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.item_code}</td>
                  <td>{item.nama_barang}</td>
                  <td>{item.type}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      style={{ width: '70px' }}
                      onChange={e => {
                        const val = Math.max(1, Number(e.target.value));
                        setCart(cart.map((c, i) => i === idx ? { ...c, quantity: val } : c));
                      }}
                    />
                  </td>
                  <td>
                    <button className="btn btn-sm btn-warning" onClick={() => {
                      const val = prompt('Enter new quantity:', item.quantity);
                      if (val !== null && !isNaN(val) && Number(val) > 0) {
                        setCart(cart.map((c, i) => i === idx ? { ...c, quantity: Number(val) } : c));
                      }
                    }}>Edit</button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => {
                      setCart(cart.filter((_, i) => i !== idx));
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mb-2">
          <label className="form-label">Requester:</label>
          <input
            type="text"
            value={requester}
            onChange={e => setRequester(e.target.value)}
            className="form-control"
            placeholder="Enter requester name"
          />
        </div>
        <button onClick={handleSubmitCart} disabled={cart.length === 0 || !requester.trim()} className="btn btn-success mt-2">Submit Cart</button>
      </div>

      {result && (
        <div className="mb-4">
          <h3>Result</h3>
          <div className="mb-2">Successfully processed: <b>{result.successCount}</b> item(s)</div>
          {result.results && result.results.length > 0 ? (
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Item Code</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.item_code}</td>
                    <td>{r.status === 'updated' ? 'Updated' : r.status === 'inserted' ? 'Inserted' : 'Error'}</td>
                    <td>{r.error ? (typeof r.error === 'object' ? r.error.message : r.error) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-muted">No result data.</div>
          )}
        </div>
      )}

      {/* Stock Transactions Section */}
      <h2 className="mt-5">Stock Transactions</h2>
      <div className="row mb-2">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search transactions (item code, nama_barang, requester...)"
            value={transactionSearch}
            onChange={e => setTransactionSearch(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={transactionFilter} onChange={e => setTransactionFilter(e.target.value)}>
            <option value="">All Actions</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>
        </div>
      </div>
      {transactions.length === 0 ? (
        <div className="text-muted">No transactions found.</div>
      ) : (
        <>
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Action</th>
              <th>Requester</th>
              <th>Items</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .filter(tx =>
                (!transactionFilter || tx.action === transactionFilter) &&
                (
                  transactionSearch === '' ||
                  tx.requester?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                  (Array.isArray(tx.items) && tx.items.some(item =>
                    (item.item_code && item.item_code.toLowerCase().includes(transactionSearch.toLowerCase())) ||
                    (item.nama_barang && item.nama_barang.toLowerCase().includes(transactionSearch.toLowerCase()))
                  ))
                )
              )
              .map((tx, idx) => (
                <tr key={tx.id || idx}>
                  <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '-'}</td>
                  <td>{tx.action}</td>
                  <td>{tx.requester || '-'}</td>
                  <td>
                    {Array.isArray(tx.items) ? (
                      <ul className="mb-0">
                        {tx.items.map((item, i) => (
                          <li key={i}>
                            <b>{item.item_code}</b> ({item.quantity})<br />
                            {item.nama_barang && <span>Nama Barang: {item.nama_barang}<br /></span>}
                            {item.type && <span>Type: {item.type}<br /></span>}
                            {Object.entries(item).map(([key, value]) => (
                              typeof value === 'string' && !['item_code','nama_barang','type'].includes(key) ? (
                                <span key={key}>{key}: {value}<br /></span>
                              ) : null
                            ))}
                          </li>
                        ))}
                      </ul>
                    ) : '-' }
                  </td>
                  <td>
                    <button className="btn btn-sm btn-warning" onClick={() => handleEditTransaction(tx)}>Edit</button>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTransaction(tx)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {/* Edit Transaction Modal */}
        {showEditTransactionModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="modal-dialog">
              <form onSubmit={handleEditTransactionSubmit}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Requester</h5>
                    <button type="button" className="btn-close" onClick={() => setShowEditTransactionModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <input className="form-control mb-2" name="requester" value={editTransactionRequester} onChange={e => setEditTransactionRequester(e.target.value)} placeholder="Requester" required />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditTransactionModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        </>
      )}
      <div className="mt-4">
        <Link to="/stock" className="btn btn-secondary">View Current Stock</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/stock" element={<StockPage />} />
      </Routes>
    </Router>
  );
}

export default App;
