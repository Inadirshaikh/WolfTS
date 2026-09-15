import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TemplateForm from './components/TemplateForm';
import BookingForm from './components/BookingForm';
import Dashboard from './components/Dashboard';

const API = 'http://localhost:4000/api';

export default function App() {
  const [templates, setTemplates] = useState([]);
  useEffect(() => { fetchTemplates(); }, []);
  async function fetchTemplates() {
    try {
      const r = await axios.get(API + '/templates');
      setTemplates(r.data);
    } catch (e) {
      console.error('Failed to fetch templates', e);
    }
  }
  async function addTemplate(t) {
    await axios.post(API + '/templates', t);
    fetchTemplates();
  }
  async function deleteTemplate(id) {
    await axios.delete(API + '/templates/' + id);
    fetchTemplates();
  }

  return (
    <div className="app">
      <header><h1>WolfTS — Tatkal Helper (Demo)</h1></header>
      <main>
        <div className="left">
          <TemplateForm onSave={addTemplate} />
          <div style={{marginTop:20}}>
            <h3>Saved Templates</h3>
            {templates.map(t => (
              <div key={t.id} className="card">
                <b>{t.passenger_name}</b> — {t.age} — {t.berth_pref}
                <button onClick={() => deleteTemplate(t.id)} style={{float:'right'}}>Delete</button>
              </div>
            ))}
          </div>
        </div>
        <div className="center">
          <Dashboard templates={templates} />
        </div>
        <div className="right">
          <BookingForm templates={templates} />
        </div>
      </main>
    </div>
  );
}
