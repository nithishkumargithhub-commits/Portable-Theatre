import React, { useState, useEffect } from 'react';
import { Plus, Globe, Lock, Film, Sparkles, X, Upload, Link, Check, Clapperboard } from 'lucide-react';
import { createPartyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useParty } from '../context/PartyContext';

const STREAM_PRESETS = [
  {
    title: '🍿 Saturday Movie Night',
    videoTitle: 'Big Buck Bunny 4K (HLS)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    tag: '4K HLS',
  },
  {
    title: '🐉 Sintel: Dragon Premiere',
    videoTitle: 'Sintel 4K (Akamai HLS)',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    tag: '4K DOLBY',
  },
  {
    title: '🤖 Tears of Steel Sci-Fi Watch',
    videoTitle: 'Tears of Steel (VFX HLS)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    tag: 'VFX ACTION',
  },
];

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

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setVideoTitle(preset.videoTitle);
    setVideoUrl(preset.url);
    setSourceType('url');
  };

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
        className={`glass-premium rounded-3xl max-w-lg w-full border border-indigo-500/20 shadow-cinema relative overflow-hidden max-h-[90vh] overflow-y-auto transition-all duration-300 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-7">
          <button 
            onClick={onClose} 
            className="absolute top-5 right-5 p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-white/20">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black font-display text-white">Host a Virtual Cinema</h3>
              <p className="text-xs text-slate-400">Stream in frame-perfect synchronization with friends</p>
            </div>
          </div>

          {/* Quick Cinema Presets */}
          <div className="mb-5 space-y-2">
            <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Instant Movie Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STREAM_PRESETS.map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    videoUrl === p.url
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                      : 'bg-cinema-850 hover:bg-cinema-800 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-wider block text-indigo-400 mb-0.5">{p.tag}</span>
                  <p className="text-[11px] font-bold truncate leading-tight">{p.videoTitle.split(' ')[0]}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Party Title</label>
              <input
                type="text" required
                placeholder="e.g. 🍿 Saturday Night Sci-Fi Stream"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Description <span className="text-slate-500 font-normal">(Optional)</span></label>
              <textarea
                rows={2}
                placeholder="Tell cinephiles what you're watching…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-none"
              />
            </div>

            {/* Source type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Media Source</label>
              <div className="flex gap-2 p-1 bg-cinema-850 rounded-xl border border-slate-800">
                {[
                  { v: 'url', label: '🌐 Online Stream (HLS / MP4)', icon: Link },
                  { v: 'local', label: '📁 Local Video File', icon: Upload },
                ].map(({ v, label }) => (
                  <button
                    key={v} type="button"
                    onClick={() => setSourceType(v)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      sourceType === v 
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Stream / Movie Name</label>
              <input
                type="text" required
                placeholder="e.g. Cyberpunk 2099 (4K HLS)"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="input-field"
              />
            </div>

            {/* URL or file */}
            {sourceType === 'url' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Stream URL (.m3u8 or .mp4)</label>
                <input
                  type="url" required
                  placeholder="https://example.com/stream.m3u8"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-cinema-850/60 transition-all cursor-pointer group">
                <input
                  type="file" accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-500/25 transition-colors">
                  <Upload className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-sm font-bold text-slate-200">
                  {selectedFile ? `📁 ${selectedFile.name}` : 'Click or drag a video file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / (1024*1024)).toFixed(1)} MB` : 'MP4, MKV, WebM, MOV supported'}
                </p>
              </div>
            )}

            {/* Public toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-cinema-850 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPublic ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                  {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{isPublic ? 'Public Premiere Hall' : 'Private Invite Lounge'}</p>
                  <p className="text-xs text-slate-400">{isPublic ? 'Visible to all in cinema lobby' : 'Accessible via invite code only'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isPublic ? 'bg-indigo-600' : 'bg-slate-700'}`}
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
                  <><Sparkles className="w-4 h-4" /> Launch Cinema Room</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
