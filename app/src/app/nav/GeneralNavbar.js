import React, { Component } from 'react';

class GeneralNavbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: window.localStorage.getItem('isLoggedIn') === 'true',
      username: window.localStorage.getItem('username') || '',
    };
  }

  handleLogout = () => {
    window.localStorage.removeItem('isLoggedIn');
    window.localStorage.removeItem('loginJwt');
    window.localStorage.removeItem('username');
    window.location.replace('/login');
  }

  render() {
    const { isLoggedIn, username } = this.state;

    return (
      <nav className="wl-nav">
        <a href="/" className="wl-nav-brand">
          Writers<span>life</span>
        </a>

        <ul className="wl-nav-links">
          <li><a href="/browse" className="wl-nav-link">Browse</a></li>

          {isLoggedIn && (
            <li><a href="/author/dashboard" className="wl-nav-link">Write</a></li>
          )}

          <li className="wl-nav-divider" role="separator" />

          {isLoggedIn ? (
            <li className="wl-nav-dropdown">
              <button className="wl-nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{username}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}>
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="wl-nav-dropdown-menu">
                <a href={`/profile/${username}`} className="wl-nav-dropdown-item">Public Profile</a>
                <a href="/Profile" className="wl-nav-dropdown-item">Settings</a>
                <div style={{ borderTop: '1px solid var(--ink-4)', margin: '0.3rem 0' }} />
                <button className="wl-nav-dropdown-item" onClick={this.handleLogout}>
                  Sign out
                </button>
              </div>
            </li>
          ) : (
            <>
              <li><a href="/login" className="wl-nav-link">Login</a></li>
              <li><a href="/Signup" className="wl-nav-cta">Join free</a></li>
            </>
          )}
        </ul>
      </nav>
    );
  }
}

export default GeneralNavbar;
