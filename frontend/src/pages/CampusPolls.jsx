import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getCampusPollsApi,
  castVoteApi,
  createCampusPollApi,
  closeCampusPollApi
} from '../services/api';

const CampusPolls = () => {
  const { user } = useAuth();
  const isWardenOrAdmin = user?.role === 'Warden' || user?.role === 'Admin';

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Create Poll Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pollForm, setPollForm] = useState({
    title: '',
    description: '',
    category: 'Mess & Dining',
    targetAudience: 'All',
    durationDays: 7,
    options: ['', '']
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const res = await getCampusPollsApi();
      setPolls(res.data || []);
    } catch (err) {
      console.error('Error fetching campus polls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    setError('');
    setMessage('');
    try {
      const res = await castVoteApi(pollId, { optionId });
      setMessage(res.data.message);
      fetchPolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vote.');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      const res = await closeCampusPollApi(pollId);
      setMessage(res.data.message);
      fetchPolls();
    } catch (err) {
      setError('Failed to close poll.');
    }
  };

  const handleAddOptionField = () => {
    setPollForm({ ...pollForm, options: [...pollForm.options, ''] });
  };

  const handleOptionChange = (index, value) => {
    const updated = [...pollForm.options];
    updated[index] = value;
    setPollForm({ ...pollForm, options: updated });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const validOptions = pollForm.options.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty poll options.');
      return;
    }

    try {
      const res = await createCampusPollApi({
        ...pollForm,
        options: validOptions
      });
      setMessage(res.data.message);
      setShowCreateModal(false);
      setPollForm({
        title: '',
        description: '',
        category: 'Mess & Dining',
        targetAudience: 'All',
        durationDays: 7,
        options: ['', '']
      });
      fetchPolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll.');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Mess & Dining': return '#EA580C';
      case 'Hostel Amenities': return '#0F766E';
      case 'Campus Rules & Timings': return '#2563EB';
      case 'Sports & Events': return '#7C3AED';
      default: return '#4B5563';
    }
  };

  return (
    <Layout>
      <div className="campus-polls-page">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #4F46E5 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🗳️</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Student Voice & Community Polls</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Cast your vote on hostel amenities, mess decisions, campus events, and student initiatives.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {isWardenOrAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: '#fff',
                  color: '#7C3AED',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <i className="fa-solid fa-plus-circle"></i> Create New Poll
              </button>
            )}
            <button className="btn btn-outline" onClick={fetchPolls} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
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

        {/* Polls Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          </div>
        ) : polls.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-square-poll-vertical" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '16px' }}></i>
            <h3>No Active Campus Polls</h3>
            <p style={{ fontSize: '0.9rem' }}>Check back soon for new student surveys and community decisions!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '30px'
          }}>
            {polls.map(poll => {
              const totalVotes = poll.totalVotes || (poll.options ? poll.options.reduce((acc, o) => acc + (o.votesCount || 0), 0) : 0);
              const isClosed = poll.status === 'Closed' || new Date() > new Date(poll.expiresAt);
              const catColor = getCategoryColor(poll.category);

              return (
                <div
                  key={poll._id}
                  className="card"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    position: 'relative',
                    borderTop: `4px solid ${catColor}`
                  }}
                >
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: `${catColor}15`,
                      color: catColor
                    }}>
                      {poll.category}
                    </span>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isClosed ? '#F1F5F9' : '#DCFCE7',
                      color: isClosed ? '#64748B' : '#16A34A'
                    }}>
                      {isClosed ? 'Closed' : '🟢 Active'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '700', color: 'var(--text)' }}>
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Options & Progress Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(poll.options || []).map(option => {
                      const count = option.votesCount || 0;
                      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isVotedByMe = poll.userVotedOptionId === option.optionId;

                      return (
                        <div
                          key={option.optionId}
                          onClick={() => {
                            if (!poll.hasVoted && !isClosed) handleVote(poll._id, option.optionId);
                          }}
                          style={{
                            border: `1.5px solid ${isVotedByMe ? '#7C3AED' : 'var(--border)'}`,
                            background: isVotedByMe ? 'rgba(124, 58, 237, 0.05)' : 'var(--surface)',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            cursor: (!poll.hasVoted && !isClosed) ? 'pointer' : 'default',
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Animated Fill Bar */}
                          <div style={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${pct}%`,
                            background: isVotedByMe ? 'rgba(124, 58, 237, 0.18)' : 'rgba(99, 102, 241, 0.1)',
                            zIndex: 0,
                            transition: 'width 0.4s ease-out'
                          }} />

                          {/* Content */}
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {isVotedByMe && (
                                <i className="fa-solid fa-circle-check" style={{ color: '#7C3AED' }}></i>
                              )}
                              <span style={{ fontSize: '0.88rem', fontWeight: isVotedByMe ? '700' : '500', color: 'var(--text)' }}>
                                {option.text}
                              </span>
                            </div>

                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isVotedByMe ? '#7C3AED' : 'var(--text-secondary)' }}>
                              {pct}% ({count})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Poll Footer info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>
                      <i className="fa-solid fa-users" style={{ marginRight: '4px' }}></i>
                      {totalVotes} Votes Cast
                    </span>
                    <span>
                      Audience: <strong>{poll.targetAudience}</strong>
                    </span>
                  </div>

                  {/* Warden Close Action */}
                  {isWardenOrAdmin && !isClosed && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ width: '100%', fontSize: '0.75rem' }}
                      onClick={() => handleClosePoll(poll._id)}
                    >
                      <i className="fa-solid fa-ban"></i> Close Poll
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Poll Modal */}
        {showCreateModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '540px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                  <i className="fa-solid fa-square-poll-vertical" style={{ color: '#7C3AED', marginRight: '8px' }}></i>
                  Create Community Campus Poll
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Poll Question / Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Should library hours be extended on Sundays?"
                    required
                    value={pollForm.title}
                    onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Context / Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Provide additional details or proposal background..."
                    value={pollForm.description}
                    onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={pollForm.category}
                      onChange={(e) => setPollForm({ ...pollForm, category: e.target.value })}
                    >
                      <option value="Mess & Dining">Mess & Dining</option>
                      <option value="Hostel Amenities">Hostel Amenities</option>
                      <option value="Campus Rules & Timings">Campus Rules & Timings</option>
                      <option value="Sports & Events">Sports & Events</option>
                      <option value="General">General Campus</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Audience</label>
                    <select
                      className="form-control"
                      value={pollForm.targetAudience}
                      onChange={(e) => setPollForm({ ...pollForm, targetAudience: e.target.value })}
                    >
                      <option value="All">All Students & Residents</option>
                      <option value="Hostellers">Hostellers Only</option>
                      <option value="Dayscholars">Dayscholars Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Poll Options (Min 2)</label>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {pollForm.options.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        className="form-control"
                        placeholder={`Option ${idx + 1}...`}
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: '8px', fontSize: '0.78rem' }}
                    onClick={handleAddOptionField}
                  >
                    <i className="fa-solid fa-plus"></i> Add Another Option
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#7C3AED' }}>
                    Publish Poll
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

export default CampusPolls;
