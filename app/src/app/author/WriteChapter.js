import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

class WriteChapter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      content: '',
      error: '',
      submitting: false,
      wordCount: 0,
    };
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

  handleSubmit = (status) => {
    const { id } = this.props.match.params;
    const { title, content } = this.state;
    this.setState({ submitting: true, error: '' });

    api.post(`/api/fictions/${id}/chapters`, { title, content, status })
      .then(res => {
        if (status === 'published') {
          this.props.history.push(`/fiction/${id}/chapter/${res.data.chapterNumber}`);
        } else {
          this.props.history.push(`/fiction/${id}`);
        }
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to save chapter.';
        this.setState({ error: msg, submitting: false });
      });
  }

  render() {
    const { title, content, error, submitting, wordCount } = this.state;
    const { id } = this.props.match.params;

    return (
      <div className="wl-writer-page">
        {/* Minimal writer header */}
        <div className="wl-writer-header">
          <Link to={`/fiction/${id}`} className="wl-label" style={{ color: 'var(--parchment-faint)', textDecoration: 'none' }}>
            ← Back to story
          </Link>
          <div className="wl-flex wl-gap-sm">
            <span className="wl-meta" style={{ alignSelf: 'center' }}>
              {wordCount > 0 ? `${wordCount.toLocaleString()} words` : ''}
            </span>
            {error && <span className="wl-meta" style={{ color: 'var(--crimson)' }}>{error}</span>}
            <button
              onClick={() => this.handleSubmit('draft')}
              disabled={submitting || !title}
              className="wl-btn wl-btn-ghost"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
            >
              Save draft
            </button>
            <button
              onClick={() => this.handleSubmit('published')}
              disabled={submitting || !title}
              className="wl-btn wl-btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Writing area */}
        <div className="wl-writer-body">
          <input
            id="title"
            type="text"
            value={title}
            onChange={this.handleChange}
            className="wl-writer-title-input"
            placeholder="Chapter title…"
            autoFocus
          />
          <textarea
            id="content"
            value={content}
            onChange={this.handleChange}
            className="wl-writer-textarea"
            placeholder="Begin writing your chapter here…"
          />
        </div>
      </div>
    );
  }
}

export default WriteChapter;
