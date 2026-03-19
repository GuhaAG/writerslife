import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class AuthorDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fictions: [],
      loading: true,
      error: '',
    };
  }

  componentDidMount() {
    api.get('/api/user/fictions')
      .then(res => this.setState({ fictions: res.data, loading: false }))
      .catch(() => this.setState({ error: 'Failed to load your fictions.', loading: false }));
  }

  render() {
    const { fictions, loading, error } = this.state;
    const username = window.localStorage.getItem('username');

    const totalViews = fictions.reduce((n, f) => n + f.viewCount, 0);
    const totalFollowers = fictions.reduce((n, f) => n + f.followerCount, 0);
    const totalChapters = fictions.reduce((n, f) => n + f.chapterCount, 0);

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page">

          {/* Header */}
          <div className="wl-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <p className="wl-label" style={{ marginBottom: '0.4rem' }}>Author Dashboard</p>
              <h1 className="wl-display" style={{ fontSize: '2rem', marginBottom: 0 }}>{username}</h1>
            </div>
            <Link to="/author/fiction/new" className="wl-btn wl-btn-primary">
              + New Fiction
            </Link>
          </div>

          {/* Stats strip */}
          {fictions.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2.5rem',
            }}>
              {[
                { label: 'Total Views', value: totalViews },
                { label: 'Followers', value: totalFollowers },
                { label: 'Chapters', value: totalChapters },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--ink-2)',
                  border: '1px solid var(--ink-3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--gold)',
                    lineHeight: 1,
                    marginBottom: '0.35rem',
                  }}>{s.value.toLocaleString()}</div>
                  <div className="wl-label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="wl-error">{error}</div>}

          {/* Fiction list */}
          <div style={{ marginBottom: '0.75rem' }} className="wl-section-header">
            <h2 className="wl-heading" style={{ fontSize: '1.1rem' }}>Your Works</h2>
            <span className="wl-meta">{fictions.length} stories</span>
          </div>

          {loading ? (
            <div className="wl-loading">Loading…</div>
          ) : fictions.length === 0 ? (
            <div className="wl-empty">
              <p style={{ marginBottom: '1rem' }}>You haven't written any fiction yet.</p>
              <Link to="/author/fiction/new" className="wl-btn wl-btn-primary">Begin your first story</Link>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--ink-3)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {fictions.map(f => (
                <div key={f.id} className="wl-dashboard-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/fiction/${f.id}`} style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: 'var(--parchment)',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '0.35rem',
                    }}>
                      {f.title}
                    </Link>
                    <div className="wl-flex wl-gap-sm" style={{ flexWrap: 'wrap' }}>
                      <span className="wl-stat-pill">{f.chapterCount} ch.</span>
                      <span className="wl-stat-pill">{f.viewCount} views</span>
                      <span className="wl-stat-pill">{f.followerCount} followers</span>
                      <span className="wl-tag wl-tag-status">{f.status}</span>
                    </div>
                  </div>
                  <div className="wl-flex wl-gap-sm" style={{ marginLeft: '1rem' }}>
                    <Link
                      to={`/author/fiction/${f.id}/chapter/new`}
                      className="wl-btn wl-btn-primary"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      + Chapter
                    </Link>
                    <Link
                      to={`/author/fiction/${f.id}/edit`}
                      className="wl-btn wl-btn-ghost"
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AuthorDashboard;
