/**
 * AdminRoomManagement.jsx
 * Full admin room dashboard: animated room cards, block/floor tabs,
 * capacity bars, filters, search, pagination, allocation/transfer/swap/maintenance modals,
 * occupancy donut chart, and room-type distribution bar chart.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import NotificationBell from '../components/NotificationBell';
import Pagination from '../components/common/Pagination';
import ToastContainer from '../components/common/Toast';
import { SkeletonCards } from '../components/common/Skeleton';
import { useToast } from '../hooks/useToast';
import {
  getRoomsApi, getHostelBlocksApi, getDashboardMetricsApi,
  updateRoomStatusApi, deleteRoomApi,
  allocateStudentApi, transferStudentApi, swapStudentsApi,
  getAllStudentsApi,
} from '../services/api';

const ROOMS_PER_PAGE = 12;

/* ── Status badge helper ───────────────────────────────── */
function RoomStatusBadge({ status }) {
  const map = {
    Available:   'badge-success',
    Full:        'badge-danger',
    Maintenance: 'badge-warning',
    Locked:      'badge-gray',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

/* ── Donut Chart (SVG) ─────────────────────────────────── */
function DonutChart({ occupied, vacant, maintenance }) {
  const total = occupied + vacant + maintenance;
  if (total === 0) return <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>No data</p>;

  const cx = 80, cy = 80, r = 58, stroke = 22;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: occupied,    color: 'var(--primary)', label: 'Occupied' },
    { value: vacant,      color: '#22C55E',        label: 'Vacant' },
    { value: maintenance, color: '#F97316',         label: 'Maintenance' },
  ];

  let offset = 0;
  const paths = segments.map((seg, i) => {
    const pct = seg.value / total;
    const dashArray = `${pct * circumference} ${circumference}`;
    const rotation = `rotate(${offset * 360 - 90}, ${cx}, ${cy})`;
    offset += pct;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={stroke}
        strokeDasharray={dashArray}
        strokeDashoffset="0"
        transform={rotation}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    );
  });

  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-solid)" strokeWidth={stroke} />
          {paths}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{pct}%</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Occupied</span>
        </div>
      </div>
      <div className="chart-legend" style={{ flexDirection: 'column', gap: 10 }}>
        {segments.map(s => (
          <div key={s.label} className="legend-item">
            <div className="legend-dot" style={{ background: s.color }} />
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.label}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bar chart (Room types) ────────────────────────────── */
function RoomTypeBar({ rooms }) {
  const types = ['Single', 'Double', 'Triple', 'Four Sharing'];
  const colors = ['#3B82F6', '#22C55E', '#F97316', '#8B5CF6'];
  const counts = types.map(t => rooms.filter(r => r.roomType === t).length);
  const maxVal = Math.max(...counts, 1);

  return (
    <div>
      {types.map((t, i) => (
        <div key={t} className="bar-chart-row" style={{ marginBottom: 10 }}>
          <span className="bar-label">{t}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(counts[i] / maxVal) * 100}%`, background: colors[i] }}
            />
          </div>
          <span className="bar-value">{counts[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Room Card ─────────────────────────────────────────── */
function RoomCard({ room, onAction }) {
  const pct = room.capacity > 0 ? room.occupiedBeds / room.capacity : 0;
  const isMaintenace = room.status === 'Maintenance';

  return (
    <div
      className={`room-card ${isMaintenace ? 'room-card--maintenance' : ''} ${room.occupiedBeds >= room.capacity ? 'room-card--full' : ''}`}
      style={{ animationDelay: `${Math.random() * 0.1}s` }}
    >
      {/* Header */}
      <div className="room-card-header">
        <div>
          <div className="room-number">Room {room.roomNumber}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Floor {room.floor} · {room.hostelBlock?.split(' ')[0]}
          </div>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      {/* Type badges */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{room.roomType}</span>
        <span className={`badge ${room.restroomType === 'Attached' ? 'badge-purple' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
          {room.restroomType}
        </span>
      </div>

      {/* Capacity bar */}
      <div className="room-capacity-bar">
        {Array.from({ length: room.capacity }).map((_, i) => (
          <div
            key={i}
            className={`bed-dot ${i < room.occupiedBeds ? 'bed-dot--occupied' : 'bed-dot--vacant'}`}
            title={i < room.occupiedBeds ? 'Occupied' : 'Vacant'}
          />
        ))}
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 4 }}>
          {room.occupiedBeds}/{room.capacity}
        </span>
      </div>

      {/* Occupants */}
      {room.currentStudents?.length > 0 && (
        <div className="room-occupants">
          {room.currentStudents.slice(0, 3).map(s => (
            <div key={s._id} className="room-occupant-chip">
              <i className="fa-solid fa-user" style={{ fontSize: '0.65rem' }} />
              <span>{s.name}</span>
            </div>
          ))}
          {room.currentStudents.length > 3 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>+{room.currentStudents.length - 3} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {room.occupiedBeds < room.capacity && room.status === 'Available' && (
          <button className="btn btn-primary btn-xs" onClick={() => onAction('allocate', room)}>
            <i className="fa-solid fa-user-plus" /> Allocate
          </button>
        )}
        {room.occupiedBeds > 0 && (
          <button className="btn btn-outline btn-xs" onClick={() => onAction('transfer', room)}>
            <i className="fa-solid fa-right-left" /> Transfer
          </button>
        )}
        {room.status !== 'Maintenance' ? (
          <button className="btn btn-warning btn-xs" onClick={() => onAction('maintenance', room)}>
            <i className="fa-solid fa-wrench" />
          </button>
        ) : (
          <button className="btn btn-success btn-xs" onClick={() => onAction('restore', room)}>
            <i className="fa-solid fa-check" /> Restore
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function AdminRoomManagement() {
  const { toasts, showToast, removeToast } = useToast();

  const [rooms, setRooms] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedType,  setSelectedType]  = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal state
  const [modal, setModal] = useState(null); // { type, room }
  const [allocateStudentId, setAllocateStudentId] = useState('');
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferTargetRoomId, setTransferTargetRoomId] = useState('');
  const [swapStudent1, setSwapStudent1] = useState('');
  const [swapStudent2, setSwapStudent2] = useState('');
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, blocksRes, metricsRes, studentsRes] = await Promise.allSettled([
        getRoomsApi(),
        getHostelBlocksApi(),
        getDashboardMetricsApi(),
        getAllStudentsApi({ studentType: 'Hosteller' }),
      ]);

      if (roomsRes.status === 'fulfilled') setRooms(roomsRes.value.data || []);
      if (blocksRes.status === 'fulfilled') {
        const d = blocksRes.value.data;
        setBlocks(Array.isArray(d) ? d : (d?.blocks || []));
      }
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data?.students || studentsRes.value.data || []);
    } catch (err) {
      showToast('Failed to load room data.', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (selectedBlock && r.hostelBlock !== selectedBlock) return false;
      if (selectedFloor !== '' && String(r.floor) !== String(selectedFloor)) return false;
      if (selectedType && r.roomType !== selectedType) return false;
      if (selectedStatus && r.status !== selectedStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.roomNumber.toLowerCase().includes(q) ||
          r.hostelBlock.toLowerCase().includes(q) ||
          r.currentStudents?.some(s => s.name?.toLowerCase().includes(q) || s.registerNumber?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [rooms, selectedBlock, selectedFloor, selectedType, selectedStatus, search]);

  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
  const pageRooms  = filteredRooms.slice((page - 1) * ROOMS_PER_PAGE, page * ROOMS_PER_PAGE);

  const openModal = (type, room) => { setModal({ type, room }); };
  const closeModal = () => { setModal(null); setMaintenanceNote(''); setAllocateStudentId(''); setTransferStudentId(''); setTransferTargetRoomId(''); };

  /* ── Action handlers ── */
  const handleAllocate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await allocateStudentApi({ studentId: allocateStudentId });
      showToast('Student allocated successfully!', 'success');
      closeModal(); fetchData();
    } catch (err) { showToast(err.response?.data?.message || 'Allocation failed.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await transferStudentApi({ studentId: transferStudentId, targetRoomId: transferTargetRoomId });
      showToast('Student transferred successfully!', 'success');
      closeModal(); fetchData();
    } catch (err) { showToast(err.response?.data?.message || 'Transfer failed.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleSwap = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await swapStudentsApi({ studentId1: swapStudent1, studentId2: swapStudent2 });
      showToast('Room swap completed!', 'success');
      closeModal(); fetchData();
    } catch (err) { showToast(err.response?.data?.message || 'Swap failed.', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleMaintenanceToggle = async () => {
    if (!modal?.room) return;
    setSubmitting(true);
    const newStatus = modal.type === 'maintenance' ? 'Maintenance' : 'Available';
    try {
      await updateRoomStatusApi(modal.room._id, { status: newStatus, maintenanceNote: maintenanceNote || '' });
      showToast(`Room marked as ${newStatus}.`, newStatus === 'Maintenance' ? 'warning' : 'success');
      closeModal(); fetchData();
    } catch (err) { showToast('Failed to update room status.', 'error'); }
    finally { setSubmitting(false); }
  };

  const unallocatedStudents = students.filter(s => !s.room);
  const allocatedStudents   = students.filter(s => s.room);

  /* ── Floors available ── */
  const availableFloors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* ── Top bar ── */}
      <div className="topbar">
        <div>
          <div className="page-title" style={{ fontSize: '1.15rem' }}>
            <i className="fa-solid fa-building-user" style={{ color: 'var(--primary)', marginRight: 10 }} />
            Room Management
          </div>
        </div>
        <div className="topbar-right">
          <NotificationBell />
          <button className="btn btn-primary btn-sm" onClick={() => openModal('swap', null)}>
            <i className="fa-solid fa-right-left" /> Swap Rooms
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { icon: 'fa-bed',          label: 'Total Capacity',    value: metrics?.totalBedCapacity   || 0, cls: '' },
          { icon: 'fa-user-check',   label: 'Occupied Beds',     value: metrics?.occupiedBeds       || 0, cls: 'badge-info' },
          { icon: 'fa-bed',          label: 'Vacant Beds',       value: metrics?.vacantBeds         || 0, cls: 'badge-success' },
          { icon: 'fa-door-open',    label: 'Total Rooms',       value: metrics?.totalRooms         || 0, cls: '' },
          { icon: 'fa-wrench',       label: 'Under Maintenance', value: metrics?.maintenanceRooms   || 0, cls: 'badge-warning' },
          { icon: 'fa-percent',      label: 'Occupancy Rate',    value: `${metrics?.occupancyPercentage || 0}%`, cls: '' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon"><i className={`fa-solid ${s.icon}`} /></div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="charts-row">
        <div className="chart-wrapper">
          <div className="chart-title"><i className="fa-solid fa-chart-pie" /> Occupancy Overview</div>
          <DonutChart
            occupied={metrics?.occupiedBeds || 0}
            vacant={metrics?.vacantBeds || 0}
            maintenance={metrics?.maintenanceRooms || 0}
          />
        </div>
        <div className="chart-wrapper">
          <div className="chart-title"><i className="fa-solid fa-chart-bar" /> Room Types Distribution</div>
          <RoomTypeBar rooms={rooms} />
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div className="cs-search-bar" style={{ marginTop: 24 }}>
        <div className="cs-search-input-wrap">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            id="room-search"
            className="cs-search-input"
            placeholder="Search rooms, students, register no…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="filter-select" value={selectedBlock} onChange={e => { setSelectedBlock(e.target.value); setPage(1); }}>
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
        </select>

        <select className="filter-select" value={selectedFloor} onChange={e => { setSelectedFloor(e.target.value); setPage(1); }}>
          <option value="">All Floors</option>
          {availableFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
        </select>

        <select className="filter-select" value={selectedType} onChange={e => { setSelectedType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          {['Single','Double','Triple','Four Sharing'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select className="filter-select" value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {['Available','Full','Maintenance','Locked'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {(search || selectedBlock || selectedFloor || selectedType || selectedStatus) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSelectedBlock(''); setSelectedFloor(''); setSelectedType(''); setSelectedStatus(''); setPage(1); }}>
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
      </div>

      {/* ── Results count ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{filteredRooms.length}</strong> rooms
          {search && <> matching "<strong>{search}</strong>"</>}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-success">{rooms.filter(r => r.occupiedBeds === 0 && r.status === 'Available').length} Empty</span>
          <span className="badge badge-info">{rooms.filter(r => r.occupiedBeds > 0 && r.occupiedBeds < r.capacity).length} Partial</span>
          <span className="badge badge-danger">{rooms.filter(r => r.occupiedBeds >= r.capacity).length} Full</span>
        </div>
      </div>

      {/* ── Room Cards Grid ── */}
      <div className="cards-grid">
        {loading ? (
          <SkeletonCards count={ROOMS_PER_PAGE} height={200} />
        ) : pageRooms.length === 0 ? (
          <div className="cs-empty" style={{ gridColumn: '1 / -1' }}>
            <i className="fa-solid fa-door-closed" />
            <p>No rooms found matching the current filters.</p>
          </div>
        ) : (
          pageRooms.map(room => (
            <RoomCard key={room._id} room={room} onAction={openModal} />
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* ══════════════ MODALS ══════════════ */}

      {/* Allocate Student */}
      {modal?.type === 'allocate' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-user-plus" style={{color:'var(--primary)',marginRight:8}} />Allocate Student to Room {modal.room?.roomNumber}</h3>
              <button className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAllocate}>
                <div className="form-group">
                  <label>Select Unallocated Student</label>
                  <select className="form-control" required value={allocateStudentId} onChange={e => setAllocateStudentId(e.target.value)}>
                    <option value="">Choose student…</option>
                    {unallocatedStudents.map(s => (
                      <option key={s._id} value={s._id}>{s.name} — {s.registerNumber || s.department}</option>
                    ))}
                  </select>
                </div>
                {unallocatedStudents.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No unallocated students available.</p>
                )}
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !allocateStudentId}>
                    {submitting ? 'Allocating…' : 'Allocate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Student */}
      {modal?.type === 'transfer' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-right-left" style={{color:'var(--primary)',marginRight:8}} />Transfer Student</h3>
              <button className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleTransfer}>
                <div className="form-group">
                  <label>Student to Transfer (from Room {modal.room?.roomNumber})</label>
                  <select className="form-control" required value={transferStudentId} onChange={e => setTransferStudentId(e.target.value)}>
                    <option value="">Choose student…</option>
                    {(modal.room?.currentStudents || []).map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Target Room</label>
                  <select className="form-control" required value={transferTargetRoomId} onChange={e => setTransferTargetRoomId(e.target.value)}>
                    <option value="">Select target room…</option>
                    {rooms.filter(r => r._id !== modal.room?._id && r.occupiedBeds < r.capacity && r.status === 'Available').map(r => (
                      <option key={r._id} value={r._id}>
                        {r.hostelBlock} — Room {r.roomNumber} (Floor {r.floor}) [{r.occupiedBeds}/{r.capacity}]
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Transferring…' : 'Confirm Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Swap Students */}
      {modal?.type === 'swap' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-right-left" style={{color:'var(--primary)',marginRight:8}} />Swap Two Students' Rooms</h3>
              <button className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSwap}>
                <div className="form-group">
                  <label>Student A</label>
                  <select className="form-control" required value={swapStudent1} onChange={e => setSwapStudent1(e.target.value)}>
                    <option value="">Choose student A…</option>
                    {allocatedStudents.filter(s => s._id !== swapStudent2).map(s => (
                      <option key={s._id} value={s._id}>{s.name} — {s.registerNumber}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Student B</label>
                  <select className="form-control" required value={swapStudent2} onChange={e => setSwapStudent2(e.target.value)}>
                    <option value="">Choose student B…</option>
                    {allocatedStudents.filter(s => s._id !== swapStudent1).map(s => (
                      <option key={s._id} value={s._id}>{s.name} — {s.registerNumber}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <i className="fa-solid fa-circle-info" style={{marginRight:6}} />
                  Both students must already be allocated to rooms. Their rooms will be swapped.
                </p>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !swapStudent1 || !swapStudent2}>
                    {submitting ? 'Swapping…' : 'Confirm Swap'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mark Maintenance / Restore */}
      {(modal?.type === 'maintenance' || modal?.type === 'restore') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <i className={`fa-solid ${modal.type === 'maintenance' ? 'fa-wrench' : 'fa-check-circle'}`} style={{color:'var(--primary)',marginRight:8}} />
                {modal.type === 'maintenance' ? `Mark Room ${modal.room?.roomNumber} as Maintenance` : `Restore Room ${modal.room?.roomNumber}`}
              </h3>
              <button className="modal-close" onClick={closeModal}><i className="fa-solid fa-xmark" /></button>
            </div>
            <div className="modal-body">
              {modal.type === 'maintenance' && (
                <div className="form-group">
                  <label>Maintenance Reason <span style={{color:'var(--text-muted)',fontWeight:400}}>(optional)</span></label>
                  <textarea className="form-control" rows={3} placeholder="e.g. Plumbing repair, electrical work…" value={maintenanceNote} onChange={e => setMaintenanceNote(e.target.value)} />
                </div>
              )}
              {modal.type === 'restore' && (
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  This will mark Room {modal.room?.roomNumber} as <strong>Available</strong> and allow new allocations.
                </p>
              )}
              {modal.room?.occupiedBeds > 0 && modal.type === 'maintenance' && (
                <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{color:'#D97706', marginRight:8}} />
                  <span style={{ fontSize: '0.82rem', color: '#92400E' }}>
                    This room has {modal.room.occupiedBeds} occupant(s). They must be transferred first.
                  </span>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button
                  className={`btn ${modal.type === 'maintenance' ? 'btn-warning' : 'btn-success'}`}
                  onClick={handleMaintenanceToggle}
                  disabled={submitting || (modal.type === 'maintenance' && modal.room?.occupiedBeds > 0)}
                >
                  {submitting ? 'Updating…' : modal.type === 'maintenance' ? 'Mark Maintenance' : 'Restore Room'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
