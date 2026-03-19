import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class FictionDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fiction: null,
      chapters: [],
      following: false,
      loading: true,
      error: '',
    };
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    const isLoggedIn = window.localStorage.getItem('isLoggedIn') === 'true';

    Promise.all([
      api.get(`/api/fictions/${id}`),
      api.get(`/api/fictions/${id}/chapters`),
      isLoggedIn ? api.get(`/api/fictions/${id}/follow/status`) : Promise.resolve({ data: { following: false } }),
    ])
      .then(([fRes, cRes, fwRes]) => {
        this.setState({
          fiction: fRes.data,
          chapters: cRes.data,
          following: fwRes.data.following,
          loading: false,
        });
      })
      .catch(() => this.setState({ error: 'Failed to load fiction.', loading: false }));
  }

  handleFollow = () => {
    const { id } = this.props.match.params;
    const { following } = this.state;
    const req = following
      ? api.delete(`/api/fictions/${id}/follow`)
      : api.post(`/api/fictions/${id}/follow`);

    req.then(res => {
      this.setState(prev => ({
        following: res.data.following,
        fiction: {
          ...prev.fiction,
          followerCount: prev.fiction.followerCount + (res.data.following ? 1 : -1),
        },
      }));
    }).catch(() => {
      if (window.localStorage.getItem('isLoggedIn') !== 'true') {
        this.props.history.push('/login');
      }
    });
  }

  render() {
    const { fiction, chapters, following, loading, error } = this.state;
    const isLoggedIn = window.localStorage.getItem('isLoggedIn') === 'true';
    const myUsername = window.localStorage.getItem('username');

    if (loading) return <div><GeneralNavbar /><div className="wl-loading">Loading…</div></div>;
    if (error || !fiction) return <div><GeneralNavbar /><div className="wl-error" style={{ margin: '2rem' }}>{error || 'Not found.'}</div></div>;

    const isAuthor = isLoggedIn && myUsername === fiction.authorName;

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page-narrow">

          {/* Breadcrumb */}
          <div className="wl-breadcrumb">
            <Link to="/browse">Browse</Link>
            <span className="wl-breadcrumb-sep">›</span>
            <span>{fiction.title}</span>
          </div>

          {/* Header */}
          <div className="wl-fiction-header">
            <h1 className="wl-fiction-title">{fiction.title}</h1>
            <p className="wl-byline">
              by <Link to={`/profile/${fiction.authorName}`}>{fiction.authorName}</Link>
            </p>

            <div className="wl-tags" style={{ margin: '0.75rem 0' }}>
              {(fiction.genres || []).map(g => (
                <span key={g} className="wl-tag wl-tag-genre">{g}</span>
              ))}
              {(fiction.tags || []).map(t => (
                <span key={t} className="wl-tag wl-tag-tag">#{t}</span>
              ))}
              <span className="wl-tag wl-tag-status">{fiction.status}</span>
            </div>

            <div className="wl-stats" style={{ marginTop: '0.75rem' }}>
              <span className="wl-stats-item">{fiction.chapterCount} chapters</span>
              <span className="wl-stats-item">{fiction.viewCount} views</span>
              <span className="wl-stats-item">{fiction.followerCount} followers</span>
            </div>
          </div>

          {/* Synopsis */}
          <div className="wl-synopsis">{fiction.synopsis}</div>

          {/* Actions */}
          <div className="wl-flex wl-gap" style={{ marginBottom: '2.5rem' }}>
            {isLoggedIn && (
              <button
                onClick={this.handleFollow}
                className={`wl-btn wl-btn-follow${following ? ' following' : ''}`}
              >
                {following ? '✓ Following' : '+ Follow'}
              </button>
            )}
            {chapters.length > 0 && (
              <Link
                to={`/fiction/${fiction.id}/chapter/1`}
                className="wl-btn wl-btn-primary"
              >
                Start Reading
              </Link>
            )}
            {isAuthor && (
              <Link to={`/author/fiction/${fiction.id}/edit`} className="wl-btn wl-btn-ghost">
                Edit Fiction
              </Link>
            )}
            {isAuthor && (
              <Link to={`/author/fiction/${fiction.id}/chapter/new`} className="wl-btn wl-btn-ghost">
                + Write Chapter
              </Link>
            )}
          </div>

          {/* Chapter list */}
          <div style={{ marginBottom: '0.75rem' }} className="wl-section-header">
            <h2 className="wl-heading" style={{ fontSize: '1.1rem' }}>
              Table of Contents
            </h2>
            <span className="wl-meta">{chapters.length} chapters</span>
          </div>

          {chapters.length === 0 ? (
            <p className="wl-empty">No chapters published yet.</p>
          ) : (
            <div className="wl-chapter-list">
              {chapters.map(ch => (
                <div key={ch.id} className="wl-chapter-row">
                  <Link
                    to={`/fiction/${fiction.id}/chapter/${ch.chapterNumber}`}
                    className="wl-chapter-link"
                  >
                    <span className="wl-chapter-num">Ch. {ch.chapterNumber}</span>
                    <span>{ch.title}</span>
                    {ch.status === 'draft' && (
                      <span className="wl-tag wl-tag-draft">Draft</span>
                    )}
                  </Link>
                  <div className="wl-chapter-right">
                    <span className="wl-meta">
                      {ch.status === 'published'
                        ? new Date(ch.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Not published'}
                    </span>
                    {isAuthor && (
                      <Link
                        to={`/author/fiction/${fiction.id}/chapter/${ch.chapterNumber}/edit`}
                        className="wl-btn wl-btn-ghost"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                      >
                        Edit
                      </Link>
                    )}
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

export default FictionDetail;
