import React, { Component } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/',
  timeout: 5000,
});

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      error: false,
      errorMessage: '',
      submitting: false,
    };
  }

  componentDidMount() {
    if (window.localStorage.getItem('isLoggedIn') === 'true') {
      window.location.replace('/');
    }
  }

  handleChange = (e) => {
    this.setState({ [e.target.id]: e.target.value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitting: true, error: false });

    axiosInstance.post('api/auth/login', {
      username: this.state.username,
      password: this.state.password,
    })
      .then(response => {
        window.localStorage.setItem('isLoggedIn', true);
        window.localStorage.setItem('loginJwt', response.data.token);
        window.localStorage.setItem('username', jwtDecode(response.data.token).sub);
        window.location.replace('/');
      })
      .catch(err => {
        window.localStorage.setItem('isLoggedIn', false);
        window.localStorage.setItem('loginJwt', '');
        const msg = err.response?.data?.error || 'Invalid username or password.';
        this.setState({ error: true, errorMessage: msg, submitting: false });
      });
  }

  render() {
    const { username, password, error, errorMessage, submitting } = this.state;

    return (
      <div className="wl-auth-page">
        <div className="wl-auth-card">
          <div className="wl-auth-logo">
            <a href="/">Writers<span>life</span></a>
          </div>

          <h1 className="wl-auth-title">Welcome back</h1>

          <form onSubmit={this.handleSubmit}>
            <div className="wl-field">
              <label className="wl-field-label">Username</label>
              <input
                required
                type="text"
                id="username"
                value={username}
                onChange={this.handleChange}
                className="wl-input"
                placeholder="Your username"
                autoFocus
              />
            </div>

            <div className="wl-field">
              <label className="wl-field-label">Password</label>
              <input
                required
                type="password"
                id="password"
                value={password}
                onChange={this.handleChange}
                className="wl-input"
                placeholder="Your password"
              />
            </div>

            {error && <div className="wl-error">{errorMessage}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="wl-btn wl-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="wl-auth-footer">
            No account yet?{' '}
            <a href="/Signup">Join free</a>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
