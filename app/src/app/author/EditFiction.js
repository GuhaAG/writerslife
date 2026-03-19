import React, { Component } from 'react';
import GeneralNavbar from '../nav/GeneralNavbar';
import api from '../api';

const GENRES = ['Fantasy', 'Sci-Fi', 'Horror', 'Mystery', 'Romance', 'Thriller', 'Adventure', 'Historical'];

class EditFiction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      synopsis: '',
      coverUrl: '',
      genres: [],
      tags: '',
      status: 'ongoing',
      loading: true,
      error: '',
      submitting: false,
    };
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    api.get(`/api/fictions/${id}`)
      .then(res => {
        const f = res.data;
        this.setState({
          title: f.title,
          synopsis: f.synopsis,
          coverUrl: f.coverUrl || '',
          genres: f.genres || [],
          tags: (f.tags || []).join(', '),
          status: f.status,
          loading: false,
        });
      })
      .catch(() => this.setState({ error: 'Failed to load fiction.', loading: false }));
  }

  handleChange = (e) => {
    this.setState({ [e.target.id]: e.target.value });
  }

  toggleGenre = (g) => {
    this.setState(prev => ({
      genres: prev.genres.includes(g)
        ? prev.genres.filter(x => x !== g)
        : [...prev.genres, g],
    }));
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { id } = this.props.match.params;
    const { title, synopsis, coverUrl, genres, tags, status } = this.state;
    this.setState({ submitting: true, error: '' });

    api.put(`/api/fictions/${id}`, {
      title,
      synopsis,
      coverUrl,
      genres,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      status,
    })
      .then(() => this.props.history.push(`/fiction/${id}`))
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to update fiction.';
        this.setState({ error: msg, submitting: false });
      });
  }

  render() {
    const { title, synopsis, coverUrl, genres, tags, status, loading, error, submitting } = this.state;

    if (loading) return <div><GeneralNavbar /><div className="wl-loading">Loading…</div></div>;

    return (
      <div>
        <GeneralNavbar />
        <div className="wl-page-narrow">
          <p className="wl-label" style={{ marginBottom: '0.5rem' }}>Edit Story</p>
          <h1 className="wl-display" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
            {title || 'Untitled'}
          </h1>

          <form onSubmit={this.handleSubmit}>
            <div className="wl-field">
              <label className="wl-field-label">Title *</label>
              <input
                required
                id="title"
                type="text"
                value={title}
                onChange={this.handleChange}
                className="wl-input"
              />
            </div>

            <div className="wl-field">
              <label className="wl-field-label">Synopsis</label>
              <textarea
                id="synopsis"
                value={synopsis}
                onChange={this.handleChange}
                className="wl-input wl-textarea"
                rows={5}
              />
            </div>

            <div className="wl-field">
              <label className="wl-field-label">Cover Image URL</label>
              <input
                id="coverUrl"
                type="text"
                value={coverUrl}
                onChange={this.handleChange}
                className="wl-input"
              />
            </div>

            <div className="wl-field">
              <label className="wl-field-label" style={{ marginBottom: '0.6rem' }}>Genres</label>
              <div className="wl-tags">
                {GENRES.map(g => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => this.toggleGenre(g)}
                    className={`wl-tag wl-tag-genre clickable${genres.includes(g) ? ' active' : ''}`}
                    style={{ border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="wl-field">
              <label className="wl-field-label">Tags (comma-separated)</label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={this.handleChange}
                className="wl-input"
              />
            </div>

            <div className="wl-field">
              <label className="wl-field-label">Status</label>
              <select
                id="status"
                value={status}
                onChange={this.handleChange}
                className="wl-input wl-select"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </div>

            {error && <div className="wl-error">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="wl-btn wl-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    );
  }
}

export default EditFiction;
