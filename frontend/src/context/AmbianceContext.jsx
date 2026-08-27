import React, { createContext, useContext, useState, useEffect } from 'react';

const AmbianceContext = createContext(null);

export const AMBIANCE_PRESETS = {
  gold: {
    id: 'gold',
    name: 'Cinema Gold',
    icon: '🍿',
    tag: 'Warm Vintage Lounge',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    secondaryGlow: 'rgba(239, 68, 68, 0.18)',
    accentGradient: 'from-amber-500 via-orange-500 to-rose-600',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    themeClass: 'theme-gold'
  },
  cyber: {
    id: 'cyber',
    name: 'Midnight Cyber',
    icon: '🌌',
    tag: 'Neon Sci-Fi Stage',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    secondaryGlow: 'rgba(168, 85, 247, 0.2)',
    accentGradient: 'from-indigo-600 via-purple-600 to-pink-600',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    themeClass: 'theme-cyber'
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Velvet',
    icon: '🎭',
    tag: 'Red Carpet Premiere',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    secondaryGlow: 'rgba(236, 72, 153, 0.2)',
    accentGradient: 'from-rose-600 via-red-600 to-amber-600',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    themeClass: 'theme-crimson'
  },
  dim: {
    id: 'dim',
    name: 'Dimmed Lights',
    icon: '🕯️',
    tag: 'Stealth Cinephile',
    glowColor: 'rgba(148, 163, 184, 0.12)',
    secondaryGlow: 'rgba(99, 102, 241, 0.08)',
    accentGradient: 'from-slate-700 via-slate-800 to-slate-900',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    badgeBg: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    themeClass: 'theme-dim'
  }
};

export function AmbianceProvider({ children }) {
  const [ambiance, setAmbiance] = useState(() => {
    const saved = localStorage.getItem('pt_ambiance');
    return saved && AMBIANCE_PRESETS[saved] ? saved : 'gold';
  });

  const [lightsDimmed, setLightsDimmed] = useState(false);

  const currentPreset = AMBIANCE_PRESETS[ambiance] || AMBIANCE_PRESETS.gold;

  const cycleAmbiance = () => {
    const keys = Object.keys(AMBIANCE_PRESETS);
    const nextIdx = (keys.indexOf(ambiance) + 1) % keys.length;
    const nextKey = keys[nextIdx];
    setAmbiance(nextKey);
    localStorage.setItem('pt_ambiance', nextKey);
  };

  const selectAmbiance = (key) => {
    if (AMBIANCE_PRESETS[key]) {
      setAmbiance(key);
      localStorage.setItem('pt_ambiance', key);
    }
  };

  const toggleLights = () => {
    setLightsDimmed(prev => !prev);
  };

  useEffect(() => {
    // Apply dynamic ambient lighting css variables
    document.documentElement.style.setProperty('--ambiance-glow', currentPreset.glowColor);
    document.documentElement.style.setProperty('--ambiance-secondary', currentPreset.secondaryGlow);
    document.documentElement.style.setProperty('--ambiance-border', currentPreset.borderColor);
  }, [ambiance]);

  return (
    <AmbianceContext.Provider
      value={{
        ambiance,
        currentPreset,
        cycleAmbiance,
        selectAmbiance,
        lightsDimmed,
        toggleLights
      }}
    >
      {children}
    </AmbianceContext.Provider>
  );
}

export function useAmbiance() {
  return useContext(AmbianceContext);
}
