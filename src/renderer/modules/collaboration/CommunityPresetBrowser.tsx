import React, { useState, useEffect, useMemo } from 'react';
import { CloudPreset } from '@renderer/services/CloudSyncService';
import './CommunityPresetBrowser.css';

/**
 * Community Preset Browser
 * Browse, search, and download community-shared presets
 * with ratings, comments, and social features
 */

interface PresetComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  rating?: number;
  timestamp: Date;
  likes: number;
}

interface CommunityPresetBrowserProps {
  onLoadPreset: (preset: CloudPreset) => void;
  onDownloadPreset?: (presetId: string) => Promise<void>;
}

export const CommunityPresetBrowser: React.FC<CommunityPresetBrowserProps> = ({
  onLoadPreset,
  onDownloadPreset,
}) => {
  const [presets, setPresets] = useState<CloudPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating' | 'downloads'>('popular');
  const [selectedPreset, setSelectedPreset] = useState<CloudPreset | null>(null);
  const [comments, setComments] = useState<PresetComment[]>([]);
  const [showComments, setShowComments] = useState(false);

  const categories = ['All', 'Synthesis', 'Effects', 'Filters', 'Dynamics', 'Utilities'];

  // Load community presets
  useEffect(() => {
    loadCommunityPresets();
  }, []);

  // Load comments when preset is selected
  useEffect(() => {
    if (selectedPreset && showComments) {
      loadComments(selectedPreset.id);
    }
  }, [selectedPreset, showComments]);

  const loadCommunityPresets = async () => {
    setLoading(true);

    try {
      const response = await fetch('https://api.sounddesigner.com/presets/community', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPresets(data);
      }
    } catch (error) {
      console.error('Failed to load community presets:', error);
    } finally {
      setLoading(false);
    }
  }

;

  const loadComments = async (presetId: string) => {
    try {
      const response = await fetch(
        `https://api.sounddesigner.com/presets/${presetId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const filteredAndSortedPresets = useMemo(() => {
    let filtered = presets;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          p.author.name.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        default:
          return 0;
      }
    });

    return filtered;
  }, [presets, searchQuery, selectedCategory, sortBy]);

  const handleDownload = async (preset: CloudPreset) => {
    if (onDownloadPreset) {
      await onDownloadPreset(preset.id);
    }

    // Increment download count
    setPresets((prev) =>
      prev.map((p) => (p.id === preset.id ? { ...p, downloads: p.downloads + 1 } : p))
    );
  };

  const handleRatePreset = async (presetId: string, rating: number) => {
    try {
      const response = await fetch(
        `https://api.sounddesigner.com/presets/${presetId}/rate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ rating }),
        }
      );

      if (response.ok) {
        // Update preset rating
        setPresets((prev) =>
          prev.map((p) =>
            p.id === presetId
              ? {
                  ...p,
                  rating: (p.rating * p.ratingCount + rating) / (p.ratingCount + 1),
                  ratingCount: p.ratingCount + 1,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Failed to rate preset:', error);
    }
  };

  const handleAddComment = async (presetId: string, comment: string) => {
    try {
      const response = await fetch(
        `https://api.sounddesigner.com/presets/${presetId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ comment }),
        }
      );

      if (response.ok) {
        const newComment = await response.json();
        setComments((prev) => [newComment, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleToggleFavorite = async (presetId: string) => {
    try {
      const preset = presets.find((p) => p.id === presetId);
      const isFavorite = !preset?.isFavorite;

      const response = await fetch(
        `https://api.sounddesigner.com/presets/${presetId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ isFavorite }),
        }
      );

      if (response.ok) {
        setPresets((prev) =>
          prev.map((p) => (p.id === presetId ? { ...p, isFavorite } : p))
        );
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="community-preset-browser">
      <div className="browser-header">
        <h2>Community Presets</h2>
        <button onClick={loadCommunityPresets} className="btn-refresh">
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="browser-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search presets, tags, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="popular">Most Popular</option>
            <option value="recent">Most Recent</option>
            <option value="rating">Highest Rated</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="browser-content">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <p>Loading community presets...</p>
          </div>
        ) : (
          <div className="presets-grid">
            {filteredAndSortedPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onLoad={() => onLoadPreset(preset)}
                onDownload={() => handleDownload(preset)}
                onRate={(rating) => handleRatePreset(preset.id, rating)}
                onToggleFavorite={() => handleToggleFavorite(preset.id)}
                onShowDetails={() => {
                  setSelectedPreset(preset);
                  setShowComments(true);
                }}
              />
            ))}
          </div>
        )}

        {!loading && filteredAndSortedPresets.length === 0 && (
          <div className="no-results">
            <p>No presets found</p>
            <p className="hint">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Preset Details Modal */}
      {selectedPreset && showComments && (
        <PresetDetailsModal
          preset={selectedPreset}
          comments={comments}
          onClose={() => {
            setShowComments(false);
            setSelectedPreset(null);
          }}
          onAddComment={(comment) => handleAddComment(selectedPreset.id, comment)}
          onLoad={() => onLoadPreset(selectedPreset)}
          onDownload={() => handleDownload(selectedPreset)}
        />
      )}
    </div>
  );
};

interface PresetCardProps {
  preset: CloudPreset;
  onLoad: () => void;
  onDownload: () => void;
  onRate: (rating: number) => void;
  onToggleFavorite: () => void;
  onShowDetails: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onLoad,
  onDownload,
  onRate,
  onToggleFavorite,
  onShowDetails,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="preset-card">
      <div className="preset-card-header">
        <div className="preset-author">
          {preset.author.avatar && (
            <img src={preset.author.avatar} alt={preset.author.name} className="author-avatar" />
          )}
          <span className="author-name">{preset.author.name}</span>
        </div>
        <button
          className={`btn-favorite ${preset.isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
        >
          {preset.isFavorite ? '★' : '☆'}
        </button>
      </div>

      <div className="preset-card-body" onClick={onShowDetails}>
        <h3>{preset.name}</h3>
        <p className="preset-description">{preset.description}</p>

        <div className="preset-meta">
          <span className="category">{preset.category}</span>
          <span className="downloads">↓ {preset.downloads}</span>
        </div>

        <div className="preset-tags">
          {preset.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          {preset.tags.length > 3 && <span className="tag">+{preset.tags.length - 3}</span>}
        </div>

        <div className="preset-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= (hoverRating || preset.rating) ? 'filled' : ''}`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={(e) => {
                e.stopPropagation();
                onRate(star);
              }}
            >
              ★
            </span>
          ))}
          <span className="rating-count">({preset.ratingCount})</span>
        </div>
      </div>

      <div className="preset-card-actions">
        <button onClick={onLoad} className="btn-load">
          Load
        </button>
        <button onClick={onDownload} className="btn-download">
          Download
        </button>
      </div>
    </div>
  );
};

interface PresetDetailsModalProps {
  preset: CloudPreset;
  comments: PresetComment[];
  onClose: () => void;
  onAddComment: (comment: string) => void;
  onLoad: () => void;
  onDownload: () => void;
}

const PresetDetailsModal: React.FC<PresetDetailsModalProps> = ({
  preset,
  comments,
  onClose,
  onAddComment,
  onLoad,
  onDownload,
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preset-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{preset.name}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="preset-info">
            <div className="info-row">
              <span className="label">Author:</span>
              <span>{preset.author.name}</span>
            </div>
            <div className="info-row">
              <span className="label">Category:</span>
              <span>{preset.category}</span>
            </div>
            <div className="info-row">
              <span className="label">Downloads:</span>
              <span>{preset.downloads}</span>
            </div>
            <div className="info-row">
              <span className="label">Rating:</span>
              <span>
                {'★'.repeat(Math.round(preset.rating))}
                {'☆'.repeat(5 - Math.round(preset.rating))} ({preset.ratingCount})
              </span>
            </div>
            <div className="info-row">
              <span className="label">Created:</span>
              <span>{new Date(preset.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="preset-description-full">
            <h3>Description</h3>
            <p>{preset.description}</p>
          </div>

          <div className="preset-tags-full">
            <h3>Tags</h3>
            <div className="tags">
              {preset.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="preset-comments">
            <h3>Comments ({comments.length})</h3>

            <div className="comment-input">
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                Post Comment
              </button>
            </div>

            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    {comment.userAvatar && (
                      <img src={comment.userAvatar} alt={comment.userName} />
                    )}
                    <div>
                      <span className="comment-author">{comment.userName}</span>
                      <span className="comment-time">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="comment-text">{comment.comment}</p>
                  {comment.rating && (
                    <div className="comment-rating">
                      {'★'.repeat(comment.rating)}
                      {'☆'.repeat(5 - comment.rating)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onDownload} className="btn-download">
            Download
          </button>
          <button onClick={onLoad} className="btn-load">
            Load Preset
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityPresetBrowser;
