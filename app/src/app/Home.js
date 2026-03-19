import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from './nav/GeneralNavbar';
import api from './api';

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recent: [],
      popular: [],
      loading: true,
    };
  }

  componentDidMount() {
    Promise.all([
      api.get('/api/fictions?sort=recent'),
      api.get('/api/fictions?sort=popular'),
    ]).then(([recentRes, popularRes]) => {
      this.setState({
        recent: recentRes.data.slice(0, 6),
        popular: popularRes.data.slice(0, 6),
        loading: false,
      });
    }).catch(() => this.setState({ loading: false }));
  }

  renderCard(f) {
    return (
      <Link key={f.id} to={`/fiction/${f.id}`} className="wl-card wl-card-accent">
        <div className="wl-card-title">{f.title}</div>
        <div className="wl-card-author">by {f.authorName}</div>
        <div className="wl-card-synopsis">{f.synopsis}</div>
        <div className="wl-tags wl-mb-sm">
          {(f.genres || []).map(g => (
            <span key={g} className="wl-tag wl-tag-genre">{g}</span>
          ))}
        </div>
        <div className="wl-card-footer">
          <span className="wl-meta">{f.chapterCount} ch.</span>
          <span className="wl-meta">{f.viewCount} views</span>
          <span className="wl-meta">{f.followerCount} followers</span>
        </div>
      </Link>
    );
  }

  render() {
    const { recent, popular, loading } = this.state;
    const username = window.localStorage.getItem('username');

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page">

          {/* Hero */}
          <div className="wl-hero">
            <div className="wl-hero-eyebrow">Your reading list awaits</div>
            <h1 className="wl-hero-title">Welcome back, {username}.</h1>
            <p className="wl-hero-sub">Discover stories. Follow authors. Write your own.</p>
            <div className="wl-hero-actions">
              <Link to="/browse" className="wl-btn wl-btn-primary">Browse fiction</Link>
              <Link to="/author/fiction/new" className="wl-btn wl-btn-ghost">Start writing</Link>
            </div>
          </div>

          {loading ? (
            <div className="wl-loading">Loading stories…</div>
          ) : (
            <>
              <section style={{ marginBottom: '3rem' }}>
                <div className="wl-section-header">
                  <h2 className="wl-heading">Recently Updated</h2>
                  <Link to="/browse" className="wl-section-see-all">See all →</Link>
                </div>
                {recent.length === 0 ? (
                  <p className="wl-empty">
                    No fiction yet.{' '}
                    <Link to="/author/fiction/new" style={{ color: 'var(--gold)' }}>Be the first to write.</Link>
                  </p>
                ) : (
                  <div className="wl-grid">{recent.map(f => this.renderCard(f))}</div>
                )}
              </section>

              <section style={{ marginBottom: '3rem' }}>
                <div className="wl-section-header">
                  <h2 className="wl-heading">Most Popular</h2>
                  <Link to="/browse" className="wl-section-see-all">See all →</Link>
                </div>
                {popular.length === 0 ? (
                  <p className="wl-empty">Nothing here yet.</p>
                ) : (
                  <div className="wl-grid">{popular.map(f => this.renderCard(f))}</div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default Home;
