import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  triggerSOSApi,
  getEmergencyAlertsApi,
  updateEmergencyStatusApi
} from '../services/api';

const EmergencyHub = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const isWardenOrAdmin = user?.role === 'Warden' || user?.role === 'Admin';

  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // SOS modal / form state
  const [selectedSosType, setSelectedSosType] = useState('Medical');
  const [locationDetails, setLocationDetails] = useState('');
  const [sosNotes, setSosNotes] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || user?.emergencyContact || '');
  const [triggering, setTriggering] = useState(false);

  // Resolution modal
  const [resolveModalAlert, setResolveModalAlert] = useState(null);
  const [resolveActionNote, setResolveActionNote] = useState('');

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Polling every 15s for live distress alerts
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await getEmergencyAlertsApi();
      setAlerts(res.data?.alerts || []);
      setActiveCount(res.data?.activeCount || 0);
    } catch (err) {
      console.error('Error fetching emergency alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSOS = async (type) => {
    setError('');
    setMessage('');
    setTriggering(true);
    try {
      const res = await triggerSOSApi({
        emergencyType: type || selectedSosType,
        severity: 'Critical',
        locationDetails: locationDetails || `${user?.hostelBlock || 'Hostel Block'}, Room ${user?.room || 'Resident Area'}`,
        contactPhone: contactPhone || user?.phone || '',
        notes: sosNotes || 'Immediate assistance requested by resident.'
      });
      setMessage(res.data.message);
      setSosNotes('');
      fetchAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch SOS beacon.');
    } finally {
      setTriggering(false);
    }
  };

  const handleUpdateStatus = async (alertId, newStatus, note) => {
    try {
      const res = await updateEmergencyStatusApi(alertId, {
        status: newStatus,
        actionNote: note || `Status transitioned to ${newStatus}`
      });
      setMessage(res.data.message);
      setResolveModalAlert(null);
      setResolveActionNote('');
      fetchAlerts();
    } catch (err) {
      setError('Failed to update alert status.');
    }
  };

  const emergencyTypes = [
    { type: 'Medical', title: 'Medical Emergency', icon: 'fa-truck-medical', color: '#EF4444', desc: 'Severe injury, asthma, allergy, fainting, or acute illness.' },
    { type: 'Security Threat', title: 'Security / Threat', icon: 'fa-shield-halved', color: '#DC2626', desc: 'Trespassing, physical dispute, harassment, or intruder.' },
    { type: 'Fire & Hazard', title: 'Fire & Hazard', icon: 'fa-fire-flame-curved', color: '#EA580C', desc: 'Electrical short circuit, smoke, gas leak, or fire outbreak.' },
    { type: 'Mental Health / Distress', title: 'Distress / Mental Health', icon: 'fa-heart-pulse', color: '#8B5CF6', desc: 'Urgent emotional support, anxiety panic, or peer distress.' },
    { type: 'Hostel Facility Disaster', title: 'Facility Disaster', icon: 'fa-faucet-drip', color: '#0284C7', desc: 'Severe water pipe burst, power failure, structural breakdown.' }
  ];

  return (
    <Layout>
      <div className="emergency-hub-page">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #B91C1C 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {activeCount > 0 && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: '#FEF08A', color: '#854D0E',
              padding: '4px 14px', fontSize: '0.75rem', fontWeight: '800',
              borderBottomLeftRadius: '10px',
              animation: 'pulse 1.5s infinite'
            }}>
              🚨 {activeCount} ACTIVE DISTRESS BEACON(S)
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🚨</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Campus Emergency SOS & Rapid Dispatch</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Immediate 1-tap distress beacons, live warden/security command center, and emergency helpline directory.
            </p>
          </div>

          <button className="btn btn-outline" onClick={fetchAlerts} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
            <i className="fa-solid fa-arrows-rotate"></i> Live Refresh
          </button>
        </div>

        {/* Alerts */}
        {message && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-check"></i> {message}
          </div>
        )}
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}

        {/* Emergency Helplines Quick Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <i className="fa-solid fa-ambulance" style={{ fontSize: '1.4rem', color: '#EF4444' }}></i>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Campus Medical Center</div>
              <a href="tel:108" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#DC2626', textDecoration: 'none' }}>+91 91100 00108</a>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <i className="fa-solid fa-shield" style={{ fontSize: '1.4rem', color: '#2563EB' }}></i>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security Main Gate</div>
              <a href="tel:100" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1E3A8A', textDecoration: 'none' }}>+91 94444 00100</a>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)' }}>
            <i className="fa-solid fa-fire-extinguisher" style={{ fontSize: '1.4rem', color: '#EA580C' }}></i>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fire & Disaster Response</div>
              <a href="tel:101" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#C2410C', textDecoration: 'none' }}>+91 98888 00101</a>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <i className="fa-solid fa-headset" style={{ fontSize: '1.4rem', color: '#8B5CF6' }}></i>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>24x7 Student Counselor</div>
              <a href="tel:112" style={{ fontSize: '0.95rem', fontWeight: '800', color: '#7C3AED', textDecoration: 'none' }}>+91 97777 00112</a>
            </div>
          </div>
        </div>

        {/* 1-TAP SOS DISTRESS BUTTON CONSOLE (Student) */}
        {isStudent && (
          <div className="card" style={{
            padding: '28px',
            marginBottom: '28px',
            border: '2px solid #EF4444',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.03) 0%, var(--surface) 100%)'
          }}>
            <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 24px auto' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Instant Emergency Beacon
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', margin: '4px 0 8px 0' }}>
                Need Immediate Help? Press to Dispatch Support
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Triggering any distress button instantly transmits your registered room ({user?.hostelBlock || 'Hostel'}, Room {user?.room || 'Resident'}), identity, and phone to Warden & Campus Security.
              </p>
            </div>

            {/* Quick SOS Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {emergencyTypes.map(sos => (
                <div
                  key={sos.type}
                  onClick={() => {
                    setSelectedSosType(sos.type);
                    handleTriggerSOS(sos.type);
                  }}
                  style={{
                    border: `1.5px solid ${sos.color}`,
                    borderRadius: '14px',
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--surface)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 10px 25px -5px ${sos.color}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: `${sos.color}15`,
                    color: sos.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem'
                  }}>
                    <i className={`fa-solid ${sos.icon}`}></i>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text)' }}>
                      {sos.title}
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                      {sos.desc}
                    </p>
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{
                      marginTop: 'auto',
                      width: '100%',
                      background: sos.color,
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: '700'
                    }}
                    disabled={triggering}
                  >
                    🚨 Trigger {sos.type}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVE DISTRESS BEACON FEED & EMERGENCY LOGS */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                <i className="fa-solid fa-satellite-dish" style={{ color: '#DC2626', marginRight: '8px' }}></i>
                Emergency Distress Incident Feed
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time incident log across hostel blocks and campus facilities.
              </p>
            </div>
            <span className="badge badge-secondary">{alerts.length} Total Incidents</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
            </div>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-shield-heart" style={{ fontSize: '3rem', color: '#10B981', marginBottom: '16px' }}></i>
              <h3>No Active Emergency Incidents</h3>
              <p style={{ fontSize: '0.9rem' }}>All hostel blocks and resident zones are currently secure.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {alerts.map(alert => (
                <div
                  key={alert._id}
                  style={{
                    border: `1.5px solid ${alert.status === 'Active' ? '#EF4444' : alert.status === 'Dispatched' ? '#F59E0B' : 'var(--border)'}`,
                    background: alert.status === 'Active' ? 'rgba(239, 68, 68, 0.04)' : 'var(--surface)',
                    borderRadius: '12px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: alert.status === 'Active' ? '#EF4444' : '#10B981',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                      }}>
                        <i className={`fa-solid ${alert.emergencyType === 'Medical' ? 'fa-truck-medical' : alert.emergencyType === 'Fire & Hazard' ? 'fa-fire' : 'fa-triangle-exclamation'}`}></i>
                      </span>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text)' }}>
                          {alert.emergencyType} Distress — {alert.studentName} ({alert.registerNumber})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {new Date(alert.createdAt).toLocaleString()} | Block: {alert.hostelBlock} (Room: {alert.roomNumber})
                        </div>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: alert.status === 'Active' ? '#FEE2E2' : alert.status === 'Dispatched' ? '#FEF3C7' : '#DCFCE7',
                      color: alert.status === 'Active' ? '#DC2626' : alert.status === 'Dispatched' ? '#D97706' : '#16A34A'
                    }}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Location & Notes */}
                  <div style={{
                    padding: '10px 14px',
                    background: 'var(--background)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    display: 'grid',
                    gap: '4px'
                  }}>
                    <div><strong>📍 Incident Location:</strong> {alert.locationDetails}</div>
                    {alert.notes && <div><strong>📝 Notes:</strong> {alert.notes}</div>}
                    {alert.contactPhone && (
                      <div>
                        <strong>📞 Resident Phone:</strong>{' '}
                        <a href={`tel:${alert.contactPhone}`} style={{ color: '#2563EB', fontWeight: '700' }}>
                          {alert.contactPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions for Warden/Admin */}
                  {isWardenOrAdmin && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '6px' }}>
                      {alert.status === 'Active' && (
                        <button
                          className="btn btn-sm btn-primary"
                          style={{ background: '#F59E0B', color: '#000', fontWeight: '700', fontSize: '0.78rem' }}
                          onClick={() => handleUpdateStatus(alert._id, 'Dispatched', 'Security & Medical team dispatched to location')}
                        >
                          <i className="fa-solid fa-person-running"></i> Mark Team Dispatched
                        </button>
                      )}

                      {alert.status !== 'Resolved' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: '#10B981', color: '#10B981', fontWeight: '700', fontSize: '0.78rem' }}
                          onClick={() => setResolveModalAlert(alert)}
                        >
                          <i className="fa-solid fa-check-double"></i> Resolve Incident
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolve Modal */}
        {resolveModalAlert && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '450px', width: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                  Resolve Emergency Incident
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setResolveModalAlert(null)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Resolution Action Notes *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Explain actions taken (e.g. Student escorted to health center, electrical line isolated)..."
                  value={resolveActionNote}
                  onChange={(e) => setResolveActionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setResolveModalAlert(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ background: '#10B981' }}
                  onClick={() => handleUpdateStatus(resolveModalAlert._id, 'Resolved', resolveActionNote)}
                >
                  Confirm & Resolve Incident
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmergencyHub;
