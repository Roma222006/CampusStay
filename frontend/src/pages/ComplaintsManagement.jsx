import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getComplaintsApi, fileComplaintApi, escalateComplaintApi } from '../services/api';

const ComplaintsManagement = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalatingComplaintId, setEscalatingComplaintId] = useState(null);
  const [escalationRemarks, setEscalationRemarks] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Form State
  const [form, setForm] = useState({
    title: '',
    category: 'Electrical',
    description: '',
    roomNumber: user?.roomNumber || '',
    complaintType: user?.studentType === 'Dayscholar' ? 'Campus' : 'Hostel'
  });

  const fetchComplaints = async () => {
    try {
      const res = await getComplaintsApi();
      const complaintsList = res.data?.complaints || res.data || [];
      setComplaints(complaintsList);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fileComplaintApi(form);
      setIsModalOpen(false);
      setForm({
        title: '',
        category: 'Electrical',
        description: '',
        roomNumber: user?.roomNumber || '',
        complaintType: user?.studentType === 'Dayscholar' ? 'Campus' : 'Hostel'
      });
      fetchComplaints();
    } catch (err) {
      console.error('Error filing complaint:', err);
      alert(err.response?.data?.message || 'Error filing complaint');
    }
  };

  const handleEscalateOpen = (complaintId) => {
    setEscalatingComplaintId(complaintId);
    setEscalationRemarks('');
    setIsEscalateModalOpen(true);
  };

  const handleEscalateSubmit = async (e) => {
    e.preventDefault();
    try {
      await escalateComplaintApi(escalatingComplaintId, escalationRemarks);
      setIsEscalateModalOpen(false);
      fetchComplaints();
      alert('Complaint escalated successfully!');
    } catch (err) {
      console.error('Error escalating complaint:', err);
      alert(err.response?.data?.message || 'Error escalating complaint');
    }
  };

  const filteredComplaints = filterCategory === 'All' 
    ? complaints 
    : complaints.filter(c => c.category === filterCategory);

  return (
    <Layout title="Hostel & Campus Complaints Support">
      <div className="glass-card" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>
              Maintenance Support & Ticket Tracking
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Report hostel issues directly to the Warden or campus faults directly to the Administrator.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <i className="fa-solid fa-screwdriver-wrench"></i> File New Complaint
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['All', 'Electrical', 'Plumbing', 'Furniture', 'Cleanliness', 'Internet', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Complaints List Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading tickets...</p>
        ) : filteredComplaints.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No complaints found.</p>
          </div>
        ) : (
          filteredComplaints.map(c => (
            <div key={c._id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="status-badge" style={{ backgroundColor: 'rgba(30, 58, 138, 0.08)', color: 'var(--primary-color)' }}>
                      {c.category}
                    </span>
                    <span className="status-badge" style={{ backgroundColor: c.complaintType === 'Campus' ? 'rgba(109, 40, 217, 0.08)' : 'rgba(15, 118, 110, 0.08)', color: c.complaintType === 'Campus' ? 'var(--accent-color)' : 'var(--secondary-color)' }}>
                      {c.complaintType || 'Hostel'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <StatusBadge status={c.status} />
                    {c.isEscalated && (
                      <span className="status-badge rejected" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        Escalated to Admin
                      </span>
                    )}
                  </div>
                </div>

                <h4 style={{ color: 'var(--primary-color)', fontSize: '1.1rem', marginBottom: '8px', fontWeight: 600 }}>
                  {c.title}
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', marginBottom: '16px', lineHeight: '1.5' }}>
                  {c.description}
                </p>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Room: <strong>{c.roomNumber || 'N/A'}</strong></span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>

                {c.remarks && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Response Remarks:</strong> {c.remarks}
                  </div>
                )}

                {c.isEscalated && c.escalationRemarks && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--danger-color)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--danger-color)' }}>
                    <strong>Escalation Notes:</strong> {c.escalationRemarks}
                  </div>
                )}

                {/* Escalation Action Button */}
                {user?.role === 'Student' && c.status !== 'Rectified' && c.status !== 'Rejected' && !c.isEscalated && (
                  <button 
                    onClick={() => handleEscalateOpen(c._id)} 
                    className="btn btn-outline btn-sm" 
                    style={{ width: '100%', marginTop: '16px', justifyContent: 'center', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                  >
                    <i className="fa-solid fa-circle-up"></i> Escalate Complaint
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* File Complaint Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="File Support Ticket">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Complaint Title</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Fan not working / Leaking pipe"
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Complaint Type</label>
              <select 
                className="form-control" 
                value={form.complaintType} 
                onChange={e => setForm({...form, complaintType: e.target.value})}
              >
                {user?.studentType === 'Hosteller' && (
                  <option value="Hostel">Hostel Issue (to Warden)</option>
                )}
                <option value="Campus">Campus Issue (to Admin)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                className="form-control" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Furniture">Furniture</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Internet">Internet / Wi-Fi</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {form.complaintType === 'Hostel' && (
            <div className="form-group">
              <label>Room Number</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. 101"
                required={form.complaintType === 'Hostel'}
                value={form.roomNumber} 
                onChange={e => setForm({...form, roomNumber: e.target.value})} 
              />
            </div>
          )}

          <div className="form-group">
            <label>Detailed Description</label>
            <textarea 
              className="form-control" 
              rows="3" 
              required 
              placeholder="Describe the issue in detail..."
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Ticket</button>
          </div>
        </form>
      </Modal>

      {/* Escalate Complaint Modal */}
      <Modal isOpen={isEscalateModalOpen} onClose={() => setIsEscalateModalOpen(false)} title="Escalate Unresolved Ticket">
        <form onSubmit={handleEscalateSubmit}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Escalating this ticket will report it directly to the Administrator for higher review.
          </p>
          <div className="form-group">
            <label>Reason for Escalation</label>
            <textarea 
              className="form-control" 
              rows="3" 
              required 
              placeholder="e.g. Warden has not responded / Issue remains ongoing after 3 days..."
              value={escalationRemarks} 
              onChange={e => setEscalationRemarks(e.target.value)}
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEscalateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}>
              Confirm Escalation
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ComplaintsManagement;
