import React, { useState, useRef, useEffect } from 'react';
import './ThemeMenu.css';

const themes = {
  // ===== LIGHT THEMES =====
  
  // Essential & Corporate
  professional: {
    name: 'Professional',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#6366f1',
    accent: '#10b981',
    background: '#f8fafc',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderColor: '#e2e8f0',
    deletable: false
  },

  corporateBlue: {
    name: 'Corporate Blue',
    primary: '#1E40AF',
    primaryHover: '#1E3A8A',
    primaryLight: '#3B82F6',
    accent: '#059669',
    background: '#f8fafc',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(30, 64, 175, 0.1), 0 1px 2px 0 rgba(30, 64, 175, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(30, 64, 175, 0.1), 0 2px 4px -1px rgba(30, 64, 175, 0.06)',
    borderColor: '#e2e8f0',
    deletable: true
  },

  businessGreen: {
    name: 'Business Green',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#6366F1',
    background: '#f9fafb',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px 0 rgba(5, 150, 105, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
    borderColor: '#e5e7eb',
    deletable: true
  },

  // Spring Collection
  springBloom: {
    name: 'Spring Bloom',
    primary: '#FF6B9D',
    primaryHover: '#E055A0',
    primaryLight: '#FF8BB5',
    accent: '#FFC107',
    background: '#FDF2F8',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(255, 107, 157, 0.1), 0 1px 2px 0 rgba(255, 107, 157, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(255, 107, 157, 0.1), 0 2px 4px -1px rgba(255, 107, 157, 0.06)',
    borderColor: '#FECACA',
    deletable: true
  },

  cherryBlossom: {
    name: 'Cherry Blossom',
    primary: '#EC4899',
    primaryHover: '#DB2777',
    primaryLight: '#F472B6',
    accent: '#10B981',
    background: '#FDF2F8',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(236, 72, 153, 0.1), 0 1px 2px 0 rgba(236, 72, 153, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(236, 72, 153, 0.1), 0 2px 4px -1px rgba(236, 72, 153, 0.06)',
    borderColor: '#FBCFE8',
    deletable: true
  },

  freshMint: {
    name: 'Fresh Mint',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#34D399',
    accent: '#06B6D4',
    background: '#ECFDF5',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(16, 185, 129, 0.1), 0 1px 2px 0 rgba(16, 185, 129, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)',
    borderColor: '#A7F3D0',
    deletable: true
  },

  // Complementary Combinations
  redAqua: {
    name: 'Red & Aqua',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#EF4444',
    accent: '#00FFF0',
    background: '#fef2f2',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(220, 38, 38, 0.1), 0 1px 2px 0 rgba(220, 38, 38, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(220, 38, 38, 0.1), 0 2px 4px -1px rgba(220, 38, 38, 0.06)',
    borderColor: '#fecaca',
    deletable: true
  },

  blueOrange: {
    name: 'Blue & Orange',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#3B82F6',
    accent: '#EA580C',
    background: '#eff6ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(37, 99, 235, 0.1), 0 1px 2px 0 rgba(37, 99, 235, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
    borderColor: '#dbeafe',
    deletable: true
  },

  purpleYellow: {
    name: 'Purple & Yellow',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#8B5CF6',
    accent: '#FBBF24',
    background: '#faf5ff',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(124, 58, 237, 0.1), 0 1px 2px 0 rgba(124, 58, 237, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(124, 58, 237, 0.1), 0 2px 4px -1px rgba(124, 58, 237, 0.06)',
    borderColor: '#e9d5ff',
    deletable: true
  },

  greenPink: {
    name: 'Green & Pink',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#EC4899',
    background: '#ECFDF5',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px 0 rgba(5, 150, 105, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
    borderColor: '#A7F3D0',
    deletable: true
  },

  // Ocean Collection
  oceanBlue: {
    name: 'Ocean Blue',
    primary: '#0EA5E9',
    primaryHover: '#0284C7',
    primaryLight: '#38BDF8',
    accent: '#075985',
    background: '#F0F9FF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(14, 165, 233, 0.1), 0 1px 2px 0 rgba(14, 165, 233, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
    borderColor: '#BAE6FD',
    deletable: true
  },

  deepSea: {
    name: 'Deep Sea',
    primary: '#0F766E',
    primaryHover: '#0D9488',
    primaryLight: '#14B8A6',
    accent: '#0891B2',
    background: '#F0FDFA',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(15, 118, 110, 0.1), 0 1px 2px 0 rgba(15, 118, 110, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(15, 118, 110, 0.1), 0 2px 4px -1px rgba(15, 118, 110, 0.06)',
    borderColor: '#CCFBF1',
    deletable: true
  },

  // Sunset Collection
  sunsetOrange: {
    name: 'Sunset Orange',
    primary: '#EA580C',
    primaryHover: '#DC2626',
    primaryLight: '#F97316',
    accent: '#FBBF24',
    background: '#FFF7ED',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(234, 88, 12, 0.1), 0 1px 2px 0 rgba(234, 88, 12, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(234, 88, 12, 0.1), 0 2px 4px -1px rgba(234, 88, 12, 0.06)',
    borderColor: '#FED7AA',
    deletable: true
  },

  goldenHour: {
    name: 'Golden Hour',
    primary: '#F59E0B',
    primaryHover: '#D97706',
    primaryLight: '#FBBF24',
    accent: '#DC2626',
    background: '#FFFBEB',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(245, 158, 11, 0.1), 0 1px 2px 0 rgba(245, 158, 11, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
    borderColor: '#FEF3C7',
    deletable: true
  },

  // Earth Tones
  earthyBrown: {
    name: 'Earthy Brown',
    primary: '#92400E',
    primaryHover: '#78350F',
    primaryLight: '#B45309',
    accent: '#065F46',
    background: '#FEF7ED',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(146, 64, 14, 0.1), 0 1px 2px 0 rgba(146, 64, 14, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(146, 64, 14, 0.1), 0 2px 4px -1px rgba(146, 64, 14, 0.06)',
    borderColor: '#FED7AA',
    deletable: true
  },

  forestGreen: {
    name: 'Forest Green',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#10B981',
    accent: '#065F46',
    background: '#ECFDF5',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(5, 150, 105, 0.1), 0 1px 2px 0 rgba(5, 150, 105, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(5, 150, 105, 0.1), 0 2px 4px -1px rgba(5, 150, 105, 0.06)',
    borderColor: '#A7F3D0',
    deletable: true
  },

  // Pastel Collection
  pastelPink: {
    name: 'Pastel Pink',
    primary: '#F472B6',
    primaryHover: '#EC4899',
    primaryLight: '#F9A8D4',
    accent: '#A78BFA',
    background: '#FDF2F8',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(244, 114, 182, 0.1), 0 1px 2px 0 rgba(244, 114, 182, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(244, 114, 182, 0.1), 0 2px 4px -1px rgba(244, 114, 182, 0.06)',
    borderColor: '#FBCFE8',
    deletable: true
  },

  pastelBlue: {
    name: 'Pastel Blue',
    primary: '#60A5FA',
    primaryHover: '#3B82F6',
    primaryLight: '#93C5FD',
    accent: '#F472B6',
    background: '#EFF6FF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(96, 165, 250, 0.1), 0 1px 2px 0 rgba(96, 165, 250, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(96, 165, 250, 0.1), 0 2px 4px -1px rgba(96, 165, 250, 0.06)',
    borderColor: '#DBEAFE',
    deletable: true
  },

  // Retro Collection
  retroPurple: {
    name: 'Retro Purple',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#A78BFA',
    accent: '#F59E0B',
    background: '#FAF5FF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(139, 92, 246, 0.1), 0 1px 2px 0 rgba(139, 92, 246, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(139, 92, 246, 0.1), 0 2px 4px -1px rgba(139, 92, 246, 0.06)',
    borderColor: '#E9D5FF',
    deletable: true
  },

  vintageTeal: {
    name: 'Vintage Teal',
    primary: '#14B8A6',
    primaryHover: '#0D9488',
    primaryLight: '#2DD4BF',
    accent: '#F59E0B',
    background: '#F0FDFA',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(20, 184, 166, 0.1), 0 1px 2px 0 rgba(20, 184, 166, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(20, 184, 166, 0.1), 0 2px 4px -1px rgba(20, 184, 166, 0.06)',
    borderColor: '#CCFBF1',
    deletable: true
  },

  // Vibrant Collection
  electricBlue: {
    name: 'Electric Blue',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#3B82F6',
    accent: '#EF4444',
    background: '#EFF6FF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(37, 99, 235, 0.1), 0 1px 2px 0 rgba(37, 99, 235, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
    borderColor: '#DBEAFE',
    deletable: true
  },

  neonGreen: {
    name: 'Neon Green',
    primary: '#22C55E',
    primaryHover: '#16A34A',
    primaryLight: '#4ADE80',
    accent: '#EC4899',
    background: '#F0FDF4',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(34, 197, 94, 0.1), 0 1px 2px 0 rgba(34, 197, 94, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(34, 197, 94, 0.1), 0 2px 4px -1px rgba(34, 197, 94, 0.06)',
    borderColor: '#BBF7D0',
    deletable: true
  },

  // Berry Collection
  raspberry: {
    name: 'Raspberry',
    primary: '#BE185D',
    primaryHover: '#9D174D',
    primaryLight: '#DB2777',
    accent: '#059669',
    background: '#FDF2F8',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(190, 24, 93, 0.1), 0 1px 2px 0 rgba(190, 24, 93, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(190, 24, 93, 0.1), 0 2px 4px -1px rgba(190, 24, 93, 0.06)',
    borderColor: '#FBCFE8',
    deletable: true
  },

  blueberry: {
    name: 'Blueberry',
    primary: '#3730A3',
    primaryHover: '#312E81',
    primaryLight: '#4F46E5',
    accent: '#F59E0B',
    background: '#EEF2FF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(55, 48, 163, 0.1), 0 1px 2px 0 rgba(55, 48, 163, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(55, 48, 163, 0.1), 0 2px 4px -1px rgba(55, 48, 163, 0.06)',
    borderColor: '#C7D2FE',
    deletable: true
  },

  // Tropical Collection
  tropicalTeal: {
    name: 'Tropical Teal',
    primary: '#0891B2',
    primaryHover: '#0E7490',
    primaryLight: '#06B6D4',
    accent: '#F97316',
    background: '#ECFEFF',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(8, 145, 178, 0.1), 0 1px 2px 0 rgba(8, 145, 178, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(8, 145, 178, 0.1), 0 2px 4px -1px rgba(8, 145, 178, 0.06)',
    borderColor: '#CFFAFE',
    deletable: true
  },

  coral: {
    name: 'Coral',
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#F87171',
    accent: '#06B6D4',
    background: '#FEF2F2',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(239, 68, 68, 0.1), 0 1px 2px 0 rgba(239, 68, 68, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(239, 68, 68, 0.1), 0 2px 4px -1px rgba(239, 68, 68, 0.06)',
    borderColor: '#FECACA',
    deletable: true
  },

  // Neutral Collection
  softGray: {
    name: 'Soft Gray',
    primary: '#6B7280',
    primaryHover: '#4B5563',
    primaryLight: '#9CA3AF',
    accent: '#059669',
    background: '#F9FAFB',
    cardBg: '#ffffff',
    shadow: '0 1px 3px 0 rgba(107, 114, 128, 0.1), 0 1px 2px 0 rgba(107, 114, 128, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(107, 114, 128, 0.1), 0 2px 4px -1px rgba(107, 114, 128, 0.06)',
    borderColor: '#E5E7EB',
    deletable: true
  },

  grayscaleLight: {
    name: 'Grayscale Light',
    primary: '#2B2B2B',
    primaryHover: '#1F1F1F',
    primaryLight: '#404040',
    accent: '#B3B3B3',
    background: '#FFFFFF',
    cardBg: '#FFFFFF',
    shadow: '0 1px 3px 0 rgba(43, 43, 43, 0.1), 0 1px 2px 0 rgba(43, 43, 43, 0.06)',
    shadowHover: '0 4px 6px -1px rgba(43, 43, 43, 0.1), 0 2px 4px -1px rgba(43, 43, 43, 0.06)',
    borderColor: '#D4D4D4',
    deletable: true
  },

  // ===== DARK THEMES =====

  // Dark Professional
  professionalDark: {
    name: 'Professional Dark',
    primary: '#6366F1',
    primaryHover: '#4F46E5',
    primaryLight: '#8B5CF6',
    accent: '#10B981',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    cardBg: 'rgba(30, 41, 59, 0.9)',
    shadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 20px 40px rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    isDark: true,
    deletable: true
  },

  corporateBlueDark: {
    name: 'Corporate Blue Dark',
    primary: '#60A5FA',
    primaryHover: '#3B82F6',
    primaryLight: '#93C5FD',
    accent: '#34D399',
    background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
    cardBg: 'rgba(30, 58, 138, 0.85)',
    shadow: '0 10px 25px rgba(96, 165, 250, 0.2)',
    shadowHover: '0 20px 40px rgba(96, 165, 250, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
    isDark: true,
    deletable: true
  },

  businessGreenDark: {
    name: 'Business Green Dark',
    primary: '#34D399',
    primaryHover: '#10B981',
    primaryLight: '#6EE7B7',
    accent: '#8B5CF6',
    background: 'linear-gradient(135deg, #064E3B 0%, #134E4A 100%)',
    cardBg: 'rgba(6, 78, 59, 0.85)',
    shadow: '0 10px 25px rgba(52, 211, 153, 0.2)',
    shadowHover: '0 20px 40px rgba(52, 211, 153, 0.3)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
    isDark: true,
    deletable: true
  },

  // Dark Spring Collection
  springBloomDark: {
    name: 'Spring Bloom Dark',
    primary: '#F472B6',
    primaryHover: '#EC4899',
    primaryLight: '#F9A8D4',
    accent: '#FBBF24',
    background: 'linear-gradient(135deg, #1F1B2D 0%, #2D1B4A 100%)',
    cardBg: 'rgba(45, 27, 74, 0.9)',
    shadow: '0 10px 25px rgba(244, 114, 182, 0.2)',
    shadowHover: '0 20px 40px rgba(244, 114, 182, 0.3)',
    borderColor: 'rgba(244, 114, 182, 0.2)',
    isDark: true,
    deletable: true
  },

  cherryBlossomDark: {
    name: 'Cherry Blossom Dark',
    primary: '#F472B6',
    primaryHover: '#EC4899',
    primaryLight: '#F9A8D4',
    accent: '#34D399',
    background: 'linear-gradient(135deg, #4A044E 0%, #701A75 100%)',
    cardBg: 'rgba(74, 4, 78, 0.85)',
    shadow: '0 10px 25px rgba(244, 114, 182, 0.2)',
    shadowHover: '0 20px 40px rgba(244, 114, 182, 0.3)',
    borderColor: 'rgba(244, 114, 182, 0.2)',
    isDark: true,
    deletable: true
  },

  freshMintDark: {
    name: 'Fresh Mint Dark',
    primary: '#34D399',
    primaryHover: '#10B981',
    primaryLight: '#6EE7B7',
    accent: '#22D3EE',
    background: 'linear-gradient(135deg, #064E3B 0%, #134E4A 100%)',
    cardBg: 'rgba(6, 78, 59, 0.85)',
    shadow: '0 10px 25px rgba(52, 211, 153, 0.2)',
    shadowHover: '0 20px 40px rgba(52, 211, 153, 0.3)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
    isDark: true,
    deletable: true
  },

  // Dark Complementary
  redAquaDark: {
    name: 'Red & Aqua Dark',
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#F87171',
    accent: '#22D3EE',
    background: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 100%)',
    cardBg: 'rgba(69, 10, 10, 0.85)',
    shadow: '0 10px 25px rgba(239, 68, 68, 0.2)',
    shadowHover: '0 20px 40px rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    isDark: true,
    deletable: true
  },

  blueOrangeDark: {
    name: 'Blue & Orange Dark',
    primary: '#60A5FA',
    primaryHover: '#3B82F6',
    primaryLight: '#93C5FD',
    accent: '#FB923C',
    background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)',
    cardBg: 'rgba(30, 58, 138, 0.85)',
    shadow: '0 10px 25px rgba(96, 165, 250, 0.2)',
    shadowHover: '0 20px 40px rgba(96, 165, 250, 0.3)',
    borderColor: 'rgba(96, 165, 250, 0.2)',
    isDark: true,
    deletable: true
  },

  purpleYellowDark: {
    name: 'Purple & Yellow Dark',
    primary: '#A78BFA',
    primaryHover: '#8B5CF6',
    primaryLight: '#C4B5FD',
    accent: '#FCD34D',
    background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    cardBg: 'rgba(30, 27, 75, 0.85)',
    shadow: '0 10px 25px rgba(167, 139, 250, 0.2)',
    shadowHover: '0 20px 40px rgba(167, 139, 250, 0.3)',
    borderColor: 'rgba(167, 139, 250, 0.2)',
    isDark: true,
    deletable: true
  },

  greenPinkDark: {
    name: 'Green & Pink Dark',
    primary: '#34D399',
    primaryHover: '#10B981',
    primaryLight: '#6EE7B7',
    accent: '#F472B6',
    background: 'linear-gradient(135deg, #064E3B 0%, #134E4A 100%)',
    cardBg: 'rgba(6, 78, 59, 0.85)',
    shadow: '0 10px 25px rgba(52, 211, 153, 0.2)',
    shadowHover: '0 20px 40px rgba(52, 211, 153, 0.3)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
    isDark: true,
    deletable: true
  },

  // Dark Ocean Collection
  oceanBlueDark: {
    name: 'Ocean Blue Dark',
    primary: '#38BDF8',
    primaryHover: '#0EA5E9',
    primaryLight: '#7DD3FC',
    accent: '#1E40AF',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    cardBg: 'rgba(15, 23, 42, 0.85)',
    shadow: '0 10px 25px rgba(56, 189, 248, 0.2)',
    shadowHover: '0 20px 40px rgba(56, 189, 248, 0.3)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
    isDark: true,
    deletable: true
  },

  deepSeaDark: {
    name: 'Deep Sea Dark',
    primary: '#2DD4BF',
    primaryHover: '#14B8A6',
    primaryLight: '#5EEAD4',
    accent: '#22D3EE',
    background: 'linear-gradient(135deg, #042F2E 0%, #134E4A 100%)',
    cardBg: 'rgba(4, 47, 46, 0.85)',
    shadow: '0 10px 25px rgba(45, 212, 191, 0.2)',
    shadowHover: '0 20px 40px rgba(45, 212, 191, 0.3)',
    borderColor: 'rgba(45, 212, 191, 0.2)',
    isDark: true,
    deletable: true
  },

  // Dark Sunset Collection
  sunsetOrangeDark: {
    name: 'Sunset Orange Dark',
    primary: '#FB923C',
    primaryHover: '#EA580C',
    primaryLight: '#FDBA74',
    accent: '#FCD34D',
    background: 'linear-gradient(135deg, #451A03 0%, #78350F 100%)',
    cardBg: 'rgba(69, 26, 3, 0.85)',
    shadow: '0 10px 25px rgba(251, 146, 60, 0.2)',
    shadowHover: '0 20px 40px rgba(251, 146, 60, 0.3)',
    borderColor: 'rgba(251, 146, 60, 0.2)',
    isDark: true,
    deletable: true
  },

  goldenHourDark: {
    name: 'Golden Hour Dark',
    primary: '#FCD34D',
    primaryHover: '#F59E0B',
    primaryLight: '#FDE68A',
    accent: '#FB923C',
    background: 'linear-gradient(135deg, #451A03 0%, #78350F 100%)',
    cardBg: 'rgba(69, 26, 3, 0.85)',
    shadow: '0 10px 25px rgba(252, 211, 77, 0.2)',
    shadowHover: '0 20px 40px rgba(252, 211, 77, 0.3)',
    borderColor: 'rgba(252, 211, 77, 0.2)',
    isDark: true,
    deletable: true
  },

  grayscaleDark: {
    name: 'Grayscale Dark',
    primary: '#D4D4D4',
    primaryHover: '#B3B3B3',
    primaryLight: '#FFFFFF',
    accent: '#B3B3B3',
    background: 'linear-gradient(135deg, #2B2B2B 0%, #1F1F1F 100%)',
    cardBg: 'rgba(43, 43, 43, 0.9)',
    shadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
    shadowHover: '0 20px 40px rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(212, 212, 212, 0.2)',
    isDark: true,
    deletable: true
  }
};

// Function to convert hex color to HSL for sorting by hue
function hexToHsl(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l;
  
  l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s, l];
}

// Function to sort themes by color hue
function sortThemesByColor(themesObj) {
  return Object.entries(themesObj).sort(([keyA, themeA], [keyB, themeB]) => {
    const [hueA] = hexToHsl(themeA.primary);
    const [hueB] = hexToHsl(themeB.primary);
    
    // Handle grayscale themes (very low saturation) - put them at the end
    const [, satA] = hexToHsl(themeA.primary);
    const [, satB] = hexToHsl(themeB.primary);
    
    if (satA < 0.1 && satB >= 0.1) return 1;
    if (satB < 0.1 && satA >= 0.1) return -1;
    if (satA < 0.1 && satB < 0.1) return 0;
    
    return hueA - hueB;
  });
}

function ThemeMenu({ currentTheme, onThemeChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleThemeSelect = (themeKey) => {
    onThemeChange(themeKey);
  };

  return (
    <div className="theme-menu" ref={menuRef}>
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={t ? t('changeTheme') : "Change Theme"}
      >
        <span className="theme-icon">
          {themes[currentTheme]?.isDark ? '🌙' : '☀️'}
        </span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-dropdown-header">
            <h3>{t ? t('chooseTheme') : 'Choose Theme'}</h3>
          </div>
          
          <div className="theme-sections-container">
            {/* Light Themes */}
            <div className="theme-section">
            <h4 className="theme-section-title">{t ? t('lightThemes') : '☀️ Light Themes'}</h4>
            <div className="theme-options">
              {sortThemesByColor(Object.fromEntries(
                Object.entries(themes).filter(([key, theme]) => !theme.isDark)
              )).map(([key, theme]) => (
                <div key={key} className="theme-option-container">
                  <button
                    className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                    onClick={() => handleThemeSelect(key)}
                    style={{
                      '--theme-primary': theme.primary,
                      '--theme-accent': theme.primary
                    }}
                    title={theme.name}
                  >
                    <div 
                      className="theme-preview-circle" 
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.primary} 50%, ${theme.primary} 100%)`
                      }}
                    >
                      {currentTheme === key && <span className="theme-checkmark">✓</span>}
                    </div>
                  </button>
                  <div className="theme-name-label">{theme.name}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Dark Themes */}
          <div className="theme-section">
            <h4 className="theme-section-title">{t ? t('darkThemes') : '🌙 Dark Themes'}</h4>
            <div className="theme-options">
              {sortThemesByColor(Object.fromEntries(
                Object.entries(themes).filter(([key, theme]) => theme.isDark)
              )).map(([key, theme]) => (
                <div key={key} className="theme-option-container">
                  <button
                    className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                    onClick={() => handleThemeSelect(key)}
                    style={{
                      '--theme-primary': theme.primary,
                      '--theme-accent': theme.primary
                    }}
                    title={theme.name}
                  >
                    <div 
                      className="theme-preview-circle" 
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primary} 50%, ${theme.primary} 50%, ${theme.primary} 100%)`
                      }}
                    >
                      {currentTheme === key && <span className="theme-checkmark">✓</span>}
                    </div>
                  </button>
                  <div className="theme-name-label">{theme.name}</div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { themes };
export default ThemeMenu;