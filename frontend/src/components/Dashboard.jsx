import React from 'react';

export default function Dashboard({ templates }) {
  return (
    <div className="card">
      <h2>Dashboard</h2>
      <div className="metrics">
        <div className="metric">
          <div className="value">{templates.length}</div>
          <div className="label">Templates</div>
        </div>
        <div className="metric">
          <div className="value">—</div>
          <div className="label">Next Reminder</div>
        </div>
      </div>
      <div style={{marginTop:20}}>
        <h4>Activity (sample)</h4>
        <ul><li>No attempts yet — use mock booking to test.</li></ul>
      </div>
    </div>
  );
}
