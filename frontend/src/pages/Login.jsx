import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DUMMY_CREDENTIALS = {
  Student: {
    email: 'student@campusstay.com',
    password: 'Student@123',
    name: 'Alex Morgan (Student)',
    badgeColor: '#2563EB',
    icon: 'fa-user-graduate'
  },
  Faculty: {
    email: 'faculty@campusstay.com',
    password: 'Faculty@123',
    name: 'Dr. Sarah Johnson (Faculty)',
    badgeColor: '#059669',
    icon: 'fa-chalkboard-user'
  },
  Warden: {
    email: 'warden@campusstay.com',
    password: 'Warden@123',
    name: 'Mr. Robert Wilson (Warden)',
    badgeColor: '#D97706',
    icon: 'fa-shield-halved'
  },
  Admin: {
    email: 'admin@campusstay.com',
    password: 'Admin@123',
    name: 'Chief Admin Office',
    badgeColor: '#7C3AED',
    icon: 'fa-user-tie'
  }
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'Student';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const urlRole = searchParams.get('role');
    if (urlRole && DUMMY_CREDENTIALS[urlRole]) {
      setRole(urlRole);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
  };

  const handleFillDemo = (targetRole, autoSubmit = false) => {
    const cred = DUMMY_CREDENTIALS[targetRole];
    if (!cred) return;
    setRole(targetRole);
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');

    if (autoSubmit) {
      executeLogin(cred.email, cred.password, targetRole);
    }
  };

  const executeLogin = async (loginEmail, loginPass, loginRole) => {
    setError('');
    setLoading(true);

    try {
      const user = await login({ email: loginEmail, password: loginPass, role: loginRole });
      
      // Redirect based on role
      switch (user?.role?.toLowerCase()) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'faculty':
          navigate('/faculty-dashboard');
          break;
        case 'warden':
          navigate('/warden-dashboard');
          break;
        case 'admin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeLogin(email, password, role);
  };

  return (
    <div className="landing-container" style={{ justifyContent: 'center', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        
        {/* Main Card */}
        <div className="glass-card" style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div className="hero-logo" style={{ justifyContent: 'center', fontSize: '2.2rem', marginBottom: '8px' }}>
              <i className="fa-solid fa-hotel" style={{ color: 'var(--primary-color)' }}></i>
              <span style={{ fontWeight: 800, background: 'linear-gradient(135deg, #1E293B, #2563EB)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                CampusStay
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
              Smart Campus Living & Hostel Ecosystem
            </p>
          </div>

          {/* Role selector tabs */}
          <div style={{ 
            display: 'flex', 
            background: '#F1F5F9', 
            borderRadius: '12px', 
            padding: '4px', 
            marginBottom: '20px',
            border: '1px solid #E2E8F0'
          }}>
            {['Student', 'Faculty', 'Warden', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  backgroundColor: role === r ? 'var(--primary-color)' : 'transparent',
                  color: role === r ? '#fff' : '#64748B',
                  boxShadow: role === r ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <i className={`fa-solid ${DUMMY_CREDENTIALS[r].icon}`} style={{ fontSize: '0.78rem' }}></i>
                {r}
              </button>
            ))}
          </div>

          {/* Fast Dummy Login Card */}
          <div style={{
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: `${DUMMY_CREDENTIALS[role].badgeColor}15`,
                color: DUMMY_CREDENTIALS[role].badgeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.9rem'
              }}>
                <i className={`fa-solid ${DUMMY_CREDENTIALS[role].icon}`}></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Demo {role}: {DUMMY_CREDENTIALS[role].email}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Password: <code style={{ background: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>{DUMMY_CREDENTIALS[role].password}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => handleFillDemo(role, false)}
                title="Fill in fields"
                style={{
                  background: '#fff',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Auto-Fill
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo(role, true)}
                title="Log in immediately with demo account"
                disabled={loading}
                style={{
                  background: DUMMY_CREDENTIALS[role].badgeColor,
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <i className="fa-solid fa-bolt"></i> Fast Sign In
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(220, 38, 38, 0.08)',
              borderLeft: '4px solid var(--danger-color)',
              color: 'var(--danger-color)',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  placeholder={`Enter your ${role.toLowerCase()} email`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    paddingLeft: '38px',
                    borderRadius: '8px',
                    height: '42px',
                    fontSize: '0.9rem'
                  }}
                />
                <i className="fa-solid fa-envelope" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  fontSize: '0.9rem'
                }}></i>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    borderRadius: '8px',
                    height: '42px',
                    fontSize: '0.9rem'
                  }}
                />
                <i className="fa-solid fa-lock" style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  fontSize: '0.9rem'
                }}></i>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                height: '44px',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '8px',
                marginTop: '4px'
              }}
              disabled={loading}
            >
              {loading ? (
                <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Signing in...</span>
              ) : (
                <span>Sign In as {role}</span>
              )}
            </button>
          </form>

          {/* Quick All-Role Fast Switch Bar */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', textAlign: 'center' }}>
              Quick Switch Demo Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {Object.keys(DUMMY_CREDENTIALS).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleFillDemo(r, false)}
                  style={{
                    padding: '6px 4px',
                    background: role === r ? `${DUMMY_CREDENTIALS[r].badgeColor}15` : '#F8FAFC',
                    border: `1px solid ${role === r ? DUMMY_CREDENTIALS[r].badgeColor : '#E2E8F0'}`,
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: role === r ? DUMMY_CREDENTIALS[r].badgeColor : '#64748B',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
              Register Here
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
