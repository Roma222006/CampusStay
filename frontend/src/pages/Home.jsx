import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleClick = (role) => {
    navigate(`/login?role=${role}`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setContactForm({ name: '', email: '', category: 'General Inquiry', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    }, 800);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-wrapper">
      
      {/* Top Notification Announcement Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #1E293B 0%, #0F172A 100%)',
        color: '#E2E8F0',
        padding: '8px 16px',
        fontSize: '0.82rem',
        fontWeight: 600,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <span className="badge-live-pulse" style={{ color: '#10B981', fontSize: '0.78rem' }}>LIVE</span>
        <span>CampusStay 3.0: AI Roommate Radar with 100% Strict Same-Gender Compatibility Engine</span>
        <Link to="/login?role=Student" style={{ color: '#38BDF8', marginLeft: '6px', textDecoration: 'underline' }}>
          Explore Student Portal &rarr;
        </Link>
      </div>

      {/* Sticky Header Navigation */}
      <nav className="landing-navbar">
        <Link to="/" className="landing-nav-logo">
          <i className="fa-solid fa-hotel"></i>
          <span>CampusStay</span>
        </Link>

        <ul className="landing-nav-links">
          <li><a href="#portals" onClick={(e) => { e.preventDefault(); scrollToSection('portals'); }}>Role Portals</a></li>
          <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Innovations</a></li>
          <li><a href="#gender-policy" onClick={(e) => { e.preventDefault(); scrollToSection('gender-policy'); }}>Roommate Safety</a></li>
          <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a></li>
          <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact Support</a></li>
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

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-pill-badge">
          <i className="fa-solid fa-sparkles"></i>
          <span>Next-Generation Campus Living OS • Enterprise Hostel Management</span>
        </div>

        <h1>
          CampusStay <br />
          <span className="gradient-text">Student Leave Management & Hostel Room Allocation System</span>
        </h1>

        <p className="hero-desc">
          CampusStay is the modern, unified operating system for student housing. Designed for seamless room allocation, multi-level leave approvals, digital QR gate passes, and smart dining management.
        </p>

        <div className="hero-cta-group">
          <button 
            onClick={() => scrollToSection('portals')} 
            className="btn-hero-primary"
          >
            <i className="fa-solid fa-layer-group"></i> Access Role Portals
          </button>
          
          <Link to="/register" className="btn-hero-secondary">
            <i className="fa-solid fa-user-graduate"></i> New Student Registration
          </Link>
        </div>

        {/* Highlight Stats Strip */}
        <div className="hero-stats-strip">
          <div className="stat-item">
            <div className="stat-num">3</div>
            <div className="stat-label">Modern Hostel Blocks</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">100%</div>
            <div className="stat-label">Same-Gender Verified</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">24/7</div>
            <div className="stat-label">Rapid SOS Beacon Hub</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">99.4%</div>
            <div className="stat-label">Resident Satisfaction</div>
          </div>
        </div>
      </header>

      {/* Strict Gender Compliance & Safety Banner */}
      <section id="gender-policy" style={{ padding: '0 24px' }}>
        <div className="gender-safe-banner">
          <div className="gender-safe-content">
            <h3>
              <i className="fa-solid fa-shield-halved"></i>
              Strict Same-Gender Compatibility & Allocation Guarantee
            </h3>
            <p>
              Our AI Room Allocation and Roommate Radar algorithm enforces complete gender separation. 
              Male residents are exclusively matched with Male roommates (in Aryabhata & Ramanujan Blocks), 
              and Female residents are exclusively matched with Female roommates (in Gargi Block). 
              Cross-gender compatibility comparisons are strictly eliminated.
            </p>
          </div>
          <div className="gender-pills">
            <div className="gender-pill">
              <i className="fa-solid fa-mars"></i> Male &harr; Male Only
            </div>
            <div className="gender-pill">
              <i className="fa-solid fa-venus"></i> Female &harr; Female Only
            </div>
          </div>
        </div>
      </section>

      {/* Role Portals Section */}
      <section className="landing-section" id="portals" style={{ maxWidth: '1200px', margin: '90px auto 0 auto', padding: '0 24px' }}>
        <div className="landing-section-header">
          <span className="section-tag">Role-Based Access</span>
          <h2 className="landing-section-title">Dedicated Portals for Every Campus Role</h2>
          <p className="landing-section-desc">
            Tailored dashboard workflows for students, faculty advisors, hostel wardens, and chief administrators.
          </p>
        </div>

        <div className="portals-grid">
          {/* Student Portal Card */}
          <div 
            className="portal-card" 
            style={{ '--card-color': '#2563EB', '--card-bg': 'rgba(37, 99, 235, 0.1)' }}
            onClick={() => handleRoleClick('Student')}
          >
            <div>
              <div className="portal-icon-wrapper">
                <i className="fa-solid fa-user-graduate"></i>
              </div>
              <h3 className="portal-title">Student Portal</h3>
              <p className="portal-desc">Personal hostel home for room allocation, digital passes, and daily living.</p>
              
              <ul className="portal-features-list">
                <li><i className="fa-solid fa-check"></i> AI Roommate Radar (Same-Gender)</li>
                <li><i className="fa-solid fa-check"></i> Digital QR Gate Pass</li>
                <li><i className="fa-solid fa-check"></i> Multi-Step Leave Application</li>
                <li><i className="fa-solid fa-check"></i> Maintenance Ticket Desk</li>
                <li><i className="fa-solid fa-check"></i> 1-Tap Emergency SOS Beacon</li>
              </ul>
            </div>

            <div className="portal-action-link">
              <span>Sign In as Student</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>

          {/* Faculty Advisor Portal Card */}
          <div 
            className="portal-card" 
            style={{ '--card-color': '#059669', '--card-bg': 'rgba(5, 150, 105, 0.1)' }}
            onClick={() => handleRoleClick('Faculty')}
          >
            <div>
              <div className="portal-icon-wrapper">
                <i className="fa-solid fa-chalkboard-user"></i>
              </div>
              <h3 className="portal-title">Faculty Advisor</h3>
              <p className="portal-desc">Department-level student monitoring, leave approvals, and academic oversight.</p>
              
              <ul className="portal-features-list">
                <li><i className="fa-solid fa-check"></i> Department Student Directory</li>
                <li><i className="fa-solid fa-check"></i> 1-Click Leave Verification</li>
                <li><i className="fa-solid fa-check"></i> Student Leave History Audit</li>
                <li><i className="fa-solid fa-check"></i> PDF & Excel Leave Reports</li>
                <li><i className="fa-solid fa-check"></i> Department Notice Broadcast</li>
              </ul>
            </div>

            <div className="portal-action-link">
              <span>Sign In as Faculty</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>

          {/* Warden Portal Card */}
          <div 
            className="portal-card" 
            style={{ '--card-color': '#D97706', '--card-bg': 'rgba(217, 119, 6, 0.1)' }}
            onClick={() => handleRoleClick('Warden')}
          >
            <div>
              <div className="portal-icon-wrapper">
                <i className="fa-solid fa-shield-halved"></i>
              </div>
              <h3 className="portal-title">Hostel Warden</h3>
              <p className="portal-desc">Comprehensive hostel block administration, resident security, and maintenance.</p>
              
              <ul className="portal-features-list">
                <li><i className="fa-solid fa-check"></i> Block Room Occupancy Matrix</li>
                <li><i className="fa-solid fa-check"></i> Digital Gate Pass Scanner & Overdue</li>
                <li><i className="fa-solid fa-check"></i> Final Leave Sanctioning</li>
                <li><i className="fa-solid fa-check"></i> Maintenance Ticket Assignment</li>
                <li><i className="fa-solid fa-check"></i> Emergency Alert Dispatch</li>
              </ul>
            </div>

            <div className="portal-action-link">
              <span>Sign In as Warden</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>

          {/* Administrator Portal Card */}
          <div 
            className="portal-card" 
            style={{ '--card-color': '#7C3AED', '--card-bg': 'rgba(124, 58, 237, 0.1)' }}
            onClick={() => handleRoleClick('Admin')}
          >
            <div>
              <div className="portal-icon-wrapper">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <h3 className="portal-title">Chief Administrator</h3>
              <p className="portal-desc">Institutional command center for infrastructure, staff, and bulk allocations.</p>
              
              <ul className="portal-features-list">
                <li><i className="fa-solid fa-check"></i> Global Hostel Capacity Metrics</li>
                <li><i className="fa-solid fa-check"></i> Auto-Allocation Engine</li>
                <li><i className="fa-solid fa-check"></i> Staff & User Account Management</li>
                <li><i className="fa-solid fa-check"></i> Comprehensive Audit Analytics</li>
                <li><i className="fa-solid fa-check"></i> Campus-Wide Notice Board</li>
              </ul>
            </div>

            <div className="portal-action-link">
              <span>Sign In as Admin</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Features Matrix */}
      <section className="landing-section" id="features" style={{ maxWidth: '1200px', margin: '100px auto 0 auto', padding: '0 24px' }}>
        <div className="landing-section-header">
          <span className="section-tag">Campus Living 3.0</span>
          <h2 className="landing-section-title">Built with Innovative Smart Modules</h2>
          <p className="landing-section-desc">
            Transforming traditional hostel operations with artificial intelligence and modern mobile-first features.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}>
              <i className="fa-solid fa-compass"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>AI Roommate Compatibility</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Radar matching based on sleep schedules, study noise, hygiene standards, and language preference with guaranteed same-gender pairing.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
              <i className="fa-solid fa-qrcode"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Digital QR Gate Pass</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Instant QR code generation for outings with real-time security gate verification and automated overdue alert tracking.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#D97706' }}>
              <i className="fa-solid fa-utensils"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Smart Mess & Food Saver</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Live weekly dining menu, meal rating ratings, and 1-tap meal skip tracking to drastically minimize campus kitchen food waste.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>1-Tap Emergency SOS Hub</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Instant distress beacon dispatching alerts to block wardens, medical teams, and security desk with location coordinates.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
              <i className="fa-solid fa-box-open"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Community Lost & Found</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Campus-wide item recovery board with image uploads, location tags, claim verification, and return status tracking.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-circle" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9' }}>
              <i className="fa-solid fa-square-poll-vertical"></i>
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>Student Voice & Polls</h4>
            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
              Democratic student polls for mess menu upgrades, quiet hours, library timings, and hostel facility feedback.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="landing-section" id="about" style={{ maxWidth: '1200px', margin: '100px auto 0 auto', padding: '0 24px' }}>
        <div className="glass-card" style={{ padding: '48px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div>
              <span className="section-tag">About CampusStay</span>
              <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>
                Building Safe, Connected & Modern Campus Hostels
              </h3>
              <p style={{ color: '#475569', fontSize: '0.96rem', lineHeight: 1.7, marginBottom: '16px' }}>
                CampusStay was engineered to modernize university housing. By integrating intelligent algorithmic matching, multi-tiered leave approvals, real-time maintenance requests, and digital safety beacons, we eliminate traditional bureaucratic paperwork.
              </p>
              <p style={{ color: '#475569', fontSize: '0.96rem', lineHeight: 1.7 }}>
                Whether you are a resident student looking for a compatible roommate, a faculty advisor approving conference leaves, or a warden supervising hostel security, CampusStay provides a dedicated, lightning-fast workspace.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'center' }}>
                <i className="fa-solid fa-shield-cat" style={{ fontSize: '1.8rem', color: '#2563EB', marginBottom: '10px' }}></i>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>24/7 Security</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Verified campus gates</div>
              </div>
              <div style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'center' }}>
                <i className="fa-solid fa-bolt" style={{ fontSize: '1.8rem', color: '#10B981', marginBottom: '10px' }}></i>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Instant Sync</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Real-time push notices</div>
              </div>
              <div style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'center' }}>
                <i className="fa-solid fa-users" style={{ fontSize: '1.8rem', color: '#F59E0B', marginBottom: '10px' }}></i>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>AI Matching</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>High harmony scores</div>
              </div>
              <div style={{ padding: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', textAlign: 'center' }}>
                <i className="fa-solid fa-file-shield" style={{ fontSize: '1.8rem', color: '#7C3AED', marginBottom: '10px' }}></i>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>Zero Paperwork</div>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Digital audit trails</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Redesigned Professional Contact Us Section */}
      <section className="contact-section-wrapper" id="contact">
        <div className="landing-section-header" style={{ marginBottom: '32px' }}>
          <span className="section-tag">Support & Inquiries</span>
          <h2 className="landing-section-title">Get in Touch with Campus Support</h2>
          <p className="landing-section-desc">
            Have questions about hostel admissions, room transfers, or system support? We are here to help.
          </p>
        </div>

        <div className="contact-layout-grid">
          {/* Left Panel: Contact Information */}
          <div className="contact-info-panel">
            <div className="contact-info-header">
              <h3>Hostel Administration HQ</h3>
              <p>Direct communication channels for residential students, visiting parents, and faculty members.</p>
            </div>

            <div className="contact-methods-list">
              <div className="contact-method-card">
                <div className="contact-method-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div className="contact-method-text">
                  <h5>Campus Location</h5>
                  <p>CampusStay Administrative Block, East University Campus, Innovation Way</p>
                </div>
              </div>

              <div className="contact-method-card">
                <div className="contact-method-icon">
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div className="contact-method-text">
                  <h5>Hostel Helpdesk Phone</h5>
                  <p>+91 (044) 2836-7000 / +91 (044) 2836-7001</p>
                </div>
              </div>

              <div className="contact-method-card">
                <div className="contact-method-icon">
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div className="contact-method-text">
                  <h5>Official Email</h5>
                  <p>support@campusstay.com &bull; warden.office@campusstay.com</p>
                </div>
              </div>

              <div className="contact-method-card">
                <div className="contact-method-icon">
                  <i className="fa-solid fa-clock"></i>
                </div>
                <div className="contact-method-text">
                  <h5>Office Working Hours</h5>
                  <p>Monday – Saturday: 08:30 AM – 05:30 PM (IST)</p>
                </div>
              </div>
            </div>

            {/* Emergency Hotline Warning Box */}
            <div className="emergency-helpline-box">
              <i className="fa-solid fa-phone-volume"></i>
              <div>
                <h5>24/7 Security & Medical Emergency Hotline</h5>
                <p>Dial <strong>+91 98765 43210</strong> or use 1-Tap SOS in the Student Portal for immediate dispatch.</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Inquiry Form */}
          <div className="contact-form-container">
            <h4>Send a Direct Message</h4>
            <p className="form-sub">Our administrative team responds within 24 business hours.</p>

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
                <span>Thank you! Your inquiry has been dispatched to the hostel administration office.</span>
              </div>
            )}

            <form onSubmit={handleContactSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Your Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Morgan"
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
                    placeholder="e.g. resident@campusstay.com"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Department / Category</label>
                <select
                  className="form-control"
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Room Allocation & Swap">Room Allocation & Swap</option>
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
                  placeholder="e.g. Inquiry regarding room swap review timeline"
                  required
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Detailed Message</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Provide all relevant details, register number, and block name..."
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
                  <span><i className="fa-solid fa-spinner fa-spin"></i> Dispatched to Office...</span>
                ) : (
                  <span><i className="fa-solid fa-paper-plane"></i> Submit Message</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Professional SaaS Footer */}
      <footer className="landing-footer-pro">
        <div className="landing-footer-grid">
          <div className="footer-brand">
            <h4>
              <i className="fa-solid fa-hotel" style={{ color: '#38BDF8' }}></i>
              CampusStay
            </h4>
            <p>
              The unified smart living management ecosystem for collegiate residences, students, faculty advisors, and hostel wardens.
            </p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <span className="pill-tag" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                🛡️ Gender-Safe Certified
              </span>
              <span className="pill-tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                ⚡ 99.9% Uptime
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Role Portals</h5>
            <ul>
              <li><Link to="/login?role=Student">Student Workspace</Link></li>
              <li><Link to="/login?role=Faculty">Faculty Advisor Portal</Link></li>
              <li><Link to="/login?role=Warden">Hostel Warden Desk</Link></li>
              <li><Link to="/login?role=Admin">Chief Admin Console</Link></li>
              <li><Link to="/register">Student Registration</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Hostel Blocks</h5>
            <ul>
              <li><a href="#gender-policy" onClick={(e) => { e.preventDefault(); scrollToSection('gender-policy'); }}>Aryabhata Block (Senior Boys)</a></li>
              <li><a href="#gender-policy" onClick={(e) => { e.preventDefault(); scrollToSection('gender-policy'); }}>Ramanujan Block (Junior Boys)</a></li>
              <li><a href="#gender-policy" onClick={(e) => { e.preventDefault(); scrollToSection('gender-policy'); }}>Gargi Block (Exclusive Girls)</a></li>
              <li><Link to="/login">Interactive Campus Map</Link></li>
              <li><Link to="/login">Room Vacancy Matrix</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Support & Security</h5>
            <ul>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Contact Administration</a></li>
              <li><Link to="/login">Digital QR Gate Pass</Link></li>
              <li><Link to="/login">Mess Dining Schedule</Link></li>
              <li><Link to="/login">Emergency SOS Dispatch</Link></li>
              <li><Link to="/login">Community Lost & Found</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div>
            &copy; {new Date().getFullYear()} CampusStay Operating System. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Hostel Code of Conduct</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
