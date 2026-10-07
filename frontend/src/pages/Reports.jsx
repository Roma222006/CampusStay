/**
 * Reports.jsx
 * 6-tab reporting system: Leave | Student | Complaint | Occupancy | Faculty | Room
 * Each tab: date filters, inline SVG charts, PDF/Excel export, data table with pagination.
 * Recent Activities feed on sidebar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import NotificationBell from '../components/NotificationBell';
import ToastContainer from '../components/common/Toast';
import Pagination from '../components/common/Pagination';
import { SkeletonTable, SkeletonCards } from '../components/common/Skeleton';
import { useToast } from '../hooks/useToast';
import {
  getLeaveReportApi, getStudentReportApi, getComplaintReportApi,
  getOccupancyReportApi, getFacultyReportApi, getRoomReportApi,
  getRecentActivitiesApi, downloadBlob,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─── Generic inline bar chart ─────────────────────────── */
function BarChart({ data, colors, title }) {
  if (!data || Object.keys(data).length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No data</p>;
  }
  const entries = Object.entries(data);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const palette = colors || ['#3B82F6','#22C55E','#F97316','#8B5CF6','#EF4444','#EAB308','#0EA5E9','#EC4899'];

  return (
    <div>
      {entries.map(([key, val], i) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{key}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{val}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(val / maxVal) * 100}%`, background: palette[i % palette.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut chart ─────────────────────────────────────── */
function DonutChart({ data, colors }) {
  if (!data) return null;
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data</p>;
  const palette = colors || ['#3B82F6','#22C55E','#F97316','#8B5CF6','#EF4444','#EAB308'];

  const cx = 70, cy = 70, r = 52, stroke = 20;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const slices = entries.map(([key, val], i) => {
    const pct = val / total;
    const path = (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
        stroke={palette[i % palette.length]}
        strokeWidth={stroke}
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeDashoffset="0"
        transform={`rotate(${offset * 360 - 90}, ${cx}, ${cy})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    );
    offset += pct;
    return { path, key, val, color: palette[i % palette.length] };
  });

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-solid)" strokeWidth={stroke} />
        {slices.map(s => s.path)}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--text)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.key}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Recent Activity Feed ─────────────────────────────── */
function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="cs-empty">
        <i className="fa-regular fa-clock" />
        <p>No recent activities</p>
      </div>
    );
  }
  const typeColors = { leave: '#3B82F6', complaint: '#F97316', room: '#22C55E' };
  const typeIcons  = { leave: 'fa-calendar-check', complaint: 'fa-triangle-exclamation', room: 'fa-door-open' };

  return (
    <div>
      {activities.map((a, i) => (
        <div key={i} className="activity-item">
          <div className="activity-icon" style={{ background: `${typeColors[a.type]}20`, color: typeColors[a.type] }}>
            <i className={`fa-solid ${typeIcons[a.type] || 'fa-bell'}`} />
          </div>
          <div className="activity-meta">
            <div className="activity-title">{a.title}</div>
            <div className="activity-desc">{a.desc}</div>
          </div>
          <div className="activity-time">
            {new Date(a.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Export helper ────────────────────────────────────── */
async function handleExport(apiFn, params, filename, showToast) {
  try {
    showToast('Preparing download…', 'info');
    const res = await apiFn({ ...params });
    downloadBlob(res.data, filename);
    showToast('Download started!', 'success');
  } catch {
    showToast('Export failed. Try again.', 'error');
  }
}

/* ═══════════════════════════════════════════════════════════
   TAB CONTENT COMPONENTS
═══════════════════════════════════════════════════════════ */

const ITEMS_PER_PAGE = 10;

function usePaging(items) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((items?.length || 0) / ITEMS_PER_PAGE);
  const paged = (items || []).slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  return { page, setPage, totalPages, paged };
}

/* ─── Leave Report ── */
function LeaveTab({ user, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const { page, setPage, totalPages, paged } = usePaging(data?.leaves);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLeaveReportApi({ from, to, status });
      setData(res.data);
    } catch { showToast('Failed to load leave report.', 'error'); }
    finally { setLoading(false); }
  }, [from, to, status, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Filters */}
      <div className="report-filter-row">
        <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Date Range:</label>
        <input type="date" className="filter-select" value={from} onChange={e => setFrom(e.target.value)} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="date" className="filter-select" value={to} onChange={e => setTo(e.target.value)} />
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Pending Faculty','Approved Faculty','Rejected Faculty','Approved Warden','Rejected Warden'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getLeaveReportApi, { from, to, status, format: 'pdf' }, 'Leave_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getLeaveReportApi, { from, to, status, format: 'excel' }, 'Leave_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {/* Charts */}
      {data?.charts && (
        <div className="charts-row">
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> Monthly Leave Requests</div>
            <BarChart data={data.charts.monthly} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Status Distribution</div>
            <DonutChart data={data.charts.statusDist} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> Leave Types</div>
            <BarChart data={data.charts.typeDist} />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead>
            <tr>
              <th>Student</th><th>Reg No</th><th>Dept</th><th>Type</th><th>Duration</th><th>Priority</th><th>Status</th><th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={8} /> :
              paged.length === 0 ? <tr><td colSpan={8}><div className="cs-empty"><i className="fa-solid fa-folder-open" /><p>No leave records found.</p></div></td></tr> :
              paged.map(l => (
                <tr key={l._id}>
                  <td><strong>{l.student?.name || 'N/A'}</strong></td>
                  <td>{l.student?.registerNumber || 'N/A'}</td>
                  <td>{l.student?.department || 'N/A'}</td>
                  <td><span className="badge badge-info">{l.leaveType}</span></td>
                  <td>{l.durationDays}d</td>
                  <td><span className={`badge ${l.priority === 'High/Emergency' ? 'badge-danger' : l.priority === 'Medium' ? 'badge-warning' : 'badge-gray'}`}>{l.priority}</span></td>
                  <td><span className={`badge ${l.status.includes('Approved') ? 'badge-success' : l.status.includes('Rejected') ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                  <td>{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

/* ─── Student Report ── */
function StudentTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const { page, setPage, totalPages, paged } = usePaging(data?.students);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudentReportApi({ department: dept, studentType: type });
      setData(res.data);
    } catch { showToast('Failed to load student report.', 'error'); }
    finally { setLoading(false); }
  }, [dept, type, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="report-filter-row">
        <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Hosteller">Hosteller</option>
          <option value="Dayscholar">Dayscholar</option>
        </select>
        <select className="filter-select" value={dept} onChange={e => setDept(e.target.value)}>
          <option value="">All Departments</option>
          {['Computer Science','Information Technology','Electronics','Mechanical','Civil','MBA','MCA'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getStudentReportApi, { department: dept, studentType: type, format: 'pdf' }, 'Student_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getStudentReportApi, { department: dept, studentType: type, format: 'excel' }, 'Student_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {data?.charts && (
        <div className="charts-row">
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Student Type Distribution</div>
            <DonutChart data={data.charts.typeDist} colors={['#3B82F6','#22C55E']} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Allocation Status</div>
            <DonutChart data={data.charts.allocationDist} colors={['#22C55E','#EF4444']} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> By Department</div>
            <BarChart data={data.charts.deptDist} />
          </div>
        </div>
      )}

      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead><tr><th>Name</th><th>Reg No</th><th>Department</th><th>Type</th><th>Block</th><th>Room</th><th>Phone</th></tr></thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={7} /> :
              paged.length === 0 ? <tr><td colSpan={7}><div className="cs-empty"><i className="fa-solid fa-users" /><p>No students found.</p></div></td></tr> :
              paged.map(s => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.registerNumber || 'N/A'}</td>
                  <td>{s.department}</td>
                  <td><span className={`badge ${s.studentType === 'Hosteller' ? 'badge-info' : 'badge-gray'}`}>{s.studentType}</span></td>
                  <td>{s.room?.hostelBlock || s.hostelBlock || '—'}</td>
                  <td>{s.room?.roomNumber || <span style={{color:'var(--text-muted)'}}>Unalloc.</span>}</td>
                  <td>{s.phone || '—'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

/* ─── Complaint Report ── */
function ComplaintTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const { page, setPage, totalPages, paged } = usePaging(data?.complaints);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getComplaintReportApi({ from, to, status });
      setData(res.data);
    } catch { showToast('Failed to load complaint report.', 'error'); }
    finally { setLoading(false); }
  }, [from, to, status, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="report-filter-row">
        <input type="date" className="filter-select" value={from} onChange={e => setFrom(e.target.value)} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="date" className="filter-select" value={to} onChange={e => setTo(e.target.value)} />
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Pending','Ongoing','Rectified','Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getComplaintReportApi, { from, to, status, format: 'pdf' }, 'Complaint_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getComplaintReportApi, { from, to, status, format: 'excel' }, 'Complaint_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {data?.charts && (
        <div className="charts-row">
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Status Breakdown</div>
            <DonutChart data={data.charts.statusDist} colors={['#F97316','#3B82F6','#22C55E','#EF4444']} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Complaint Types</div>
            <DonutChart data={data.charts.typeDist} colors={['#8B5CF6','#EF4444']} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> Monthly Trend</div>
            <BarChart data={data.charts.monthly} />
          </div>
        </div>
      )}

      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead><tr><th>Student</th><th>Dept</th><th>Block</th><th>Category</th><th>Type</th><th>Status</th><th>Escalated</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={8} /> :
              paged.length === 0 ? <tr><td colSpan={8}><div className="cs-empty"><i className="fa-solid fa-clipboard-check" /><p>No complaints found.</p></div></td></tr> :
              paged.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.student?.name || 'N/A'}</strong></td>
                  <td>{c.student?.department || 'N/A'}</td>
                  <td>{c.student?.hostelBlock || '—'}</td>
                  <td>{c.category || 'General'}</td>
                  <td><span className={`badge ${c.complaintType === 'Campus' ? 'badge-purple' : 'badge-info'}`}>{c.complaintType}</span></td>
                  <td><span className={`badge ${c.status === 'Rectified' ? 'badge-success' : c.status === 'Rejected' ? 'badge-danger' : c.status === 'Ongoing' ? 'badge-warning' : 'badge-gray'}`}>{c.status}</span></td>
                  <td>{c.isEscalated ? <span className="badge badge-danger">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

/* ─── Occupancy Report ── */
function OccupancyTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOccupancyReportApi({});
      setData(res.data);
    } catch { showToast('Failed to load occupancy report.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="report-filter-row">
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getOccupancyReportApi, { format: 'pdf' }, 'Occupancy_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getOccupancyReportApi, { format: 'excel' }, 'Occupancy_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {data?.charts && (
        <div className="charts-row">
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Room Status</div>
            <DonutChart data={data.charts.statusDist} colors={['#22C55E','#EF4444','#3B82F6','#F97316']} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> Room Types</div>
            <BarChart data={data.charts.roomTypeDist} />
          </div>
        </div>
      )}

      {/* Block summary */}
      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead>
            <tr><th>Block</th><th>Rooms</th><th>Capacity</th><th>Occupied</th><th>Vacant</th><th>Occupancy %</th><th>Maintenance</th></tr>
          </thead>
          <tbody>
            {loading ? <SkeletonTable rows={5} cols={7} /> :
              (data?.blockStats || []).map(b => (
                <tr key={b.block}>
                  <td><strong>{b.block}</strong></td>
                  <td>{b.totalRooms}</td>
                  <td>{b.totalCapacity}</td>
                  <td><strong style={{color:'var(--primary)'}}>{b.occupiedBeds}</strong></td>
                  <td><strong style={{color:'#22C55E'}}>{b.vacantBeds}</strong></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="bar-track" style={{width:80}}>
                        <div className="bar-fill" style={{width:`${b.occupancyRate}%`,background:'var(--primary)'}} />
                      </div>
                      <span style={{fontWeight:700,color:'var(--text)'}}>{b.occupancyRate}%</span>
                    </div>
                  </td>
                  <td>{b.maintenance > 0 ? <span className="badge badge-warning">{b.maintenance}</span> : <span className="badge badge-gray">0</span>}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Faculty Report ── */
function FacultyTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFacultyReportApi({});
      setData(res.data);
    } catch { showToast('Failed to load faculty report.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="report-filter-row">
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getFacultyReportApi, { format: 'pdf' }, 'Faculty_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getFacultyReportApi, { format: 'excel' }, 'Faculty_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead><tr><th>Faculty Name</th><th>Email</th><th>Department</th><th>Assigned Students</th><th>Leaves Approved</th><th>Pending Leaves</th></tr></thead>
          <tbody>
            {loading ? <SkeletonTable rows={6} cols={6} /> :
              (data?.facultyStats || []).map((f, i) => (
                <tr key={i}>
                  <td><strong>{f.name}</strong></td>
                  <td style={{fontSize:'0.8rem'}}>{f.email}</td>
                  <td>{f.department}</td>
                  <td><span className="badge badge-info">{f.assignedStudents}</span></td>
                  <td><span className="badge badge-success">{f.leavesApproved}</span></td>
                  <td><span className={`badge ${f.leavesPending > 0 ? 'badge-warning' : 'badge-gray'}`}>{f.leavesPending}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Room Report ── */
function RoomTab({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const { page, setPage, totalPages, paged } = usePaging(data?.rooms);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRoomReportApi({ status });
      setData(res.data);
    } catch { showToast('Failed to load room report.', 'error'); }
    finally { setLoading(false); }
  }, [status, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="report-filter-row">
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['Available','Full','Maintenance','Locked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="report-export-row" style={{ marginLeft: 'auto' }}>
          <button className="btn btn-danger btn-sm" onClick={() => handleExport(getRoomReportApi, { status, format: 'pdf' }, 'Room_Report.pdf', showToast)}>
            <i className="fa-solid fa-file-pdf" /> PDF
          </button>
          <button className="btn btn-success btn-sm" onClick={() => handleExport(getRoomReportApi, { status, format: 'excel' }, 'Room_Report.xlsx', showToast)}>
            <i className="fa-solid fa-file-excel" /> Excel
          </button>
        </div>
      </div>

      {data?.charts && (
        <div className="charts-row">
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-bar" /> By Block</div>
            <BarChart data={data.charts.blockDist} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Room Types</div>
            <DonutChart data={data.charts.typeDist} />
          </div>
          <div className="chart-wrapper">
            <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Restroom Types</div>
            <DonutChart data={data.charts.restroomDist} colors={['#8B5CF6','#3B82F6']} />
          </div>
        </div>
      )}

      <div className="cs-table-wrapper">
        <table className="cs-table">
          <thead><tr><th>Room No</th><th>Block</th><th>Floor</th><th>Type</th><th>Restroom</th><th>Capacity</th><th>Occupied</th><th>Status</th></tr></thead>
          <tbody>
            {loading ? <SkeletonTable rows={8} cols={8} /> :
              paged.map(r => (
                <tr key={r._id}>
                  <td><strong>{r.roomNumber}</strong></td>
                  <td>{r.hostelBlock}</td>
                  <td>Floor {r.floor}</td>
                  <td><span className="badge badge-info">{r.roomType}</span></td>
                  <td><span className={`badge ${r.restroomType === 'Attached' ? 'badge-purple' : 'badge-gray'}`}>{r.restroomType}</span></td>
                  <td>{r.capacity}</td>
                  <td>{r.occupiedBeds}</td>
                  <td><span className={`badge ${r.status === 'Available' ? 'badge-success' : r.status === 'Maintenance' ? 'badge-warning' : r.status === 'Full' ? 'badge-danger' : 'badge-gray'}`}>{r.status}</span></td>
                </tr>
              ))
            }
          </tbody>
        </table>
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN REPORTS PAGE
═══════════════════════════════════════════════════════════ */
const TABS = [
  { id: 'leave',     icon: 'fa-calendar-check',     label: 'Leave' },
  { id: 'student',   icon: 'fa-users',              label: 'Student' },
  { id: 'complaint', icon: 'fa-triangle-exclamation', label: 'Complaint' },
  { id: 'occupancy', icon: 'fa-building-user',      label: 'Occupancy' },
  { id: 'faculty',   icon: 'fa-chalkboard-teacher', label: 'Faculty' },
  { id: 'room',      icon: 'fa-door-open',          label: 'Room' },
];

export default function Reports() {
  const { user } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('leave');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    getRecentActivitiesApi().then(res => setActivities(res.data || [])).catch(() => {});
  }, []);

  // Faculty only sees leave/student, Warden sees leave/complaint/occupancy/room
  const visibleTabs = TABS.filter(t => {
    if (user?.role === 'Faculty') return ['leave','student'].includes(t.id);
    if (user?.role === 'Warden')  return ['leave','complaint','occupancy','room'].includes(t.id);
    return true; // Admin sees all
  });

  const renderTab = () => {
    switch (activeTab) {
      case 'leave':     return <LeaveTab user={user} showToast={showToast} />;
      case 'student':   return <StudentTab showToast={showToast} />;
      case 'complaint': return <ComplaintTab showToast={showToast} />;
      case 'occupancy': return <OccupancyTab showToast={showToast} />;
      case 'faculty':   return <FacultyTab showToast={showToast} />;
      case 'room':      return <RoomTab showToast={showToast} />;
      default:          return null;
    }
  };

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Top bar */}
      <div className="topbar">
        <div>
          <div className="page-title" style={{ fontSize: '1.15rem' }}>
            <i className="fa-solid fa-file-chart-column" style={{ color: 'var(--primary)', marginRight: 10 }} />
            Reports & Analytics
          </div>
          <div className="page-subtitle">Generate, view and export detailed hostel reports</div>
        </div>
        <div className="topbar-right">
          <NotificationBell />
        </div>
      </div>

      {/* Two-column layout: main + activity feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Main report area */}
        <div>
          {/* Tabs */}
          <div className="cs-tabs">
            {visibleTabs.map(t => (
              <button
                key={t.id}
                className={`cs-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                id={`tab-${t.id}`}
              >
                <i className={`fa-solid ${t.icon}`} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="section-card">
            <div className="section-card-body">
              {renderTab()}
            </div>
          </div>
        </div>

        {/* Recent Activities Sidebar */}
        <div className="section-card">
          <div className="section-card-header">
            <div className="section-card-title">
              <i className="fa-solid fa-clock-rotate-left" />
              Recent Activities
            </div>
          </div>
          <div className="section-card-body" style={{ padding: '14px 18px' }}>
            <ActivityFeed activities={activities} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
