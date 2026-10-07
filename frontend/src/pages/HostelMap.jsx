import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getHostelBlocksApi,
  getRoomsApi,
  getBlockStatsApi,
  updateRoomStatusApi
} from '../services/api';

const HostelMap = () => {
  const { user } = useAuth();
  const isWardenOrAdmin = user?.role === 'Warden' || user?.role === 'Admin';

  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All'); // All, Available, Full, Maintenance
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      loadRooms();
    }
  }, [selectedBlock, selectedFloor]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [blockRes, statRes] = await Promise.all([
        getHostelBlocksApi(),
        getBlockStatsApi()
      ]);
      const blkList = blockRes.data || [];
      setBlocks(blkList);
      setStats(statRes.data?.blockStats || []);

      if (blkList.length > 0) {
        // If warden, default to their assigned block
        const defaultBlk = user?.hostelBlock && blkList.find(b => b.name === user.hostelBlock)
          ? user.hostelBlock
          : blkList[0].name;
        setSelectedBlock(defaultBlk);
      }
    } catch (err) {
      console.error('Error loading blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await getRoomsApi({
        hostelBlock: selectedBlock,
        floor: selectedFloor
      });
      setRooms(res.data || []);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const handleStatusChange = async (roomId, newStatus) => {
    try {
      await updateRoomStatusApi(roomId, { status: newStatus });
      setMessage(`Room status updated to ${newStatus}`);
      loadRooms();
      if (selectedRoom && selectedRoom._id === roomId) {
        setSelectedRoom({ ...selectedRoom, status: newStatus });
      }
    } catch (err) {
      setMessage('Failed to update room status.');
    }
  };

  const currentBlockObj = blocks.find(b => b.name === selectedBlock);
  const totalFloors = currentBlockObj?.totalFloors || 3;

  const filteredRooms = rooms.filter(r => {
    if (filterType === 'Available') return r.status === 'Available' && r.occupiedBeds < r.capacity;
    if (filterType === 'Full') return r.status === 'Full' || r.occupiedBeds >= r.capacity;
    if (filterType === 'Maintenance') return r.status === 'Maintenance';
    return true;
  });

  const getStatusColor = (room) => {
    if (room.status === 'Maintenance') return '#EF4444';
    if (room.occupiedBeds >= room.capacity) return '#F59E0B';
    if (room.occupiedBeds > 0) return '#3B82F6';
    return '#10B981';
  };

  return (
    <Layout>
      <div className="hostel-map-page">
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0EA5E9 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🏢</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Interactive Hostel Floor Map & Bed Matrix</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Visual 2D room matrix, live bed occupancy chips, and resident profiles.
            </p>
          </div>

          {/* Block Selector */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.95 }}>Hostel Block:</span>
            <select
              className="form-control"
              style={{ background: '#fff', color: '#0F172A', fontWeight: '600', width: 'auto', minWidth: '180px' }}
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setSelectedFloor(0);
              }}
            >
              {blocks.map(b => (
                <option key={b._id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {message && (
          <div className="alert alert-success" style={{ marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-check"></i> {message}
          </div>
        )}

        {/* Floor Selection Bar & Filter Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          {/* Floor Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {Array.from({ length: totalFloors }, (_, i) => (
              <button
                key={i}
                className={`btn ${selectedFloor === i ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
                onClick={() => setSelectedFloor(i)}
              >
                <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }}></i>
                {i === 0 ? 'Ground Floor' : `Floor ${i}`}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Available', 'Full', 'Maintenance'].map(f => (
              <button
                key={f}
                className="btn btn-sm"
                style={{
                  background: filterType === f ? 'var(--primary)' : 'var(--surface)',
                  color: filterType === f ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                  fontSize: '0.8rem',
                  padding: '6px 12px'
                }}
                onClick={() => setFilterType(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          background: 'var(--surface)',
          padding: '12px 18px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          fontSize: '0.8rem',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span>Vacant Bed Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }}></span>
            <span>Partially Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
            <span>Fully Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
            <span>Maintenance Mode</span>
          </div>
        </div>

        {/* Room Visual Grid */}
        {filteredRooms.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-door-closed" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '16px' }}></i>
            <h3>No Rooms Found for this Floor</h3>
            <p style={{ fontSize: '0.9rem' }}>Try switching floors or changing the filter criteria.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {filteredRooms.map(room => {
              const statusColor = getStatusColor(room);
              const isSelected = selectedRoom?._id === room._id;

              return (
                <div
                  key={room._id}
                  onClick={() => setSelectedRoom(room)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '14px',
                    background: 'var(--surface)',
                    padding: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? '0 8px 25px rgba(37, 99, 235, 0.2)' : 'var(--shadow-sm)',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: isSelected ? 'translateY(-3px)' : 'none'
                  }}
                >
                  {/* Top Status Border */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '4px',
                    background: statusColor
                  }} />

                  {/* Room Number & Type */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)' }}>
                        Room {room.roomNumber}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {room.roomType} Room
                      </div>
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: `${statusColor}15`,
                      color: statusColor
                    }}>
                      {room.status === 'Maintenance' ? 'Maintenance' : `${room.occupiedBeds} / ${room.capacity} Beds`}
                    </span>
                  </div>

                  {/* Bed Chips Matrix */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${room.capacity}, 1fr)`,
                    gap: '6px',
                    marginBottom: '14px',
                    background: 'var(--background)',
                    padding: '8px',
                    borderRadius: '8px'
                  }}>
                    {Array.from({ length: room.capacity }, (_, bIdx) => {
                      const isBedOccupied = bIdx < room.occupiedBeds;
                      return (
                        <div
                          key={bIdx}
                          style={{
                            height: '34px',
                            borderRadius: '6px',
                            background: isBedOccupied ? '#3B82F6' : '#10B981',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          title={isBedOccupied ? `Bed ${bIdx + 1}: Occupied` : `Bed ${bIdx + 1}: Vacant`}
                        >
                          <i className={`fa-solid ${isBedOccupied ? 'fa-user' : 'fa-bed'}`}></i>
                          <span>B{bIdx + 1}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Room Amenities Badges */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                    <span style={{
                      padding: '2px 6px',
                      background: 'rgba(15, 118, 110, 0.1)',
                      color: '#0F766E',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      <i className="fa-solid fa-bath"></i> {room.restroomType} Bath
                    </span>
                    <span style={{
                      padding: '2px 6px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563EB',
                      borderRadius: '4px',
                      fontWeight: '600'
                    }}>
                      <i className="fa-solid fa-wifi"></i> WiFi Ready
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Room Details Drawer / Card */}
        {selectedRoom && (
          <div className="card" style={{
            padding: '24px',
            borderTop: '4px solid var(--primary)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                  Room {selectedRoom.roomNumber} Details — {selectedRoom.hostelBlock} (Floor {selectedRoom.floor})
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Capacity: {selectedRoom.capacity} Beds | Occupied: {selectedRoom.occupiedBeds} | Restroom: {selectedRoom.restroomType}
                </p>
              </div>

              {isWardenOrAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedRoom.status !== 'Maintenance' ? (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ borderColor: '#EF4444', color: '#EF4444' }}
                      onClick={() => handleStatusChange(selectedRoom._id, 'Maintenance')}
                    >
                      <i className="fa-solid fa-screwdriver-wrench"></i> Mark Maintenance
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ background: '#10B981' }}
                      onClick={() => handleStatusChange(selectedRoom._id, 'Available')}
                    >
                      <i className="fa-solid fa-check"></i> Restore to Available
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setSelectedRoom(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Occupants list */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '10px' }}>Current Residents</h4>
              {!selectedRoom.currentStudents || selectedRoom.currentStudents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No students currently assigned to this room.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {selectedRoom.currentStudents.map((stud, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: 'var(--background)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                        {typeof stud === 'object' ? stud.name : `Student #${idx + 1}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {typeof stud === 'object' ? `${stud.department || 'Department'} (${stud.registerNumber || 'Reg No'})` : 'Hostel Resident'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HostelMap;
