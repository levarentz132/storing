
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.post('/stock', async (req, res) => {
  const { item_code, nama_barang, type, quantity } = req.body;
  if (!item_code || !nama_barang || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data, error } = await supabase
    .from('stock_items')
    .insert([{ item_code, nama_barang, type, quantity }]);
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ data });
});

// Edit/update a stock item
app.put('/stock/:item_code', async (req, res) => {
  const { item_code } = req.params;
  const { nama_barang, type, quantity } = req.body;
  if (!nama_barang || !type || quantity === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const { data, error } = await supabase
    .from('stock_items')
    .update({ nama_barang, type, quantity, updated_at: new Date().toISOString() })
    .eq('item_code', item_code)
    .select();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ data });
});
// IN endpoint
app.post('/stock/in', async (req, res) => {
  const { items, requester } = req.body; // items: [{ item_code, nama_barang, type, satuan, stok, quantity }], requester: string
  let results = [];
  let recognizedItems = [];
  for (const item of items) {
    // Check if item exists
    const { data: existing, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('item_code', item.item_code)
      .single();
    if (existing) {
      // Update quantity
      const { data, error: updateError } = await supabase
        .from('stock_items')
        .update({ quantity: existing.quantity + item.quantity, updated_at: new Date().toISOString() })
        .eq('item_code', item.item_code);
      results.push({ item_code: item.item_code, status: 'updated', error: updateError });
      // Always include nama_barang and type from DB if missing
      recognizedItems.push({
        ...item,
        nama_barang: item.nama_barang || existing.nama_barang || '-',
        type: item.type || existing.type || '-'
      });
    } else {
      // Insert new item
      const { data, error: insertError } = await supabase
        .from('stock_items')
        .insert([{ item_code: item.item_code, nama_barang: item.nama_barang, type: item.type, satuan: item.satuan, stok: item.stok, quantity: item.quantity }]);
      results.push({ item_code: item.item_code, status: 'inserted', error: insertError });
      // Do NOT add to recognizedItems, so it won't be logged in transaction
    }
  }
  // Log transaction as a cart, only for recognized items
  if (recognizedItems.length > 0) {
    await supabase
      .from('stock_transactions')
      .insert([{ action: 'IN', items: JSON.stringify(recognizedItems), requester, timestamp: new Date().toISOString() }]);
  }
  res.json({ results });
});

// OUT endpoint
app.post('/stock/out', async (req, res) => {
  const { items, requester } = req.body; // items: [{ item_code, quantity }], requester: string
  let results = [];
  let recognizedItems = [];
  for (const item of items) {
    const { data: existing, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('item_code', item.item_code)
      .single();
    if (existing && existing.quantity >= item.quantity) {
      const { data, error: updateError } = await supabase
        .from('stock_items')
        .update({ quantity: existing.quantity - item.quantity, updated_at: new Date().toISOString() })
        .eq('item_code', item.item_code);
      results.push({ item_code: item.item_code, status: 'updated', error: updateError });
      // Always include nama_barang and type from DB if missing
      recognizedItems.push({
        ...item,
        nama_barang: item.nama_barang || existing.nama_barang || '-',
        type: item.type || existing.type || '-'
      });
    } else {
      results.push({ item_code: item.item_code, status: 'error', error: 'Not enough stock or item not found' });
      // Do NOT add to recognizedItems, so it won't be logged in transaction
    }
  }
  // Log transaction as a cart, only for recognized items
  if (recognizedItems.length > 0) {
    await supabase
      .from('stock_transactions')
      .insert([{ action: 'OUT', items: JSON.stringify(recognizedItems), requester, timestamp: new Date().toISOString() }]);
  }
  res.json({ results });
});

// List all stock items
app.get('/stock', async (req, res) => {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*');
  res.json({ data, error });
});

// List all stock transactions
app.get('/transactions', async (req, res) => {
  const { data, error } = await supabase
    .from('stock_transactions')
    .select('*')
    .order('timestamp', { ascending: false });
  // Parse items JSON if needed
  const parsed = data ? data.map(tx => ({ ...tx, items: typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items })) : [];
  res.json({ data: parsed, error });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
