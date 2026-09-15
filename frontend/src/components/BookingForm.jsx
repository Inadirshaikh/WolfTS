import React, { useState } from 'react';

/*
 Mock booking form — demonstrates client-side autofill.
 The user must manually press "Open mock booking page" and then "Fill from template".
 This does NOT automate any external site.
*/
export default function BookingForm({ templates }) {
  const [selected, setSelected] = useState('');
  function openMock() {
    window.open('/mock-booking.html', '_blank');
  }
  function fillMock() {
    const tpl = templates.find(t => t.id === selected);
    if (!tpl) return alert('Select template');
    // This demo stores the template in localStorage so the mock page can read it
    localStorage.setItem('demo_booking_template', JSON.stringify(tpl));
    alert('Template saved to localStorage. Open/opened mock booking page can read it.');
  }
  return (
    <div className="card">
      <h3>Mock Booking</h3>
      <select onChange={e => setSelected(e.target.value)} value={selected}>
        <option value="">-- select template --</option>
        {templates.map(t => <option key={t.id} value={t.id}>{t.passenger_name} — {t.id_number}</option>)}
      </select>
      <button onClick={openMock}>Open mock booking page</button>
      <button onClick={fillMock}>Fill from template (stores in localStorage)</button>
      <p style={{fontSize:12}}>Note: mock page reads localStorage and fills its fields when you click "Load template".</p>
    </div>
  );
}
