import React, { useState } from 'react';

export default function TemplateForm({ onSave }) {
  const [form, setForm] = useState({ passenger_name:'', age:'', id_type:'Aadhar', id_number:'', berth_pref:'Lower', phone:'' });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  function save(e) {
    e.preventDefault();
    onSave(form);
    setForm({ passenger_name:'', age:'', id_type:'Aadhar', id_number:'', berth_pref:'Lower', phone:'' });
  }

  return (
    <form onSubmit={save} className="card">
      <h3>New Template</h3>
      <input name="passenger_name" placeholder="Name" value={form.passenger_name} onChange={handleChange} required />
      <input name="age" placeholder="Age" value={form.age} onChange={handleChange} required />
      <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
      <input name="id_number" placeholder="ID number" value={form.id_number} onChange={handleChange} required />
      <select name="berth_pref" value={form.berth_pref} onChange={handleChange}>
        <option>Lower</option><option>Upper</option><option>Middle</option>
      </select>
      <button type="submit">Save Template</button>
    </form>
  );
}
