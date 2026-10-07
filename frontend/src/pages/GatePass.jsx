import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getMyGatePassesApi,
  getAllGatePassesApi,
  requestGatePassApi,
  scanOrVerifyGatePassApi,
  getGateAnalyticsApi
} from '../services/api';

const GatePass = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const isWardenOrAdmin = user?.role === 'Warden' || user?.role === 'Admin';

  const [passes, setPasses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student Form Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [formData, setFormData] = useState({
    passType: 'Day Outing',
    purpose: '',
    destination: '',
    departureTime: '',
    expectedReturnTime: '',
    parentContact: ''
  });

  // Scanner / Quick Verify State (Warden/Admin)
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(isStudent ? 'my_passes' : 'scanner');

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isStudent) {
        const res = await getMyGatePassesApi();
        setPasses(res.data || []);
      } else {
        const [passRes, statRes] = await Promise.all([
          getAllGatePassesApi({ status: filterStatus }),
          getGateAnalyticsApi()
        ]);
        setPasses(passRes.data || []);
        setAnalytics(statRes.data || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gate pass data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await requestGatePassApi(formData);
      setSuccess(res.data.message || 'Gate pass created successfully!');
      setShowRequestModal(false);
      setFormData({
        passType: 'Day Outing',
        purpose: '',
        destination: '',
        departureTime: '',
        expectedReturnTime: '',
        parentContact: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request gate pass.');
    }
  };

  const handleScanVerify = async (identifier, actionType) => {
    setError('');
    setSuccess('');
    setScanResult(null);
    try {
      const payload = {
        passIdentifier: identifier || scanInput,
        action: actionType
      };
      const res = await scanOrVerifyGatePassApi(payload);
      setSuccess(res.data.message);
      setScanResult(res.data.pass);
      setScanInput('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Scan verification failed.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="badge badge-success"><i className="fa-solid fa-circle-check"></i> Ready at Gate</span>;
      case 'Active/Out':
        return <span className="badge badge-primary"><i className="fa-solid fa-person-walking-arrow-right"></i> Currently Out</span>;
      case 'Returned':
        return <span className="badge badge-secondary"><i className="fa-solid fa-house-chimney-user"></i> Returned</span>;
      case 'Overdue':
        return <span className="badge badge-danger" style={{ animation: 'pulse 1.5s infinite' }}><i className="fa-solid fa-triangle-exclamation"></i> OVERDUE RETURN</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const filteredPasses = passes.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.passCode?.toLowerCase().includes(q) ||
      p.student?.name?.toLowerCase().includes(q) ||
      p.student?.registerNumber?.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q)
    );
  });

  return (
    <Layout>
      <div className="gatepass-page">
        {/* Top Header Banner */}
        <div className="page-header" style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #0284C7 50%, #0F766E 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🎫</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Smart Digital Gate Pass & Terminal</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Dynamic QR verification, curfew tracking, automated check-in/out & security monitoring.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isStudent && (
              <button
                className="btn btn-primary"
                onClick={() => setShowRequestModal(true)}
                style={{
                  background: '#fff',
                  color: '#1E3A8A',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <i className="fa-solid fa-plus-circle"></i> Request Digital E-Pass
              </button>
            )}
            <button className="btn btn-outline" onClick={fetchData} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
              <i className="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-check"></i> {success}
          </div>
        )}

        {/* Warden/Admin Analytics Summary Bar */}
        {isWardenOrAdmin && analytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="card stat-card" style={{ borderLeft: '4px solid #3B82F6', padding: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Passes Today</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#1E3A8A', marginTop: '4px' }}>{analytics.totalToday}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved out passes</div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid #F59E0B', padding: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Currently Outside</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#D97706', marginTop: '4px' }}>{analytics.currentlyOut}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Students checked out</div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid #10B981', padding: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Returned Today</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#059669', marginTop: '4px' }}>{analytics.returnedToday}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checked back into campus</div>
            </div>

            <div className="card stat-card" style={{ borderLeft: '4px solid #EF4444', padding: '18px', background: analytics.overdueCount > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--surface)' }}>
              <div style={{ fontSize: '0.8rem', color: '#DC2626', textTransform: 'uppercase', fontWeight: '600' }}>Overdue Curfew Alert</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#DC2626', marginTop: '4px' }}>{analytics.overdueCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#DC2626' }}>Exceeded expected return time</div>
            </div>
          </div>
        )}

        {/* Warden / Admin Navigation Tabs */}
        {isWardenOrAdmin && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <button
              className={`btn ${activeTab === 'scanner' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('scanner')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-qrcode"></i> Gate Scanner Terminal
            </button>
            <button
              className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('list')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-list-check"></i> Outing Logs & Registry ({filteredPasses.length})
            </button>
          </div>
        )}

        {/* WARDEN / ADMIN SCANNER TERMINAL */}
        {isWardenOrAdmin && activeTab === 'scanner' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 450px) 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Scanner Input Card */}
            <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '1.8rem'
              }}>
                <i className="fa-solid fa-barcode"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>Gate Scan & Verification</h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Enter student Pass Code, QR Token, or ID to instantly check-in / check-out.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. GP-2609-4821 or Scan QR..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleScanVerify(scanInput); }}
                  style={{ fontSize: '0.95rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => handleScanVerify(scanInput)}
                  disabled={!scanInput.trim()}
                >
                  Verify
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  className="btn btn-sm"
                  style={{ background: '#0284C7', color: '#fff', fontSize: '0.8rem' }}
                  onClick={() => handleScanVerify(scanInput, 'checkout')}
                  disabled={!scanInput.trim()}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Force Check-Out
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: '#10B981', color: '#fff', fontSize: '0.8rem' }}
                  onClick={() => handleScanVerify(scanInput, 'checkin')}
                  disabled={!scanInput.trim()}
                >
                  <i className="fa-solid fa-arrow-right-to-bracket"></i> Force Check-In
                </button>
              </div>

              {/* Scan result display */}
              {scanResult && (
                <div style={{
                  marginTop: '10px',
                  padding: '16px',
                  background: scanResult.status === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${scanResult.status === 'Overdue' ? '#EF4444' : '#10B981'}`,
                  borderRadius: '12px',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{scanResult.student?.name || 'Student Verified'}</strong>
                    {getStatusBadge(scanResult.status)}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'grid', gap: '4px' }}>
                    <div><strong>Pass Code:</strong> {scanResult.passCode}</div>
                    <div><strong>Reg No:</strong> {scanResult.student?.registerNumber || 'N/A'}</div>
                    <div><strong>Destination:</strong> {scanResult.destination}</div>
                    <div><strong>Expected Return:</strong> {new Date(scanResult.expectedReturnTime).toLocaleString()}</div>
                    {scanResult.checkOutTime && <div><strong>Checked Out:</strong> {new Date(scanResult.checkOutTime).toLocaleTimeString()}</div>}
                    {scanResult.checkInTime && <div><strong>Checked In:</strong> {new Date(scanResult.checkInTime).toLocaleTimeString()}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Live Overdue Alert Feed */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#EF4444' }}></i>
                  Live Overdue Curfew Watchlist ({analytics?.overdueCount || 0})
                </h3>
                <span className="badge badge-danger">Real-time Watch</span>
              </div>

              {!analytics?.overdueList || analytics.overdueList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: '2.5rem', color: '#10B981', marginBottom: '12px' }}></i>
                  <p style={{ margin: 0, fontWeight: '600', color: 'var(--text)' }}>All Clear! No Overdue Students</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem' }}>All students on outing have checked in within the designated curfew window.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                  {analytics.overdueList.map(item => (
                    <div key={item._id} style={{
                      padding: '14px 16px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#B91C1C' }}>
                          {item.student?.name} ({item.student?.registerNumber || 'Student'})
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Block: {item.student?.hostelBlock || 'Hostel'} | Room: {item.student?.room || 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '2px' }}>
                          Curfew: {new Date(item.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (OVERDUE)
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {item.student?.parentPhone && (
                          <a
                            href={`tel:${item.student.parentPhone}`}
                            className="btn btn-sm btn-outline"
                            style={{ borderColor: '#EF4444', color: '#EF4444', fontSize: '0.75rem' }}
                            title="Call Parent"
                          >
                            <i className="fa-solid fa-phone"></i> Parent
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', background: '#10B981' }}
                          onClick={() => handleScanVerify(item.passCode, 'checkin')}
                        >
                          <i className="fa-solid fa-check"></i> Check-In Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STUDENT VIEW OR WARDEN LIST VIEW */}
        {(isStudent || (isWardenOrAdmin && activeTab === 'list')) && (
          <div className="card" style={{ padding: '24px' }}>
            {/* Filters Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Filter Status:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved / Ready</option>
                  <option value="Active/Out">Currently Out</option>
                  <option value="Returned">Returned</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div style={{ minWidth: '240px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, pass code, destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading gate passes...</p>
              </div>
            ) : filteredPasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-ticket" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '16px' }}></i>
                <h3>No Gate Passes Found</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '8px auto' }}>
                  {isStudent
                    ? 'You have not requested any digital outing passes yet. Click "Request Digital E-Pass" to generate one!'
                    : 'No gate passes match the selected filters.'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {filteredPasses.map(pass => (
                  <div
                    key={pass._id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      background: 'var(--surface)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top Decorative Stripe */}
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: '4px',
                      background: pass.status === 'Overdue'
                        ? '#EF4444'
                        : pass.status === 'Active/Out'
                        ? '#0284C7'
                        : pass.status === 'Returned'
                        ? '#10B981'
                        : 'var(--primary)'
                    }} />

                    {/* Pass Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          padding: '3px 8px',
                          background: 'rgba(30, 58, 138, 0.1)',
                          color: '#1E3A8A',
                          borderRadius: '6px'
                        }}>
                          {pass.passType}
                        </span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.5px', marginTop: '6px', color: 'var(--text)' }}>
                          {pass.passCode}
                        </div>
                      </div>
                      {getStatusBadge(pass.status)}
                    </div>

                    {/* Student Info */}
                    <div style={{
                      padding: '10px 12px',
                      background: 'var(--background)',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      display: 'grid',
                      gap: '3px'
                    }}>
                      <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                        {pass.student?.name || user?.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Reg: {pass.student?.registerNumber || user?.registerNumber || 'Resident'} | {pass.student?.hostelBlock || 'Hostel Block'}
                      </div>
                    </div>

                    {/* Outing Details */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'grid', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: '#EF4444', width: '16px' }}></i>
                        <span><strong>Destination:</strong> {pass.destination}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-clipboard-question" style={{ color: '#F59E0B', width: '16px' }}></i>
                        <span><strong>Purpose:</strong> {pass.purpose}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-clock" style={{ color: '#3B82F6', width: '16px' }}></i>
                        <span><strong>Expected Return:</strong> {new Date(pass.expectedReturnTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Simulated Dynamic QR Code Banner */}
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        background: '#0F172A',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '1.5rem',
                        flexShrink: 0
                      }}>
                        <i className="fa-solid fa-qrcode"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0F172A' }}>DIGITAL VERIFICATION TOKEN</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pass.qrPayload}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons for Warden/Admin */}
                    {isWardenOrAdmin && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                        {pass.status === 'Approved' && (
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ flex: 1, fontSize: '0.78rem' }}
                            onClick={() => handleScanVerify(pass.passCode, 'checkout')}
                          >
                            <i className="fa-solid fa-person-walking-arrow-right"></i> Check Out
                          </button>
                        )}
                        {(pass.status === 'Active/Out' || pass.status === 'Overdue') && (
                          <button
                            className="btn btn-sm"
                            style={{ flex: 1, fontSize: '0.78rem', background: '#10B981', color: '#fff' }}
                            onClick={() => handleScanVerify(pass.passCode, 'checkin')}
                          >
                            <i className="fa-solid fa-house-chimney-user"></i> Check In
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student Request Pass Modal */}
        {showRequestModal && (
          <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="modal-content card" style={{
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>
                  <i className="fa-solid fa-ticket" style={{ color: '#0284C7', marginRight: '8px' }}></i>
                  Request Digital Outing Pass
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowRequestModal(false)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleRequestSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Outing Category</label>
                  <select
                    className="form-control"
                    value={formData.passType}
                    onChange={(e) => setFormData({ ...formData, passType: e.target.value })}
                  >
                    <option value="Day Outing">Day Outing (Standard Curfew)</option>
                    <option value="Weekend Leave">Weekend Pass</option>
                    <option value="Emergency Leave">Emergency Outing</option>
                    <option value="Campus Outing">Campus Official Errand</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Destination Location *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. City Mall, Home, Central Library"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Purpose of Outing *</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Explain purpose for warden & security records..."
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Departure Time *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={formData.departureTime}
                      onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Curfew Return *</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      required
                      value={formData.expectedReturnTime}
                      onChange={(e) => setFormData({ ...formData, expectedReturnTime: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Parent / Emergency Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={formData.parentContact}
                    onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowRequestModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-qrcode"></i> Generate E-Pass
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GatePass;
