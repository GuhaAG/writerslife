import React, { Component } from 'react';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 5000,
});

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      email: '',
      password: '',
      confirm_password: '',
      error: false,
      errorMessage: '',
      submitting: false,
      success: false,
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.id]: e.target.value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { username, email, password, confirm_password } = this.state;

    if (password !== confirm_password) {
      this.setState({ error: true, errorMessage: 'Passwords do not match.' });
      return;
    }

    this.setState({ submitting: true, error: false });

    axiosInstance.post('api/auth/register', { username, email, password })
      .then(() => {
        this.setState({ success: true, submitting: false });
        setTimeout(() => window.location.replace('/login'), 1800);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Could not create account.';
        this.setState({ error: true, errorMessage: msg, submitting: false });
      });
  }

  render() {
    const { username, email, password, confirm_password, error, errorMessage, submitting, success } = this.state;

    return (
      <div className="wl-auth-page">
        <div className="wl-auth-card">
          <div className="wl-auth-logo">
            <a href="/">Writers<span>life</span></a>
          </div>

          <h1 className="wl-auth-title">Create your account</h1>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: 'var(--jade-bright)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Account created!
              </p>
              <p className="wl-meta">Taking you to login…</p>
            </div>
          ) : (
            <form onSubmit={this.handleSubmit}>
              <div className="wl-field">
                <label className="wl-field-label">Username *</label>
                <input
                  required
                  type="text"
                  id="username"
                  value={username}
                  onChange={this.handleChange}
                  className="wl-input"
                  placeholder="Choose a username"
                  autoFocus
                />
              </div>

              <div className="wl-field">
                <label className="wl-field-label">Email *</label>
                <input
                  required
                  type="email"
                  id="email"
                  value={email}
                  onChange={this.handleChange}
                  className="wl-input"
                  placeholder="your@email.com"
                />
              </div>

              <div className="wl-field">
                <label className="wl-field-label">Password *</label>
                <input
                  required
                  type="password"
                  id="password"
                  value={password}
                  onChange={this.handleChange}
                  className="wl-input"
                  placeholder="Choose a password"
                />
              </div>

              <div className="wl-field">
                <label className="wl-field-label">Confirm Password *</label>
                <input
                  required
                  type="password"
                  id="confirm_password"
                  value={confirm_password}
                  onChange={this.handleChange}
                  className="wl-input"
                  placeholder="Repeat your password"
                />
              </div>

              {error && <div className="wl-error">{errorMessage}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="wl-btn wl-btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}

          <div className="wl-auth-footer">
            Already have an account?{' '}
            <a href="/login">Sign in</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Signup;
