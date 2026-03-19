import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      fictions: [],
      loading: true,
      error: '',
    };
  }

  componentDidMount() {
    const { username } = this.props.match.params;
    api.get(`/api/users/${username}`)
      .then(res => {
        this.setState({
          user: res.data.user,
          fictions: res.data.fictions || [],
          loading: false,
        });
      })
      .catch(() => this.setState({ error: 'User not found.', loading: false }));
  }

  render() {
    const { user, fictions, loading, error } = this.state;

    if (loading) return <div><GeneralNavbar /><div className="wl-loading">Loading…</div></div>;
    if (error || !user) return <div><GeneralNavbar /><div className="wl-error" style={{ margin: '2rem' }}>{error || 'Not found.'}</div></div>;

    const totalViews = fictions.reduce((n, f) => n + f.viewCount, 0);
    const totalFollowers = fictions.reduce((n, f) => n + f.followerCount, 0);

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page-narrow">

          {/* Profile header */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.5rem',
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--ink-3)',
          }}>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="wl-avatar wl-avatar-lg"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="wl-avatar wl-avatar-lg">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--parchment)',
                marginBottom: '0.25rem',
              }}>
                {user.username}
              </h1>
              <p className="wl-meta" style={{ marginBottom: '0.75rem' }}>
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
              {user.bio && (
                <p style={{ color: 'var(--parchment-dim)', fontSize: '0.95rem', lineHeight: 1.65 }}>
                  {user.bio}
                </p>
              )}
              <div className="wl-stats" style={{ marginTop: '0.75rem' }}>
                <span className="wl-stats-item">{fictions.length} stories</span>
                <span className="wl-stats-item">{totalViews.toLocaleString()} views</span>
                <span className="wl-stats-item">{totalFollowers.toLocaleString()} followers</span>
              </div>
            </div>
          </div>

          {/* Works */}
          <div className="wl-section-header">
            <h2 className="wl-heading" style={{ fontSize: '1.1rem' }}>Published Works</h2>
          </div>

          {fictions.length === 0 ? (
            <p className="wl-empty">No published fiction yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fictions.map(f => (
                <Link
                  key={f.id}
                  to={`/fiction/${f.id}`}
                  className="wl-card wl-card-accent"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="wl-card-title">{f.title}</div>
                    <div className="wl-tags" style={{ marginTop: '0.4rem' }}>
                      {(f.genres || []).map(g => (
                        <span key={g} className="wl-tag wl-tag-genre">{g}</span>
                      ))}
                      <span className="wl-tag wl-tag-status">{f.status}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '1rem', flexShrink: 0 }}>
                    <div className="wl-meta">{f.chapterCount} ch.</div>
                    <div className="wl-meta">{f.viewCount.toLocaleString()} views</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default UserProfile;
