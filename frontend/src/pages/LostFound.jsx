import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getLostFoundItemsApi,
  reportLostFoundItemApi,
  claimLostFoundItemApi,
  resolveLostFoundItemApi
} from '../services/api';

const CATEGORIES = ['All', 'Electronics', 'ID & Cards', 'Keys & Locks', 'Books & Notes', 'Clothing & Accessories', 'Sports & Gear', 'Other'];

const LostFound = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // All, Lost, Found, Resolved
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: '',
    category: 'Electronics',
    itemType: 'Found',
    description: '',
    location: '',
    contactNumber: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // Claim Modal
  const [claimModalItem, setClaimModalItem] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');

  useEffect(() => {
    fetchItems();
  }, [activeTab, selectedCategory]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'Lost') params.itemType = 'Lost';
      if (activeTab === 'Found') params.itemType = 'Found';
      if (activeTab === 'Resolved') params.status = 'Resolved';
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const res = await getLostFoundItemsApi(params);
      setItems(res.data || []);
    } catch (err) {
      console.error('Error fetching lost & found items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('title', reportForm.title);
      formData.append('category', reportForm.category);
      formData.append('itemType', reportForm.itemType);
      formData.append('description', reportForm.description);
      formData.append('location', reportForm.location);
      formData.append('contactNumber', reportForm.contactNumber || user?.phone || '');
      formData.append('reporterName', user?.name || 'Campus Resident');
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await reportLostFoundItemApi(formData);
      setMessage(res.data.message);
      setShowReportModal(false);
      setReportForm({
        title: '',
        category: 'Electronics',
        itemType: 'Found',
        description: '',
        location: '',
        contactNumber: ''
      });
      setImageFile(null);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimModalItem) return;
    try {
      const res = await claimLostFoundItemApi(claimModalItem._id, {
        claimantName: user?.name,
        claimNotes
      });
      setMessage(res.data.message);
      setClaimModalItem(null);
      setClaimNotes('');
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim item.');
    }
  };

  const handleResolve = async (itemId) => {
    try {
      const res = await resolveLostFoundItemApi(itemId, { notes: 'Handover verified and resolved.' });
      setMessage(res.data.message);
      fetchItems();
    } catch (err) {
      setError('Failed to resolve item.');
    }
  };

  const filteredItems = items.filter(it => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      it.title.toLowerCase().includes(q) ||
      it.description.toLowerCase().includes(q) ||
      it.location.toLowerCase().includes(q)
    );
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Electronics': return 'fa-laptop';
      case 'ID & Cards': return 'fa-id-card';
      case 'Keys & Locks': return 'fa-key';
      case 'Books & Notes': return 'fa-book';
      case 'Clothing & Accessories': return 'fa-shirt';
      case 'Sports & Gear': return 'fa-volleyball';
      default: return 'fa-box-open';
    }
  };

  return (
    <Layout>
      <div className="lostfound-page">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 50%, #818CF8 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🔍</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Campus & Hostel Lost & Found Hub</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Community lost item directory, found property recovery & safe handover tracking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowReportModal(true)}
              style={{
                background: '#fff',
                color: '#4338CA',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <i className="fa-solid fa-bullhorn"></i> Report Lost or Found Item
            </button>
            <button className="btn btn-outline" onClick={fetchItems} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
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

        {/* Type Navigation Tabs & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Main Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'All', label: 'All Listings', icon: 'fa-list' },
              { key: 'Lost', label: 'Reported Lost', icon: 'fa-magnifying-glass-arrow-right' },
              { key: 'Found', label: 'Items Found', icon: 'fa-hand-holding-hand' },
              { key: 'Resolved', label: 'Recovered & Returned', icon: 'fa-circle-check' }
            ].map(t => (
              <button
                key={t.key}
                className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}
                onClick={() => setActiveTab(t.key)}
              >
                <i className={`fa-solid ${t.icon}`} style={{ marginRight: '6px' }}></i>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, location, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px'
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className="btn btn-sm"
              style={{
                background: selectedCategory === cat ? '#4338CA' : 'var(--surface)',
                color: selectedCategory === cat ? '#fff' : 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '0.78rem',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat !== 'All' && <i className={`fa-solid ${getCategoryIcon(cat)}`} style={{ marginRight: '6px' }}></i>}
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-box-archive" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '16px' }}></i>
            <h3>No Items in this Category</h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '8px auto' }}>
              Have you found something on campus or misplaced an item? Click "Report Lost or Found Item" to post!
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {filteredItems.map(item => (
              <div
                key={item._id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: `4px solid ${item.itemType === 'Lost' ? '#EF4444' : '#10B981'}`,
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: item.itemType === 'Lost' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: item.itemType === 'Lost' ? '#DC2626' : '#059669',
                      textTransform: 'uppercase'
                    }}>
                      {item.itemType === 'Lost' ? '🔴 LOST' : '🟢 FOUND'}
                    </span>
                    <h3 style={{ margin: '8px 0 0 0', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text)' }}>
                      {item.title}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: item.status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'Claim Pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    color: item.status === 'Resolved' ? '#10B981' : item.status === 'Claim Pending' ? '#D97706' : '#6366F1',
                    fontWeight: '700'
                  }}>
                    {item.status}
                  </span>
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', flex: 1 }}>
                  {item.description}
                </p>

                {/* Meta details */}
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--background)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'grid',
                  gap: '4px'
                }}>
                  <div>
                    <i className="fa-solid fa-location-dot" style={{ color: '#EF4444', width: '16px' }}></i>
                    <strong>Location:</strong> {item.location}
                  </div>
                  <div>
                    <i className="fa-solid fa-tag" style={{ color: '#6366F1', width: '16px' }}></i>
                    <strong>Category:</strong> {item.category}
                  </div>
                  <div>
                    <i className="fa-solid fa-user" style={{ color: '#0EA5E9', width: '16px' }}></i>
                    <strong>Reported by:</strong> {item.reporterName || 'Resident'}
                  </div>
                </div>

                {/* Claim Notes if pending */}
                {item.claimNotes && (
                  <div style={{ fontSize: '0.78rem', color: '#D97706', background: 'rgba(245, 158, 11, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                    <strong>Claim Request:</strong> {item.claimNotes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                  {item.itemType === 'Found' && item.status === 'Open' && (
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1, fontSize: '0.78rem', background: '#4338CA' }}
                      onClick={() => setClaimModalItem(item)}
                    >
                      <i className="fa-solid fa-hand-holding-dollar"></i> Claim This Item
                    </button>
                  )}

                  {(user?.role === 'Warden' || user?.role === 'Admin' || item.reportedBy === user?._id) && item.status !== 'Resolved' && (
                    <button
                      className="btn btn-sm btn-outline"
                      style={{ flex: 1, fontSize: '0.78rem', borderColor: '#10B981', color: '#10B981' }}
                      onClick={() => handleResolve(item._id)}
                    >
                      <i className="fa-solid fa-check-double"></i> Mark Recovered
                    </button>
                  )}

                  {item.contactNumber && (
                    <a
                      href={`tel:${item.contactNumber}`}
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.78rem' }}
                      title="Contact Finder / Reporter"
                    >
                      <i className="fa-solid fa-phone"></i>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '520px', width: '100%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>
                  <i className="fa-solid fa-bullhorn" style={{ color: '#4338CA', marginRight: '8px' }}></i>
                  Report Lost / Found Property
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowReportModal(false)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleReportSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Report Type *</label>
                    <select
                      className="form-control"
                      value={reportForm.itemType}
                      onChange={(e) => setReportForm({ ...reportForm, itemType: e.target.value })}
                    >
                      <option value="Found">I Found an Item</option>
                      <option value="Lost">I Lost an Item</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-control"
                      value={reportForm.category}
                      onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Item Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Blue Boat Earphones, College ID Card, Casio Watch"
                    required
                    value={reportForm.title}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Where Was it Lost / Found? *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Block A 2nd Floor Corridor, Campus Mess Table 4"
                    required
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Detailed Description *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Provide details such as color, brand, unique markings, time found/lost..."
                    required
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={reportForm.contactNumber}
                    onChange={(e) => setReportForm({ ...reportForm, contactNumber: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Attach Photo (Optional)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#4338CA' }}>
                    Publish to Hub
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Claim Modal */}
        {claimModalItem && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                  Claim Item: {claimModalItem.title}
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setClaimModalItem(null)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleClaimSubmit}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Please describe identifying features or proof of ownership to verify with the finder/warden.
                </p>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Proof / Verification Details *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. My name is on the back sticker / Password lock combination / Key chain tag..."
                    required
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setClaimModalItem(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#4338CA' }}>
                    Submit Claim
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

export default LostFound;
