'use client';

import { useEffect, useState } from 'react';
import AdminAuthGate from '@/components/AdminAuthGate';

interface Zone { id: string; name: string; district: string; fee: number; isActive: boolean; }
const empty = { name: '', district: '', fee: '350' };

export default function DeliveryZonesPage() { return <AdminAuthGate active="delivery-zones">{(_, token) => <Zones token={token} />}</AdminAuthGate>; }
function Zones({ token }: { token: string }) {
  const [zones, setZones] = useState<Zone[]>([]); const [form, setForm] = useState(empty); const [error, setError] = useState('');
  async function load() { const response = await fetch('/api/admin/delivery-zones', { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) throw new Error('Unable to load delivery zones.'); setZones(await response.json()); }
  useEffect(() => {
    async function loadInitialZones() {
      try {
        const response = await fetch('/api/admin/delivery-zones', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Unable to load delivery zones.');
        setZones(await response.json());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load delivery zones.');
      }
    }
    void loadInitialZones();
  }, [token]);
  async function add(event: React.FormEvent) { event.preventDefault(); setError(''); const response = await fetch('/api/admin/delivery-zones', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, fee: Number(form.fee) }) }); const result = await response.json(); if (!response.ok) { setError(result.error); return; } setForm(empty); await load(); }
  async function toggle(zone: Zone) { await fetch(`/api/admin/delivery-zones/${zone.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !zone.isActive }) }); await load(); }
  return <><header className="admin-header"><div><div className="admin-kicker">Configuration</div><h1>Delivery zones</h1><p>Manage district delivery availability and fees.</p></div></header>{error && <div className="admin-error">{error}</div>}<form className="admin-form-panel" onSubmit={add}><h2>Add delivery zone</h2><div className="admin-form-grid"><label>Name<input value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>District<input value={form.district} required onChange={(event) => setForm({ ...form, district: event.target.value })} /></label><label>Fee (LKR)<input type="number" min="0" step="0.01" value={form.fee} required onChange={(event) => setForm({ ...form, fee: event.target.value })} /></label></div><button className="btn-primary">Add zone</button></form><section className="admin-panel"><div className="admin-panel-heading"><h2>Configured zones</h2></div><div className="admin-table-wrap"><table><thead><tr><th>Name</th><th>District</th><th>Fee</th><th>Status</th><th>Action</th></tr></thead><tbody>{zones.map((zone) => <tr key={zone.id}><td>{zone.name}</td><td>{zone.district}</td><td>LKR {zone.fee.toLocaleString()}</td><td>{zone.isActive ? 'Active' : 'Disabled'}</td><td><button className="admin-outline-button" onClick={() => toggle(zone)}>{zone.isActive ? 'Disable' : 'Enable'}</button></td></tr>)}</tbody></table></div></section></>;
}
