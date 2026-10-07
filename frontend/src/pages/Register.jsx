import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
    rollNo: '',
    department: 'Computer Science',
    yearOfStudy: 1,
    phone: '',
    gender: 'Male',
    studentType: 'Hosteller'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await register(formData);
      const registeredRole = formData.role?.toLowerCase();
      if (registeredRole === 'faculty') {
        navigate('/faculty-dashboard');
      } else if (registeredRole === 'warden') {
        navigate('/warden-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check form details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container" style={{ padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: '540px' }}>
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div className="hero-logo" style={{ justifyContent: 'center', fontSize: '2rem' }}>
              <i className="fa-solid fa-hotel"></i>
              <span>CampusStay</span>
            </div>
            <h3 style={{ color: 'var(--primary-color)', marginTop: '8px' }}>Create New Account</h3>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderLeft: '4px solid var(--danger-color)',
              color: 'var(--danger-color)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty Advisor</option>
                <option value="Warden">Hostel Warden</option>
              </select>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {formData.role === 'Student' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Roll Number</label>
                    <input
                      type="text"
                      name="rollNo"
                      className="form-control"
                      placeholder="e.g. CS202401"
                      value={formData.rollNo}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Year of Study</label>
                    <select
                      name="yearOfStudy"
                      className="form-control"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      className="form-control"
                      placeholder="e.g. Computer Science"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      className="form-control"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Student Category</label>
                  <select
                    name="studentType"
                    className="form-control"
                    value={formData.studentType}
                    onChange={handleChange}
                  >
                    <option value="Hosteller">Hosteller (Hostel Resident)</option>
                    <option value="Dayscholar">Dayscholar (Non-Resident)</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
              disabled={loading}
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin"></i> Registering...</span>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
