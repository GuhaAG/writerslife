import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class EditChapter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      content: '',
      status: 'draft',
      loading: true,
      error: '',
      submitting: false,
      wordCount: 0,
    };
  }

  componentDidMount() {
    const { id, num } = this.props.match.params;
    api.get(`/api/fictions/${id}/chapters/${num}`)
      .then(res => {
        const words = res.data.content?.trim()?.split(/\s+/)?.length || 0;
        this.setState({
          title: res.data.title,
          content: res.data.content,
          status: res.data.status,
          wordCount: words,
          loading: false,
        });
      })
      .catch(() => this.setState({ error: 'Failed to load chapter.', loading: false }));
  }

  handleChange = (e) => {
    const val = e.target.value;
    const key = e.target.id;
    this.setState({ [key]: val });
    if (key === 'content') {
      const words = val.trim() ? val.trim().split(/\s+/).length : 0;
      this.setState({ wordCount: words });
    }
  }

  handleSubmit = (newStatus) => {
    const { id, num } = this.props.match.params;
    const { title, content } = this.state;
    this.setState({ submitting: true, error: '' });

    api.put(`/api/fictions/${id}/chapters/${num}`, { title, content, status: newStatus })
      .then(() => {
        if (newStatus === 'published') {
          this.props.history.push(`/fiction/${id}/chapter/${num}`);
        } else {
          this.props.history.push(`/fiction/${id}`);
        }
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to update chapter.';
        this.setState({ error: msg, submitting: false });
      });
  }

  render() {
    const { title, content, status, loading, error, submitting, wordCount } = this.state;
    const { id, num } = this.props.match.params;

    if (loading) return <div className="wl-writer-page"><GeneralNavbar /><div className="wl-loading">Loading chapter…</div></div>;

    return (
      <div className="wl-writer-page">
        <div className="wl-writer-header">
          <Link to={`/fiction/${id}`} className="wl-label" style={{ color: 'var(--parchment-faint)', textDecoration: 'none' }}>
            ← Back to story
          </Link>
          <div className="wl-flex wl-gap-sm">
            <span className="wl-meta" style={{ alignSelf: 'center' }}>
              {wordCount > 0 ? `${wordCount.toLocaleString()} words` : ''}
            </span>
            {error && <span className="wl-meta" style={{ color: 'var(--crimson)' }}>{error}</span>}
            {status === 'draft' && (
              <button
                onClick={() => this.handleSubmit('draft')}
                disabled={submitting || !title}
                className="wl-btn wl-btn-ghost"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
              >
                Save draft
              </button>
            )}
            <button
              onClick={() => this.handleSubmit('published')}
              disabled={submitting || !title}
              className="wl-btn wl-btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
            >
              {status === 'published' ? 'Update' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="wl-writer-body">
          <input
            id="title"
            type="text"
            value={title}
            onChange={this.handleChange}
            className="wl-writer-title-input"
            placeholder="Chapter title…"
          />
          <textarea
            id="content"
            value={content}
            onChange={this.handleChange}
            className="wl-writer-textarea"
            placeholder="Write your chapter here…"
          />
        </div>
      </div>
    );
  }
}

export default EditChapter;
