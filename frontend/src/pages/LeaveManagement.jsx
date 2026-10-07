import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { getLeavesApi, applyLeaveApi, downloadStudentApprovedLeavesPDFApi } from '../services/api';

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Apply Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    priority: 'Medium',
    startDate: '',
    endDate: '',
    reason: '',
    parentContact: '',
    parentConsent: false
  });

  const fetchLeaves = async () => {
    try {
      const res = await getLeavesApi();
      const leavesList = res.data?.leaves || res.data || [];
      setLeaves(leavesList);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await applyLeaveApi({
        leaveType: leaveForm.leaveType,
        priority: leaveForm.priority,
        fromDate: leaveForm.startDate,
        toDate: leaveForm.endDate,
        reason: leaveForm.reason,
        parentContact: leaveForm.parentContact
      });
      setIsApplyModalOpen(false);
      setLeaveForm({
        leaveType: 'Casual',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        reason: '',
        parentContact: '',
        parentConsent: false
      });
      fetchLeaves();
    } catch (err) {
      console.error('Error applying for leave:', err);
      alert(err.response?.data?.message || 'Error applying for leave');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await downloadStudentApprovedLeavesPDFApi();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${user?.name || 'Student'}_Approved_Leaves_Report.pdf`;
      link.click();
    } catch (err) {
      console.error('Error downloading leaves report:', err);
      alert('Failed to download leave report.');
    }
  };

  const filteredLeaves = filterStatus === 'All' 
    ? leaves 
    : leaves.filter(l => {
        if (filterStatus === 'Pending') return l.status.startsWith('Pending');
        if (filterStatus === 'Approved') return l.status.startsWith('Approved');
        if (filterStatus === 'Rejected') return l.status.startsWith('Rejected');
        return l.status === filterStatus;
      });

  return (
    <Layout title="Leave Applications Management">
      <div className="glass-card" style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>
              Leave Request Portal
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Multi-level verification system: Faculty Advisor Approval → Hostel Warden Final Sign-off
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {user?.role === 'Student' && (
              <>
                <button className="btn btn-primary" onClick={() => setIsApplyModalOpen(true)}>
                  <i className="fa-solid fa-plus"></i> Apply for Leave
                </button>
                <button onClick={handleDownloadPDF} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-file-pdf" style={{ color: 'var(--danger-color)' }}></i> Download Report (PDF)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Leaves Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                {user?.role !== 'Student' && <th>Student</th>}
                <th>Type</th>
                <th>Priority</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Overall Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={user?.role !== 'Student' ? 7 : 6} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading leave requests...
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'Student' ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    No leave records found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l._id}>
                    {user?.role !== 'Student' && (
                      <td style={{ fontWeight: 600 }}>{l.student?.name || 'Student'} ({l.student?.registerNumber || 'N/A'})</td>
                    )}
                    <td>{l.leaveType || 'Casual'}</td>
                    <td>
                      <span className={`status-badge ${l.priority === 'High/Emergency' ? 'rejected' : l.priority === 'Medium' ? 'pending' : 'approved'}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {l.priority || 'Medium'}
                      </span>
                    </td>
                    <td>{new Date(l.fromDate || l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.toDate || l.endDate).toLocaleDateString()}</td>
                    <td>{l.reason}</td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="New Leave Application">
        <form onSubmit={handleApplySubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Leave Type</label>
              <select
                className="form-control"
                value={leaveForm.leaveType}
                onChange={e => setLeaveForm({...leaveForm, leaveType: e.target.value})}
              >
                <option value="Casual">Casual</option>
                <option value="Medical">Medical</option>
                <option value="Emergency">Emergency</option>
                <option value="Home Visit">Home Visit</option>
                <option value="On Duty">On Duty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Priority Level</label>
              <select
                className="form-control"
                value={leaveForm.priority}
                onChange={e => setLeaveForm({...leaveForm, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High/Emergency">High/Emergency</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={leaveForm.startDate} 
                onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                className="form-control" 
                required 
                value={leaveForm.endDate} 
                onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Leave</label>
            <textarea 
              className="form-control" 
              rows="3" 
              required 
              placeholder="Provide reason for leave..."
              value={leaveForm.reason} 
              onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Parent / Guardian Contact Phone</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. +91 9876543210"
              required 
              value={leaveForm.parentContact} 
              onChange={e => setLeaveForm({...leaveForm, parentContact: e.target.value})} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="checkbox" 
              id="consent" 
              checked={leaveForm.parentConsent} 
              onChange={e => setLeaveForm({...leaveForm, parentConsent: e.target.checked})} 
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="consent" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
              I confirm that my parents/guardians are aware of this leave application.
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsApplyModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!leaveForm.parentConsent}>Submit Application</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default LeaveManagement;
