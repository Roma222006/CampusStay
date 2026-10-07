import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setContactForm({ name: '', email: '', category: 'General Inquiry', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    }, 800);
  };

  return (
    <div className="landing-page-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Landing Navbar */}
      <nav className="landing-navbar">
        <Link to="/" className="landing-nav-logo">
          <i className="fa-solid fa-hotel"></i>
          <span>CampusStay</span>
        </Link>

        <ul className="landing-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login?role=Student">Student Portal</Link></li>
          <li><Link to="/login?role=Faculty">Faculty Portal</Link></li>
          <li><Link to="/login?role=Warden">Warden Desk</Link></li>
          <li><Link to="/login?role=Admin">Admin Console</Link></li>
        </ul>

        <div className="landing-nav-actions">
          <Link to="/login" className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-right-to-bracket"></i> Sign In
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-user-plus"></i> Register
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px 24px 80px' }}>
        <div className="contact-section-wrapper" style={{ margin: '0 auto', maxWidth: '1100px' }}>
          
          <div className="landing-section-header" style={{ marginBottom: '36px' }}>
            <span className="section-tag">24/7 Hostel Assistance</span>
            <h1 className="landing-section-title" style={{ fontSize: '2.4rem' }}>Hostel Helpdesk & Support Portal</h1>
            <p className="landing-section-desc">
              Connect directly with the campus housing administration, hostel wardens, and IT support team.
            </p>
          </div>

          <div className="contact-layout-grid">
            {/* Left Panel */}
            <div className="contact-info-panel">
              <div className="contact-info-header">
                <h3>Campus Administration HQ</h3>
                <p>Official communication channels for residential students, guardians, and faculty advisors.</p>
              </div>

              <div className="contact-methods-list">
                <div className="contact-method-card">
                  <div className="contact-method-icon">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div className="contact-method-text">
                    <h5>Office Address</h5>
                    <p>Hostel Administrative Center, East Campus, University Tech Zone</p>
                  </div>
                </div>

                <div className="contact-method-card">
                  <div className="contact-method-icon">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div className="contact-method-text">
                    <h5>Helpdesk Phone Lines</h5>
                    <p>+91 (044) 2836-7000 / +91 (044) 2836-7001</p>
                  </div>
                </div>

                <div className="contact-method-card">
                  <div className="contact-method-icon">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div className="contact-method-text">
                    <h5>Support Inquiries Email</h5>
                    <p>support@campusstay.com &bull; helpdesk@campusstay.com</p>
                  </div>
                </div>

                <div className="contact-method-card">
                  <div className="contact-method-icon">
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <div className="contact-method-text">
                    <h5>Working Hours</h5>
                    <p>Monday – Saturday: 08:30 AM to 05:30 PM (IST)</p>
                  </div>
                </div>
              </div>

              {/* Emergency Hotline Warning Box */}
              <div className="emergency-helpline-box">
                <i className="fa-solid fa-phone-volume"></i>
                <div>
                  <h5>24/7 Security & Medical Emergency</h5>
                  <p>Call <strong>+91 98765 43210</strong> or trigger the 1-Tap SOS Beacon from your student dashboard.</p>
                </div>
              </div>
            </div>

            {/* Right Panel: Form */}
            <div className="contact-form-container">
              <h4>Submit an Official Inquiry</h4>
              <p className="form-sub">Our administration desk answers all verified inquiries promptly.</p>

              {submitted && (
                <div style={{
                  padding: '14px 16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  borderRadius: '12px',
                  color: '#047857',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600
                }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: '1.2rem' }}></i>
                  <span>Your message has been safely received. The warden/admin office will respond shortly.</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your name"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Your email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Department / Query Category</label>
                  <select
                    className="form-control"
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Room Allocation & Swap">Room Allocation & Swap (Same-Gender)</option>
                    <option value="Hostel Facilities & Maintenance">Hostel Facilities & Maintenance</option>
                    <option value="Leave & Gate Pass Support">Leave & Gate Pass Support</option>
                    <option value="Dining & Mess Council">Dining & Mess Council</option>
                    <option value="IT Portal Technical Support">IT Portal Technical Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Brief summary of your query"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Message Content</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Describe your query with your register number or block details..."
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: '46px', fontSize: '0.95rem', fontWeight: 700, borderRadius: '10px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</span>
                  ) : (
                    <span><i className="fa-solid fa-paper-plane"></i> Send Support Request</span>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer-pro" style={{ marginTop: 'auto' }}>
        <div className="footer-bottom-bar" style={{ border: 'none', paddingTop: 0 }}>
          <div>&copy; {new Date().getFullYear()} CampusStay Systems. All rights reserved.</div>
          <Link to="/" style={{ color: '#38BDF8', fontWeight: 600 }}>&larr; Back to Main Landing</Link>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
