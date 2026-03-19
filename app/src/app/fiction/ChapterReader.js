import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class ChapterReader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chapter: null,
      fiction: null,
      totalChapters: 0,
      loading: true,
      error: '',
    };
  }

  componentDidMount() {
    this.loadChapter();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.num !== this.props.match.params.num) {
      this.setState({ loading: true, error: '' }, this.loadChapter);
    }
  }

  loadChapter = () => {
    const { id, num } = this.props.match.params;
    Promise.all([
      api.get(`/api/fictions/${id}/chapters/${num}`),
      api.get(`/api/fictions/${id}`),
      api.get(`/api/fictions/${id}/chapters`),
    ])
      .then(([chRes, fRes, allRes]) => {
        this.setState({
          chapter: chRes.data,
          fiction: fRes.data,
          totalChapters: allRes.data.length,
          loading: false,
        });
        window.scrollTo(0, 0);
      })
      .catch(() => this.setState({ error: 'Chapter not found.', loading: false }));
  }

  render() {
    const { chapter, fiction, totalChapters, loading, error } = this.state;
    const { id, num } = this.props.match.params;
    const numInt = parseInt(num, 10);

    if (loading) return <div className="wl-reading-page"><GeneralNavbar /><div className="wl-loading">Loading chapter…</div></div>;
    if (error || !chapter) return <div className="wl-reading-page"><GeneralNavbar /><div className="wl-error" style={{ margin: '2rem' }}>{error}</div></div>;

    return (
      <div className="wl-reading-page">
        <GeneralNavbar />
        <div className="wl-reading-body">

          {/* Breadcrumb */}
          <div className="wl-breadcrumb">
            <Link to="/browse">Browse</Link>
            <span className="wl-breadcrumb-sep">›</span>
            {fiction && <Link to={`/fiction/${id}`}>{fiction.title}</Link>}
            <span className="wl-breadcrumb-sep">›</span>
            <span>Ch. {num}</span>
          </div>

          {/* Chapter heading */}
          <div style={{ marginBottom: '3rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--ink-3)' }}>
            <p className="wl-label" style={{ marginBottom: '0.5rem' }}>
              Chapter {chapter.chapterNumber}
              {fiction && (
                <> · <Link to={`/fiction/${id}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{fiction.title}</Link></>
              )}
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 700,
              color: 'var(--parchment)',
              lineHeight: 1.2,
              margin: 0,
            }}>
              {chapter.title}
            </h1>
          </div>

          {/* Content */}
          <div className="wl-reading-content">
            {chapter.content}
          </div>

          {/* Navigation */}
          <div className="wl-reading-nav">
            {numInt > 1 ? (
              <Link
                to={`/fiction/${id}/chapter/${numInt - 1}`}
                className="wl-btn wl-btn-ghost"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <Link to={`/fiction/${id}`} className="wl-label" style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}>
              Contents
            </Link>
            {numInt < totalChapters ? (
              <Link
                to={`/fiction/${id}/chapter/${numInt + 1}`}
                className="wl-btn wl-btn-primary"
              >
                Next →
              </Link>
            ) : (
              <span className="wl-meta" style={{ fontStyle: 'italic' }}>Latest chapter</span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ChapterReader;
