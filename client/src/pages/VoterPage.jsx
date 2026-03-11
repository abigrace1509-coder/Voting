import { useState } from 'react';
import api, { setToken } from '../services/api';

export default function VoterPage() {
  const [form, setForm] = useState({ studentId: '', biometricRaw: '' });
  const [elections, setElections] = useState([]);
  const [msg, setMsg] = useState('');

  const login = async () => {
    const { data } = await api.post('/voter/login', form);
    setToken(data.token);
    const response = await api.get('/voter/active-elections');
    setElections(response.data);
    setMsg(`Welcome ${data.voter.name}`);
  };

  return (
    <div className="card p-3">
      <h5>Voter Portal</h5>
      <input className="form-control mb-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
      <input className="form-control mb-2" placeholder="Biometric Sample" value={form.biometricRaw} onChange={(e) => setForm({ ...form, biometricRaw: e.target.value })} />
      <button className="btn btn-primary mb-2" onClick={login}>Login + Verify Biometric</button>
      {msg && <div className="alert alert-success">{msg}</div>}
      <ul className="list-group">
        {elections.map((e) => <li className="list-group-item" key={e._id}>{e.name} ({e.clubName})</li>)}
      </ul>
    </div>
  );
}
