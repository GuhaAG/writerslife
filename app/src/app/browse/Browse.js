import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

const GENRES = ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance', 'Thriller', 'Adventure', 'Historical'];

class Browse extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fictions: [],
      search: '',
      genre: '',
      sort: 'recent',
      loading: true,
      error: '',
    };
  }

  componentDidMount() {
    this.fetchFictions();
  }

  fetchFictions = () => {
    const { search, genre, sort } = this.state;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (genre) params.set('genre', genre);
    if (sort) params.set('sort', sort);

    api.get(`/api/fictions?${params.toString()}`)
      .then(res => this.setState({ fictions: res.data, loading: false }))
      .catch(() => this.setState({ error: 'Failed to load fictions.', loading: false }));
  }

  handleSearch = (e) => {
    e.preventDefault();
    this.setState({ loading: true }, this.fetchFictions);
  }

  handleGenre = (g) => {
    this.setState({ genre: this.state.genre === g ? '' : g, loading: true }, this.fetchFictions);
  }

  handleSort = (sort) => {
    this.setState({ sort, loading: true }, this.fetchFictions);
  }

  render() {
    const { fictions, search, genre, sort, loading, error } = this.state;

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page">

          <div style={{ marginBottom: '2rem' }}>
            <h1 className="wl-display" style={{ marginBottom: '0.25rem' }}>Browse Fiction</h1>
            <p className="wl-label" style={{ marginTop: '0.5rem' }}>
              {loading ? '…' : `${fictions.length} stories`}
            </p>
          </div>

          {/* Search */}
          <form onSubmit={this.handleSearch} className="wl-search">
            <input
              type="text"
              className="wl-search-input"
              placeholder="Search by title or synopsis…"
              value={search}
              onChange={e => this.setState({ search: e.target.value })}
            />
            <button type="submit" className="wl-btn wl-btn-primary">Search</button>
          </form>

          {/* Genre filters */}
          <div className="wl-tags" style={{ marginBottom: '1rem' }}>
            {GENRES.map(g => (
              <button
                key={g}
                onClick={() => this.handleGenre(g)}
                className={`wl-tag wl-tag-genre clickable${genre === g ? ' active' : ''}`}
                style={{ border: 'none', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}
              >
                {g}
              </button>
            ))}
            {genre && (
              <button
                onClick={() => this.handleGenre(genre)}
                className="wl-tag wl-tag-tag"
                style={{ border: '1px solid var(--ink-4)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
              >
                ✕ clear
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="wl-flex wl-gap-sm" style={{ marginBottom: '2rem' }}>
            <span className="wl-label">Sort by</span>
            {['recent', 'popular'].map(s => (
              <button
                key={s}
                onClick={() => this.handleSort(s)}
                className="wl-btn wl-btn-ghost"
                style={{
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.72rem',
                  background: sort === s ? 'var(--ink-4)' : '',
                  color: sort === s ? 'var(--parchment)' : '',
                  borderColor: sort === s ? 'var(--ink-5)' : '',
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="wl-error">{error}</div>}

          {loading ? (
            <div className="wl-loading">Loading stories…</div>
          ) : fictions.length === 0 ? (
            <p className="wl-empty">No fiction found matching your filters.</p>
          ) : (
            <div className="wl-grid">
              {fictions.map(f => (
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
                    <span className="wl-tag wl-tag-status" style={{ marginLeft: 'auto' }}>{f.status}</span>
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

export default Browse;
