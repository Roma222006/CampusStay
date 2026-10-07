import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { 
  getRoomsApi, 
  getHostelBlocksApi, 
  selectRoomApi, 
  requestRoomSwapApi,
  requestRoomAllocationApi 
} from '../services/api';

const HostelRooms = () => {
  const { user, refreshUser } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapTargetRollNo, setSwapTargetRollNo] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [message, setMessage] = useState('');

  // Initial Allocation Request Form
  const [allocForm, setAllocForm] = useState({
    preferredBlock: '',
    preferredRoomType: 'Double',
    reason: '',
    preferences: {
      sleepingTime: '11 PM - 12 AM',
      wakeUpTime: '7 AM - 8 AM',
      studyEnvironment: 'Quiet',
      cleanliness: 'High',
      visitorPreference: 'Rarely',
      preferredLanguage: 'English',
      restroomPreference: 'No Preference',
      preferredFloor: 'No Preference'
    }
  });
  const [isAllocSubmitted, setIsAllocSubmitted] = useState(false);

  const fetchBlocksAndRooms = async () => {
    try {
      const blocksRes = await getHostelBlocksApi();
      if (blocksRes.data && blocksRes.data.blocks && blocksRes.data.blocks.length > 0) {
        setBlocks(blocksRes.data.blocks);
        if (!selectedBlock) {
          setSelectedBlock(blocksRes.data.blocks[0].name);
        }
        setAllocForm(prev => ({
          ...prev,
          preferredBlock: blocksRes.data.blocks[0].name
        }));
      }
    } catch (err) {
      console.error('Error fetching blocks:', err);
    }
  };

  useEffect(() => {
    fetchBlocksAndRooms();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!selectedBlock) return;
      setLoading(true);
      try {
        const roomsRes = await getRoomsApi({
          hostelBlock: selectedBlock,
          floor: selectedFloor
        });
        if (roomsRes.data && roomsRes.data.rooms) {
          setRooms(roomsRes.data.rooms);
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [selectedBlock, selectedFloor]);

  const handleSelectRoomConfirm = async () => {
    if (!selectedRoom) return;
    try {
      await selectRoomApi(selectedRoom._id);
      setMessage('Room booked successfully!');
      setIsSelectModalOpen(false);
      refreshUser();
      const roomsRes = await getRoomsApi({ hostelBlock: selectedBlock, floor: selectedFloor });
      if (roomsRes.data) setRooms(roomsRes.data.rooms || []);
    } catch (err) {
      console.error('Error booking room:', err);
      alert(err.response?.data?.message || 'Error booking room');
    }
  };

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestRoomSwapApi({
        targetStudentRollNo: swapTargetRollNo,
        reason: swapReason
      });
      alert('Room swap request submitted successfully to warden!');
      setIsSwapModalOpen(false);
      setSwapTargetRollNo('');
      setSwapReason('');
    } catch (err) {
      console.error('Error requesting room swap:', err);
      alert(err.response?.data?.message || 'Error requesting swap');
    }
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestRoomAllocationApi(allocForm);
      alert('Your Room Allocation preference request has been submitted to the Warden!');
      setIsAllocSubmitted(true);
      refreshUser();
    } catch (err) {
      console.error('Error submitting allocation preferences:', err);
      alert(err.response?.data?.message || 'Error submitting request');
    }
  };

  return (
    <Layout title="Hostel Block & Room Allocations">
      {message && (
        <div style={{ padding: '12px', background: 'rgba(22, 163, 74, 0.1)', color: 'var(--success-color)', borderRadius: '8px', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      {/* Student Room Info / Initial Allocation Card */}
      {user?.role === 'Student' && (
        <div style={{ marginBottom: '24px' }}>
          {user?.hostelBlock && user?.roomNumber ? (
            <div className="glass-card" style={{ padding: '20px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Your Allocated Room</span>
                  <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginTop: '2px' }}>
                    {user?.hostelBlock} - Room {user?.roomNumber}
                  </h3>
                </div>
                <button className="btn btn-outline" onClick={() => setIsSwapModalOpen(true)}>
                  <i className="fa-solid fa-arrows-rotate"></i> Request Room Swap
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--primary-color)', fontSize: '1.2rem', marginBottom: '6px' }}>
                Hostel Room Auto-Allocation preferences
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                You do not have a room allocated. Specify your preferred configuration and roommate criteria below so that the Warden can smart-allocate a compatible room for you.
              </p>

              {!isAllocSubmitted ? (
                <form onSubmit={handleAllocationSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Preferred Hostel Block</label>
                      <select 
                        className="form-control"
                        value={allocForm.preferredBlock}
                        onChange={e => setAllocForm({...allocForm, preferredBlock: e.target.value})}
                      >
                        {blocks.map(b => (
                          <option key={b._id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Preferred Room Layout</label>
                      <select 
                        className="form-control"
                        value={allocForm.preferredRoomType}
                        onChange={e => setAllocForm({...allocForm, preferredRoomType: e.target.value})}
                      >
                        <option value="Single">Single Room</option>
                        <option value="Double">Double Room</option>
                        <option value="Triple">Triple Room</option>
                        <option value="Four Sharing">Four Sharing</option>
                      </select>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px' }}>
                    Roommate Compatibility Criteria
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                    <div className="form-group">
                      <label>Sleeping Schedule</label>
                      <select className="form-control" value={allocForm.preferences.sleepingTime} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, sleepingTime: e.target.value}})}>
                        <option value="Before 10 PM">Before 10 PM</option>
                        <option value="10 PM - 11 PM">10 PM - 11 PM</option>
                        <option value="11 PM - 12 AM">11 PM - 12 AM</option>
                        <option value="After 12 AM">After 12 AM</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Wakeup Schedule</label>
                      <select className="form-control" value={allocForm.preferences.wakeUpTime} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, wakeUpTime: e.target.value}})}>
                        <option value="Before 6 AM">Before 6 AM</option>
                        <option value="6 AM - 7 AM">6 AM - 7 AM</option>
                        <option value="7 AM - 8 AM">7 AM - 8 AM</option>
                        <option value="After 8 AM">After 8 AM</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Cleanliness</label>
                      <select className="form-control" value={allocForm.preferences.cleanliness} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, cleanliness: e.target.value}})}>
                        <option value="High">Extremely Neat (High)</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Low">Low Maintenance</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Preferred Language</label>
                      <select className="form-control" value={allocForm.preferences.preferredLanguage} onChange={e => setAllocForm({...allocForm, preferences: {...allocForm.preferences, preferredLanguage: e.target.value}})}>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Reason for Allocation / Remarks</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="e.g. Seeking quiet environment for studies..." 
                      value={allocForm.reason}
                      onChange={e => setAllocForm({...allocForm, reason: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-paper-plane"></i> Submit Allocation Request
                  </button>
                </form>
              ) : (
                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed var(--secondary-color)', color: 'var(--text-main)', textAlign: 'center' }}>
                  <i className="fa-solid fa-circle-check" style={{ color: 'var(--success-color)', fontSize: '1.5rem', marginBottom: '8px' }}></i>
                  <div>Your Room Allocation request has been submitted! It is currently pending Warden review and auto-placement.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Block Selector Header */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px' }}>
        {blocks.map(b => (
          <button
            key={b._id}
            onClick={() => setSelectedBlock(b.name)}
            className={`btn ${selectedBlock === b.name ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '30px' }}
          >
            <i className="fa-solid fa-building"></i> {b.name}
          </button>
        ))}
      </div>

      {/* Floor Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'white', padding: '12px 20px', borderRadius: 'var(--border-radius-md)', border: '1px solid #E2E8F0', marginBottom: '24px' }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-muted)' }}>FLOOR:</span>
        {[0, 1, 2].map(f => (
          <button
            key={f}
            onClick={() => setSelectedFloor(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              backgroundColor: selectedFloor === f ? 'var(--secondary-color)' : '#F1F5F9',
              color: selectedFloor === f ? '#fff' : 'var(--text-main)',
              transition: 'all 0.2s ease'
            }}
          >
            Floor {f === 0 ? '0 (Ground)' : f}
          </button>
        ))}
      </div>

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No rooms configured for this block and floor.</p>
          </div>
        ) : (
          rooms.map(room => {
            const currentOccupancy = room.currentStudents ? room.currentStudents.length : 0;
            const isFull = currentOccupancy >= room.capacity;
            const isMyRoom = user?.roomNumber === room.roomNumber && user?.hostelBlock === room.hostelBlock;

            return (
              <div 
                key={room._id} 
                className="glass-card"
                style={{
                  padding: '24px',
                  borderTop: isMyRoom ? '4px solid var(--secondary-color)' :
                             isFull ? '4px solid var(--danger-color)' : '4px solid var(--success-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--primary-color)', fontWeight: 700 }}>
                    Room {room.roomNumber}
                  </h3>
                  <span className={`status-badge ${isFull ? 'rejected' : 'approved'}`}>
                    {isFull ? 'Full' : `${room.capacity - currentOccupancy} Vacant`}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <div>Type: <strong style={{ color: 'var(--text-main)' }}>{room.roomType}</strong></div>
                  <div>Restroom: <strong style={{ color: 'var(--text-main)' }}>{room.restroomType}</strong></div>
                  <div>Capacity: <strong style={{ color: 'var(--text-main)' }}>{currentOccupancy} / {room.capacity}</strong></div>
                </div>

                {user?.role === 'Student' && (
                  <div>
                    {isMyRoom ? (
                      <button className="btn btn-secondary btn-sm" disabled style={{ width: '100%', justifyContent: 'center' }}>
                        <i className="fa-solid fa-circle-check"></i> Your Room
                      </button>
                    ) : isFull ? (
                      <button className="btn btn-outline btn-sm" disabled style={{ width: '100%', justifyContent: 'center', opacity: 0.6 }}>
                        Fully Occupied
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsSelectModalOpen(true);
                        }}
                      >
                        Select Room
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Select Room Modal */}
      <Modal isOpen={isSelectModalOpen} onClose={() => setIsSelectModalOpen(false)} title="Confirm Room Allocation">
        <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
          Are you sure you want to select <strong>Room {selectedRoom?.roomNumber}</strong> in <strong>{selectedRoom?.hostelBlock}</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-outline" onClick={() => setIsSelectModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSelectRoomConfirm}>Confirm Selection</button>
        </div>
      </Modal>

      {/* Swap Room Modal */}
      <Modal isOpen={isSwapModalOpen} onClose={() => setIsSwapModalOpen(false)} title="Request Room Swap">
        <form onSubmit={handleSwapSubmit}>
          <div className="form-group">
            <label>Target Student Roll Number</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. CS202409"
              required 
              value={swapTargetRollNo} 
              onChange={e => setSwapTargetRollNo(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Reason for Swap</label>
            <textarea 
              className="form-control" 
              rows="3" 
              required
              placeholder="Explain why you want to swap rooms..."
              value={swapReason} 
              onChange={e => setSwapReason(e.target.value)} 
            ></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsSwapModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default HostelRooms;
