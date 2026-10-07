import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getRoommateRadarApi } from '../services/api';

const RoommateRadar = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeer, setSelectedPeer] = useState(null);

  useEffect(() => {
    fetchRadarData();
  }, []);

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const res = await getRoommateRadarApi();
      setData(res.data);
      if (res.data?.currentRoommates?.length > 0) {
        setSelectedPeer(res.data.currentRoommates[0]);
      } else if (res.data?.peerMatches?.length > 0) {
        setSelectedPeer(res.data.peerMatches[0]);
      }
    } catch (err) {
      console.error('Error loading roommate radar:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate SVG Polygon points for 6-axis spider radar
  const getRadarCoordinates = (metrics, center = 150, radius = 100) => {
    if (!metrics || metrics.length === 0) return '';
    const angleStep = (Math.PI * 2) / metrics.length;
    return metrics
      .map((m, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const normalized = (m.score || 50) / 100;
        const x = center + radius * normalized * Math.cos(angle);
        const y = center + radius * normalized * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const currentMatch = selectedPeer?.matchData;
  const metrics = currentMatch?.radarMetrics || [
    { axis: 'Sleep Cycle', score: 85 },
    { axis: 'Wake Up Schedule', score: 80 },
    { axis: 'Study Quietness', score: 90 },
    { axis: 'Cleanliness Norms', score: 95 },
    { axis: 'Social & Visitors', score: 75 },
    { axis: 'Language Synergy', score: 100 }
  ];

  return (
    <Layout>
      <div className="roommate-radar-page">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 50%, #4F46E5 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🧭</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>AI Roommate Compatibility Radar & Insights</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              360° lifestyle synergy evaluation, sleep/study synchronization, and institutional same-gender harmony analytics.
            </p>
          </div>

          <button className="btn btn-outline" onClick={fetchRadarData} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
            <i className="fa-solid fa-arrows-rotate"></i> Recalculate
          </button>
        </div>

        {/* Strict Gender Compliance Badge */}
        <div style={{
          background: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid #10B981',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#047857', fontSize: '0.88rem', fontWeight: 600 }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.2rem', color: '#059669' }}></i>
            <span>
              <strong>Verified Same-Gender Policy:</strong> Active evaluation strictly matches {data?.studentGender === 'Female' ? 'Female ↔ Female residents' : 'Male ↔ Male residents'}. Cross-gender compatibility comparisons are permanently barred.
            </span>
          </div>
          <span className="pill-tag" style={{ background: '#059669', color: '#fff', fontSize: '0.72rem' }}>
            <i className="fa-solid fa-lock"></i> 100% Policy Compliant
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Calculating lifestyle compatibility matrix...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 420px) 1fr', gap: '24px', marginBottom: '30px' }}>
            {/* Left: Interactive SVG Radar Visualizer */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>Compatibility Radar</h3>
                {currentMatch && (
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: currentMatch.overallMatch >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                    color: currentMatch.overallMatch >= 80 ? '#059669' : '#2563EB'
                  }}>
                    {currentMatch.overallMatch}% Synergy
                  </span>
                )}
              </div>

              {/* Spider Radar SVG */}
              <div style={{ position: 'relative', width: '300px', height: '300px', margin: '10px 0' }}>
                <svg width="300" height="300" viewBox="0 0 300 300">
                  {/* Concentric grid rings */}
                  {[25, 50, 75, 100].map(r => (
                    <circle
                      key={r}
                      cx="150"
                      cy="150"
                      r={r}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray={r === 100 ? 'none' : '3,3'}
                    />
                  ))}

                  {/* Axes lines */}
                  {metrics.map((_, i) => {
                    const angle = (i * (Math.PI * 2)) / metrics.length - Math.PI / 2;
                    const x2 = 150 + 100 * Math.cos(angle);
                    const y2 = 150 + 100 * Math.sin(angle);
                    return <line key={i} x1="150" y1="150" x2={x2} y2={y2} stroke="var(--border)" strokeWidth="1" />;
                  })}

                  {/* Radar Polygon */}
                  <polygon
                    points={getRadarCoordinates(metrics)}
                    fill="rgba(37, 99, 235, 0.25)"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />

                  {/* Axis Points */}
                  {metrics.map((m, i) => {
                    const angle = (i * (Math.PI * 2)) / metrics.length - Math.PI / 2;
                    const normalized = (m.score || 50) / 100;
                    const x = 150 + 100 * normalized * Math.cos(angle);
                    const y = 150 + 100 * normalized * Math.sin(angle);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4.5"
                        fill="#1E3A8A"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Radar Axis Labels Legend */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', textAlign: 'left', marginTop: '10px' }}>
                {metrics.map((m, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.axis}:</span>
                    <strong style={{ color: 'var(--text)' }}>{m.score}%</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Peer / Roommate Profile & AI Match Report */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Selected Profile Card */}
              {selectedPeer ? (
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#2563EB', textTransform: 'uppercase' }}>
                        Synergy Evaluation Target
                      </span>
                      <h2 style={{ margin: '4px 0 0 0', fontSize: '1.35rem', fontWeight: '800' }}>
                        {selectedPeer.name} ({selectedPeer.registerNumber || 'Student'})
                      </h2>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Department: {selectedPeer.department || 'Academic Dept'} | Block: {selectedPeer.hostelBlock || 'Resident'}
                      </div>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #1E3A8A, #0284C7)',
                      color: '#fff',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                    }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: '1' }}>
                        {selectedPeer.matchData?.overallMatch}%
                      </div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px' }}>Match Score</div>
                    </div>
                  </div>

                  {/* AI Synergy Highlights */}
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text)' }}>
                      🤖 AI Synergy Insights & Daily Harmony
                    </h4>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      {(selectedPeer.matchData?.aiHighlights || []).map((hl, i) => (
                        <div key={i} style={{
                          padding: '8px 12px',
                          background: 'rgba(37, 99, 235, 0.06)',
                          borderLeft: '3px solid #2563EB',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          color: 'var(--text)'
                        }}>
                          {hl}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Side-by-side preference comparison */}
                  <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '10px', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>Your Routine Habits</strong>
                      <div style={{ marginTop: '6px', display: 'grid', gap: '4px', color: 'var(--text-secondary)' }}>
                        <div>🌙 Sleep: {data?.myPreferences?.sleepingTime || '10 PM–12 AM'}</div>
                        <div>☀️ Wake: {data?.myPreferences?.wakeUpTime || '6–8 AM'}</div>
                        <div>📚 Study: {data?.myPreferences?.studyEnvironment || 'Moderate'}</div>
                        <div>🧹 Cleanliness: {data?.myPreferences?.cleanliness || 'Very Clean'}</div>
                      </div>
                    </div>

                    <div style={{ padding: '12px', background: 'var(--background)', borderRadius: '10px', fontSize: '0.8rem' }}>
                      <strong style={{ color: '#0284C7' }}>{selectedPeer.name}'s Habits</strong>
                      <div style={{ marginTop: '6px', display: 'grid', gap: '4px', color: 'var(--text-secondary)' }}>
                        <div>🌙 Sleep: {selectedPeer.preferences?.sleepingTime || '10 PM–12 AM'}</div>
                        <div>☀️ Wake: {selectedPeer.preferences?.wakeUpTime || '6–8 AM'}</div>
                        <div>📚 Study: {selectedPeer.preferences?.studyEnvironment || 'Moderate'}</div>
                        <div>🧹 Cleanliness: {selectedPeer.preferences?.cleanliness || 'Very Clean'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-user-group" style={{ fontSize: '2.5rem', marginBottom: '12px' }}></i>
                  <p>Select a roommate or discovered peer below to analyze compatibility radar.</p>
                </div>
              )}

              {/* Peers / Current Roommates Selector Tabs */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: '700' }}>
                  👥 High-Synergy Roommate Candidates ({data?.peerMatches?.length || 0})
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                  {(data?.peerMatches || []).map(peer => (
                    <div
                      key={peer._id}
                      onClick={() => setSelectedPeer(peer)}
                      style={{
                        border: `1.5px solid ${selectedPeer?._id === peer._id ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '10px',
                        padding: '12px',
                        cursor: 'pointer',
                        background: selectedPeer?._id === peer._id ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{peer.name}</span>
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: peer.gender === 'Female' ? '#FCE7F3' : '#DBEAFE',
                            color: peer.gender === 'Female' ? '#BE185D' : '#1D4ED8',
                            fontWeight: 700
                          }}>
                            {peer.gender === 'Female' ? '♀ Female' : '♂ Male'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {peer.registerNumber || 'Student'} &bull; {peer.hostelBlock}
                        </div>
                      </div>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: peer.matchData?.overallMatch >= 80 ? '#059669' : '#2563EB'
                      }}>
                        {peer.matchData?.overallMatch}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RoommateRadar;
