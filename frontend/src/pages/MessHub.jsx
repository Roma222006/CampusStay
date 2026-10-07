import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getWeeklyMenuApi,
  getMessAnalyticsApi,
  rateMealApi,
  toggleSkipMealApi,
  updateMealApi
} from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MessHub = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const isWardenOrAdmin = user?.role === 'Warden' || user?.role === 'Admin';

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Rating Modal
  const [ratingModalMeal, setRatingModalMeal] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Edit Menu Modal (Admin/Warden)
  const [editMeal, setEditMeal] = useState(null);
  const [editForm, setEditForm] = useState({
    dayOfWeek: '',
    mealType: '',
    timing: '',
    menuItems: '',
    specialItem: '',
    dietaryTags: '',
    calories: 500
  });

  useEffect(() => {
    // Default selectedDay to today's day of week
    const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    if (DAYS.includes(currentDay)) {
      setSelectedDay(currentDay);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, statRes] = await Promise.all([
        getWeeklyMenuApi(),
        getMessAnalyticsApi()
      ]);
      setWeeklyMenu(menuRes.data?.weeklyMenu || []);
      setAnalytics(statRes.data || null);
    } catch (err) {
      console.error('Error fetching mess data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToggle = async (mealId) => {
    setError('');
    setMessage('');
    try {
      const res = await toggleSkipMealApi({ mealId });
      setMessage(res.data.message);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update skip meal preference.');
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!ratingModalMeal) return;
    try {
      const res = await rateMealApi({
        mealId: ratingModalMeal._id,
        rating: ratingScore,
        comment: ratingComment
      });
      setMessage(res.data.message);
      setRatingModalMeal(null);
      setRatingComment('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating.');
    }
  };

  const handleUpdateMealSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateMealApi(editForm);
      setMessage(res.data.message);
      setEditMeal(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update menu item.');
    }
  };

  const openEditModal = (meal) => {
    setEditMeal(meal);
    setEditForm({
      dayOfWeek: meal.dayOfWeek,
      mealType: meal.mealType,
      timing: meal.timing || '',
      menuItems: Array.isArray(meal.menuItems) ? meal.menuItems.join(', ') : '',
      specialItem: meal.specialItem || '',
      dietaryTags: Array.isArray(meal.dietaryTags) ? meal.dietaryTags.join(', ') : '',
      calories: meal.calories || 500
    });
  };

  const currentDayMeals = weeklyMenu.filter(m => m.dayOfWeek === selectedDay);

  const getMealIcon = (type) => {
    switch (type) {
      case 'Breakfast': return 'fa-mug-hot';
      case 'Lunch': return 'fa-utensils';
      case 'Snacks': return 'fa-cookie-bite';
      case 'Dinner': return 'fa-bowl-food';
      default: return 'fa-utensils';
    }
  };

  return (
    <Layout>
      <div className="mess-hub-page">
        {/* Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #EA580C 0%, #D97706 50%, #B45309 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.3)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🍽️</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>Smart Mess & Food Waste Reduction Hub</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Weekly curated dining menu, real-time feedback ratings, and eco-friendly meal skip tracker.
            </p>
          </div>

          <button className="btn btn-outline" onClick={fetchData} style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
            <i className="fa-solid fa-arrows-rotate"></i> Refresh Schedule
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

        {/* Analytics & Sustainability Card (Warden/Admin/Student) */}
        {analytics && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div className="card stat-card" style={{ borderLeft: '4px solid #EA580C', padding: '18px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Hostel Residents</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#EA580C', marginTop: '4px' }}>{analytics.totalHostellers}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered mess diners</div>
            </div>

            {analytics.mealHeadcounts && analytics.mealHeadcounts.slice(0, 3).map(mh => (
              <div key={mh.mealId} className="card stat-card" style={{ borderLeft: '4px solid #10B981', padding: '18px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Today's {mh.mealType} Headcount</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                  {mh.predictedHeadcount} <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>/ {mh.totalHostellers}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: '600' }}>
                  🌱 {mh.skipsCount} skips ({mh.foodSavedKgEstimate} kg food saved)
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Day Selector Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '20px'
        }}>
          {DAYS.map(d => (
            <button
              key={d}
              className={`btn ${selectedDay === d ? 'btn-primary' : 'btn-outline'}`}
              style={{
                borderRadius: '10px',
                padding: '8px 20px',
                fontWeight: '600',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setSelectedDay(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Meals Grid for Selected Day */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {['Breakfast', 'Lunch', 'Snacks', 'Dinner'].map(mealType => {
              const meal = currentDayMeals.find(m => m.mealType === mealType) || {
                mealType,
                timing: 'Schedule TBA',
                menuItems: ['Standard Menu Available'],
                specialItem: '',
                dietaryTags: ['Vegetarian'],
                calories: 450,
                ratings: [],
                mealSkips: []
              };

              const studentSkipped = isStudent && meal.mealSkips?.some(s => s.student?.toString() === user?._id?.toString() || s.student === user?._id);

              return (
                <div
                  key={mealType}
                  className="card"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative',
                    borderTop: `4px solid ${
                      mealType === 'Breakfast' ? '#3B82F6' :
                      mealType === 'Lunch' ? '#10B981' :
                      mealType === 'Snacks' ? '#F59E0B' : '#8B5CF6'
                    }`
                  }}
                >
                  {/* Meal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                      }}>
                        <i className={`fa-solid ${getMealIcon(mealType)}`}></i>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>{mealType}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <i className="fa-regular fa-clock"></i> {meal.timing || '7:30 AM - 9:30 AM'}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#EA580C' }}>
                        ⭐ {meal.averageRating || 4.5}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        ({meal.ratings?.length || 0} reviews)
                      </div>
                    </div>
                  </div>

                  {/* Special Highlight Item */}
                  {meal.specialItem && (
                    <div style={{
                      padding: '8px 12px',
                      background: 'rgba(234, 88, 12, 0.08)',
                      border: '1px dashed #EA580C',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: '#C2410C',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span>✨ Chef Special:</span>
                      <strong>{meal.specialItem}</strong>
                    </div>
                  )}

                  {/* Menu Items List */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Menu Items
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text)', display: 'grid', gap: '4px' }}>
                      {(meal.menuItems || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Dietary tags & calories */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(meal.dietaryTags || []).map((t, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          background: 'var(--background)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                      🔥 {meal.calories || 450} kcal
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                    {isStudent && (
                      <>
                        <button
                          className={`btn btn-sm ${studentSkipped ? 'btn-outline' : 'btn-primary'}`}
                          style={{
                            flex: 1,
                            fontSize: '0.75rem',
                            background: studentSkipped ? 'none' : '#10B981',
                            borderColor: '#10B981',
                            color: studentSkipped ? '#10B981' : '#fff'
                          }}
                          onClick={() => handleSkipToggle(meal._id)}
                        >
                          {studentSkipped ? (
                            <span><i className="fa-solid fa-rotate-left"></i> Cancel Skip</span>
                          ) : (
                            <span>🌱 Skip Meal (Save Waste)</span>
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setRatingModalMeal(meal)}
                        >
                          ⭐ Rate
                        </button>
                      </>
                    )}

                    {isWardenOrAdmin && (
                      <button
                        className="btn btn-sm btn-outline"
                        style={{ width: '100%', fontSize: '0.78rem' }}
                        onClick={() => openEditModal(meal)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit Meal Menu
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rate Meal Modal */}
        {ratingModalMeal && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '420px', width: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                  Rate {ratingModalMeal.mealType} ({selectedDay})
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setRatingModalMeal(null)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleRatingSubmit}>
                <div style={{ textAlign: 'center', margin: '16px 0' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Your Satisfaction Rating:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '1.8rem', cursor: 'pointer' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <i
                        key={star}
                        className={`fa-star ${star <= ratingScore ? 'fa-solid' : 'fa-regular'}`}
                        style={{ color: '#F59E0B' }}
                        onClick={() => setRatingScore(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Feedback or Taste Comments</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g. Sambar was delicious, Paneer was fresh..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setRatingModalMeal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#EA580C' }}>
                    Submit Rating
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Meal Modal (Warden/Admin) */}
        {editMeal && (
          <div className="modal-overlay" style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="modal-content card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                  Edit {editMeal.dayOfWeek} {editMeal.mealType} Menu
                </h3>
                <button
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setEditMeal(null)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleUpdateMealSubmit}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Meal Timings</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.timing}
                    onChange={(e) => setEditForm({ ...editForm, timing: e.target.value })}
                    placeholder="e.g. 07:30 AM – 09:30 AM"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Menu Items (comma separated)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={editForm.menuItems}
                    onChange={(e) => setEditForm({ ...editForm, menuItems: e.target.value })}
                    placeholder="Idli, Sambar, Coconut Chutney, Tea"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label">Special Chef Item (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.specialItem}
                    onChange={(e) => setEditForm({ ...editForm, specialItem: e.target.value })}
                    placeholder="e.g. Gulab Jamun, Biryani"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Dietary Tags</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editForm.dietaryTags}
                      onChange={(e) => setEditForm({ ...editForm, dietaryTags: e.target.value })}
                      placeholder="Vegetarian, High Protein"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Calories (kcal)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editForm.calories}
                      onChange={(e) => setEditForm({ ...editForm, calories: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditMeal(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Menu
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

export default MessHub;
