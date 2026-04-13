import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs`);
      setLogs(res.data.reverse()); 
    } catch (err) { console.error(err); }
  };

  const deleteLogEntry = async (id) => {
    if (window.confirm("Clear this log record?")) {
      await axios.delete(`${API_URL}/logs/${id}`);
      fetchLogs();
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Bill Edit History (Audit Logs)</h2>
          <p className="results-count">Monitoring all changes to finalized bills</p>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>EDIT TIME</th>
            <th>BILL NO</th>
            <th>ITEMS IN BILL</th> {/* NEW COLUMN */}
            <th>OLD TOTAL</th>
            <th>NEW TOTAL</th>
            <th>DIFFERENCE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? logs.map(log => {
            const diff = log.new_total - log.old_total;
            return (
              <tr key={log.id}>
                <td style={{fontSize: '0.85rem'}}>{new Date(log.timestamp).toLocaleString()}</td>
                <td><strong>#{log.bill_no}</strong></td>
                
                {/* DISPLAY PRODUCT NAMES HERE */}
                <td>
                   <div style={{fontSize: '0.8rem', color: '#475569', maxWidth: '250px', lineHeight: '1.4'}}>
                     {log.details || "N/A"}
                   </div>
                </td>

                <td>₹{log.old_total.toFixed(2)}</td>
                <td>₹{log.new_total.toFixed(2)}</td>
                <td style={{ color: diff < 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                  {diff < 0 ? '-' : '+'}₹{Math.abs(diff).toFixed(2)}
                </td>
                <td>
                  <button className="btn-del" onClick={() => deleteLogEntry(log.id)}>Clear Log</button>
                </td>
              </tr>
            )
          }) : (
            <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px', color: '#94a3b8'}}>No bill edits have been recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AuditLogs;