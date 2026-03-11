import { useState } from 'react';
import api, { setToken } from '../services/api';

export default function AdminPage() {
  const [token, updateToken] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ username: 'admin', password: 'admin@123' });

  const login = async () => {
    const { data } = await api.post('/admin/login', form);
    updateToken(data.token);
    setToken(data.token);
    setMsg('Admin login success');
  };

  const createElection = async () => {
    await api.post('/admin/create-election', {
      name: 'Club Executive Election',
      clubName: 'Coding Club',
      electionDate: new Date().toISOString()
    });
    setMsg('Election created');
  };

  const registerVoter = async () => {
    await api.post('/admin/register-voter', {
      studentId: `STU-${Date.now()}`,
      name: 'Sample Student',
      department: 'CSE',
      biometricRaw: 'face-template-demo'
    });
    setMsg('Voter registered');
  };

  return (
    <div className="card p-3">
      <h5>Admin Dashboard</h5>
      <input className="form-control mb-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input className="form-control mb-2" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <div className="d-flex gap-2 mb-2">
        <button className="btn btn-primary" onClick={login}>Login</button>
        <button className="btn btn-success" onClick={createElection} disabled={!token}>Create Election</button>
        <button className="btn btn-secondary" onClick={registerVoter} disabled={!token}>Register Voter</button>
      </div>
      {msg && <div className="alert alert-success mb-0">{msg}</div>}
    </div>
  );
}
