import React, { useState, useEffect } from 'react';
import { Plus, Globe, Lock, Film, Sparkles, X, Upload, Link } from 'lucide-react';
import { createPartyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';

export function CreatePartyModal({ isOpen, onClose }) {
  const { token, user, loginAsGuest } = useAuth();
  const { joinParty, setLocalFileBlobUrl } = useParty();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState('url');
  const [videoUrl, setVideoUrl] = useState('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [videoTitle, setVideoTitle] = useState('Big Buck Bunny 4K (HLS)');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) setTimeout(() => setMounted(true), 10);
    else setMounted(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setVideoTitle(file.name);
      const blobUrl = URL.createObjectURL(file);
      setVideoUrl(blobUrl);
      setLocalFileBlobUrl(blobUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      let activeToken = token;
      if (!user) {
        await loginAsGuest(`Host_${Math.floor(Math.random() * 100)}`);
        activeToken = localStorage.getItem('pt_token');
      }
      const finalSourceType = sourceType === 'local' ? 'local_file' : (videoUrl.includes('.m3u8') ? 'hls' : 'mp4');
      const created = await createPartyApi(
        { title: title.trim(), description: description.trim(), video_url: videoUrl, video_title: videoTitle, is_public: isPublic, max_participants: 100 },
        activeToken
      );
      const newParty = created || { id: 'room_' + Math.random().toString(36).substring(2, 9), title: title.trim(), description: description.trim(), invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(), video_url: videoUrl, video_title: videoTitle };
      newParty.video_source_type = finalSourceType;
      joinParty(newParty);
      onClose();
    } catch (err) {
      console.error('Create party error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-overlay p-4">
      <div
        className={`glass-premium rounded-3xl max-w-lg w-full border border-slate-700/50 shadow-cinema relative overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Ambient */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-7">
          <button onClick={onClose} className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-surface-light text-slate-500 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Host a Party Room</h3>
              <p className="text-xs text-slate-500">Invite friends & stream in perfect sync</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Party Title</label>
              <input
                type="text" required
                placeholder="e.g. 🍿 Saturday Night Movie Stream"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description <span className="text-slate-600">(Optional)</span></label>
              <textarea
                rows={2}
                placeholder="Tell viewers what you're watching…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
              />
            </div>

            {/* Source type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stream Source</label>
              <div className="flex gap-2 p-1 bg-surface rounded-xl border border-slate-800">
                {[
                  { v: 'url', label: '🌐 URL Stream', icon: Link },
                  { v: 'local', label: '📁 Local File', icon: Upload },
                ].map(({ v, label }) => (
                  <button
                    key={v} type="button"
                    onClick={() => setSourceType(v)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${sourceType === v ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Movie / Stream Title</label>
              <input
                type="text" required
                placeholder="e.g. Big Buck Bunny 4K"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="input-field"
              />
            </div>

            {/* URL or file */}
            {sourceType === 'url' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stream URL (HLS / MP4)</label>
                <input
                  type="url" required
                  placeholder="https://example.com/stream.m3u8"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-surface/40 transition-all cursor-pointer group">
                <input
                  type="file" accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/20 transition-colors">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? `📁 ${selectedFile.name}` : 'Click or drag a video file'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFile ? `${(selectedFile.size / (1024*1024)).toFixed(1)} MB` : 'MP4, MKV, WebM, MOV supported'}
                </p>
              </div>
            )}

            {/* Public toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPublic ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                  {isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{isPublic ? 'Public Room' : 'Private Room'}</p>
                  <p className="text-xs text-slate-500">{isPublic ? 'Visible in lobby' : 'Invite code only'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-slate-700'}`}
                aria-label="Toggle public/private"
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost text-sm px-5 py-2.5">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary text-sm px-6 py-2.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating…
                  </span>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Start Party Room</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
