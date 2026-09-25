import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sliders,
  Search,
  Crosshair,
  Store,
  Globe,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Zap,
  Target,
  TrendingUp,
  ShoppingBag,
  Coffee,
  Pill,
  Shirt,
  Cpu,
  UtensilsCrossed,
  Scissors,
  Dumbbell,
  Wrench,
  ChevronDown,
  X,
  Smartphone,
  Hammer,
  Gem,
  Footprints,
  BookOpen,
  Armchair,
  Dog,
  Building2,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import { GooglePlacesAutocomplete } from '../../components/location/GooglePlacesAutocomplete';
import GoogleMapsConnectModal from '../../components/common/GoogleMapsConnectModal';
import WhatsAppAnalyticsDashboard from '../../components/dashboard/WhatsAppAnalyticsDashboard';
import { useShopStore } from '../../store/shopStore';
import api from '../../services/api';
import { resolveKeywordToCategories } from '../../utils/searchMatcher';

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: Store, color: '#6366f1' },
  { value: 'Grocery Store', label: 'Grocery Store', icon: ShoppingBag, color: '#10b981' },
  { value: 'Supermarket', label: 'Supermarket', icon: ShoppingBag, color: '#059669' },
  { value: 'General Store', label: 'General Store', icon: Store, color: '#8b5cf6' },
  { value: 'Department Store', label: 'Department Store', icon: Building2, color: '#6366f1' },
  { value: 'Meat & Poultry', label: 'Meat & Poultry', icon: Store, color: '#e11d48' },
  { value: 'Pharmacy', label: 'Pharmacy', icon: Pill, color: '#ef4444' },
  { value: 'Bakery', label: 'Bakery', icon: Coffee, color: '#f59e0b' },
  { value: 'Clothing Store', label: 'Clothing Store', icon: Shirt, color: '#ec4899' },
  { value: 'Tailor', label: 'Tailor', icon: Scissors, color: '#d946ef' },
  { value: 'Electronics Store', label: 'Electronics', icon: Cpu, color: '#3b82f6' },
  { value: 'Mobile Phones', label: 'Mobile Phones', icon: Smartphone, color: '#0284c7' },
  { value: 'Restaurant', label: 'Restaurant', icon: UtensilsCrossed, color: '#f97316' },
  { value: 'Cafe', label: 'Cafe', icon: Coffee, color: '#854d0e' },
  { value: 'Beauty Salon', label: 'Beauty Salon', icon: Sparkles, color: '#a855f7' },
  { value: 'Gym', label: 'Gym', icon: Dumbbell, color: '#0ea5e9' },
  { value: 'Auto Repair', label: 'Auto Repair', icon: Wrench, color: '#64748b' },
  { value: 'Hardware Store', label: 'Hardware', icon: Hammer, color: '#78716c' },
  { value: 'Jewelry', label: 'Jewelry', icon: Gem, color: '#eab308' },
  { value: 'Footwear', label: 'Footwear', icon: Footprints, color: '#14b8a6' },
  { value: 'Book Store', label: 'Book Store', icon: BookOpen, color: '#8b5cf6' },
  { value: 'Furniture', label: 'Furniture', icon: Armchair, color: '#b45309' },
  { value: 'Pet Store', label: 'Pet Store', icon: Dog, color: '#10b981' },
  { value: 'Shopping Mall', label: 'Shopping Mall', icon: Building2, color: '#3b82f6' },
];

const PRESET_DISTANCES = [0.5, 1, 2, 5, 10, 20, 30, 50];

const QUICK_TOWNS = [
  { name: 'Rajampet', lat: 14.1936, lng: 79.1586, full: 'Rajampet, Annamayya District, Andhra Pradesh, India' },
  { name: 'Railway Kodur', lat: 13.9574, lng: 79.3488, full: 'Railway Kodur, Annamayya District, Andhra Pradesh, India' },
  { name: 'Tirupati', lat: 13.6288, lng: 79.4192, full: 'Tirupati, Andhra Pradesh, India' },
  { name: 'Kadapa', lat: 14.4673, lng: 78.8242, full: 'Kadapa, YSR District, Andhra Pradesh, India' },
  { name: 'Puttur', lat: 13.4381, lng: 79.5522, full: 'Puttur, Tirupati / Chittoor, Andhra Pradesh, India' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, full: 'Hyderabad, Telangana, India' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, full: 'Bangalore, Karnataka, India' },
];

const QUICK_LINKS = [
  {
    to: '/shops/websites',
    icon: Globe,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
    border: '#6ee7b7',
    title: 'Shops With Websites',
    desc: 'View live websites & quality scores',
    badge: 'Active',
  },
  {
    to: '/shops/no-websites',
    icon: Store,
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(220,38,38,0.08) 100%)',
    border: '#fda4af',
    title: 'Shops Without Websites',
    desc: 'Suggest new websites & connect',
    badge: 'Opportunity',
  },
  {
    to: '/shops/good-websites',
    icon: CheckCircle2,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.08) 100%)',
    border: '#c4b5fd',
    title: 'High Quality Websites',
    desc: 'Score 80+ audit compliant',
    badge: 'Top Rated',
  },
  {
    to: '/shops/needs-improvement',
    icon: TrendingUp,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.08) 100%)',
    border: '#fcd34d',
    title: 'Needs Improvement',
    desc: 'Website optimization leads',
    badge: 'Leads',
  },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const {
    searchCenter,
    radiusKm,
    category,
    keyword,
    isDetectingLocation,
    locationPermissionGranted,
    setRadius,
    setCategory,
    setKeyword,
    detectCurrentLocation,
    setSearchCenterFromPlace,
    searchNearby,
    loading,
    error,
  } = useShopStore();

  const [locationStatus, setLocationStatus] = useState('');
  const [customRadiusInput, setCustomRadiusInput] = useState('');
  const [forceInputValue, setForceInputValue] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  const matchingKeywordCategories = React.useMemo(() => {
    if (!keyword || !keyword.trim()) {
      return CATEGORIES.filter(c => c.value !== '');
    }
    const kw = keyword.trim().toLowerCase();
    const resolvedNames = resolveKeywordToCategories(kw);
    const directMatches = CATEGORIES.filter(c => {
      if (!c.value) return false;
      const labelLower = c.label.toLowerCase();
      return (
        labelLower.includes(kw) ||
        kw.includes(labelLower) ||
        resolvedNames.includes(c.value)
      );
    });
    return directMatches.length > 0 ? directMatches : CATEGORIES.filter(c => c.value !== '');
  }, [keyword]);

  const checkGoogleStatus = async () => {
    try {
      const res = await api.get('/businesses/config/google-key-status');
      setGoogleConnected(res.data?.connected || false);
    } catch (_) {}
  };

  useEffect(() => {
    checkGoogleStatus();
  }, []);

  const handleDetectLocation = async (autoSearch = true) => {
    setLocationStatus('Acquiring high-accuracy device GPS…');
    setIsTyping(false);
    try {
      const pos = await detectCurrentLocation(autoSearch);
      if (pos && typeof pos === 'object') {
        const displayName = pos.name || `${pos.latitude.toFixed(4)}°, ${pos.longitude.toFixed(4)}°`;
        setForceInputValue(displayName);
        const accuracyText = pos?.accuracy ? `(±${pos.accuracy} m)` : '';
        setLocationStatus(`📍 GPS locked: ${displayName} ${accuracyText}`.trim());
        setActiveStep(2);
        setTimeout(() => setLocationStatus(''), 4500);
      }
    } catch (err) {
      const msg = err?.message || String(err || '');
      setLocationStatus(
        msg.toLowerCase().includes('denied')
          ? '⚠️ Location permission was denied in your browser. Select a town below or search above.'
          : '⚠️ Device GPS is unavailable on this device/browser. Please select a town below or search above.'
      );
      setTimeout(() => setLocationStatus(''), 6000);
    }
  };

  const handleTyping = (value) => {
    setForceInputValue(null);
    setIsTyping(value.trim().length > 0);
  };

  const handleClearLocation = () => {
    setForceInputValue('');
    setIsTyping(false);
  };

  const handlePlaceSelect = (details) => {
    setIsTyping(false);
    setSearchCenterFromPlace(details);
    setLocationStatus('');
    setActiveStep(2);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCat(cat);
    setCategory(cat.value);
    setShowCategoryGrid(false);
    setShowKeywordDropdown(false);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    if (keyword?.trim() && (!category || category === 'All Categories')) {
      const matched = resolveKeywordToCategories(keyword);
      if (matched.length > 0) {
        setCategory(matched[0]);
      }
    }
    setShowKeywordDropdown(false);
    navigate('/shops');
    searchNearby();
  };

  const hasLocation = (searchCenter.type === 'place' && searchCenter.name) ||
    (searchCenter.type === 'gps' && locationPermissionGranted);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
      <style>{`
        :root {
          --bg-base: #f0f4ff;
          --bg-card: rgba(255,255,255,0.95);
          --bg-card-hover: rgba(255,255,255,1);
          --bg-step: rgba(255,255,255,0.9);
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --border: rgba(148,163,184,0.25);
          --border-active: #6366f1;
          --accent: #6366f1;
          --accent-2: #8b5cf6;
          --accent-glow: rgba(99,102,241,0.2);
          --step-done: #10b981;
          --step-active: #6366f1;
          --step-idle: #cbd5e1;
        }
        .dark {
          --bg-base: #080d1a;
          --bg-card: rgba(15,23,42,0.95);
          --bg-card-hover: rgba(20,30,55,0.98);
          --bg-step: rgba(15,23,42,0.85);
          --text-primary: #f8fafc;
          --text-secondary: #94a3b8;
          --text-muted: #475569;
          --border: rgba(30,41,59,0.8);
          --border-active: #818cf8;
          --accent: #818cf8;
          --accent-2: #a78bfa;
          --accent-glow: rgba(129,140,248,0.15);
          --step-done: #34d399;
          --step-active: #818cf8;
          --step-idle: #1e293b;
        }

        /* ---- Orb animations ---- */
        @keyframes float-orb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ud-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          animation: float-orb 8s ease-in-out infinite, pulse-glow 4s ease-in-out infinite;
        }
        .ud-orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }
        .ud-orb-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%);
          top: 100px; right: -80px;
          animation-delay: 3s;
        }
        .ud-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%);
          bottom: 50px; left: 30%;
          animation-delay: 5s;
        }

        /* ---- Hero search area ---- */
        .ud-hero {
          text-align: center;
          padding: 36px 24px 24px;
          position: relative;
          z-index: 40;
        }
        .ud-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 99px;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
          border: 1px solid rgba(99,102,241,0.3);
          color: var(--accent);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .ud-title {
          font-size: clamp(24px, 3.5vw, 38px);
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1.15;
          margin: 0 0 8px;
          letter-spacing: -0.03em;
        }
        .ud-title-gradient {
          background: linear-gradient(135deg, var(--accent), var(--accent-2), #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ud-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          font-weight: 500;
          max-width: 520px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* ---- AI Search Box ---- */
        .ud-search-wrapper {
          max-width: 720px;
          margin: 24px auto 0;
          position: relative;
          z-index: 50;
        }
        .ud-search-ring {
          position: absolute;
          inset: -3px;
          border-radius: 22px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 0;
        }
        .ud-search-wrapper:focus-within .ud-search-ring {
          opacity: 1;
          animation: shimmer 2s linear infinite;
          background-size: 200%;
        }
        .ud-search-box {
          position: relative;
          background: var(--bg-card);
          border-radius: 20px;
          border: 1.5px solid var(--border);
          padding: 6px 6px 6px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 50;
          box-shadow: 0 8px 40px rgba(0,0,0,0.08), 0 0 0 0 var(--accent-glow);
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .ud-search-wrapper:focus-within .ud-search-box {
          border-color: var(--border-active);
          box-shadow: 0 8px 40px rgba(0,0,0,0.12), 0 0 0 4px var(--accent-glow);
        }
        .ud-search-icon {
          flex-shrink: 0;
          color: var(--accent);
          width: 20px; height: 20px;
        }
        .ud-search-inner {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 50;
        }
        .ud-gps-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .ud-gps-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ud-gps-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .ud-gps-spin { animation: spin-slow 1.2s linear infinite; }

        /* ---- Location selected pill ---- */
        .ud-loc-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 6px 14px;
          border-radius: 99px;
          background: var(--bg-card);
          border: 1.5px solid rgba(99,102,241,0.25);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          animation: slide-in-up 0.3s ease;
          max-width: 100%;
        }
        .ud-loc-pill-gps {
          border-color: rgba(16,185,129,0.35);
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(5,150,105,0.04));
        }
        .ud-loc-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }
        .ud-loc-dot-gps { background: #10b981; }
        .ud-loc-name { font-weight: 700; color: var(--accent); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ud-loc-addr { color: var(--text-secondary); font-size: 11px; }
        .ud-status-msg {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #6366f1;
          animation: slide-in-up 0.3s ease;
        }

        /* ---- Steps layout ---- */
        .ud-steps-row {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          max-width: 900px;
          margin: 0 auto 8px;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }
        .ud-step-connector {
          flex: 1;
          height: 2px;
          background: var(--step-idle);
          margin-top: 20px;
          transition: background 0.4s;
        }
        .ud-step-connector.done { background: var(--step-done); }

        /* ---- Main content grid ---- */
        .ud-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 48px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 900px) {
          .ud-content { grid-template-columns: 1fr; }
        }

        /* ---- Step cards (more compact) ---- */
        .ud-card {
          background: var(--bg-card);
          border-radius: 18px;
          border: 1.5px solid var(--border);
          padding: 18px 22px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: all 0.3s;
          animation: slide-in-up 0.4s ease;
        }
        .ud-card + .ud-card { margin-top: 14px; }
        .ud-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .ud-card-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-primary);
        }
        .ud-card-num {
          width: 24px; height: 24px;
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .ud-card-num-active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }
        .ud-card-num-done {
          background: #10b981;
          color: white;
        }
        .ud-card-num-idle {
          background: var(--step-idle);
          color: white;
        }

        /* ---- Radius buttons ---- */
        .ud-radius-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }
        .ud-radius-btn {
          padding: 6px 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: transparent;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .ud-radius-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }
        .ud-radius-btn.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: transparent;
          color: white;
          box-shadow: 0 3px 10px rgba(99,102,241,0.25);
          transform: scale(1.03);
        }

        /* ---- Range slider ---- */
        .ud-range {
          width: 100%;
          height: 6px;
          border-radius: 99px;
          background: linear-gradient(to right, #6366f1 0%, #6366f1 var(--fill, 2%), #e2e8f0 var(--fill, 2%));
          appearance: none;
          cursor: pointer;
          outline: none;
          margin-bottom: 8px;
        }
        .ud-range::-webkit-slider-thumb {
          appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: white;
          border: 3px solid #6366f1;
          box-shadow: 0 2px 8px rgba(99,102,241,0.4);
          cursor: grab;
          transition: transform 0.15s;
        }
        .ud-range:active::-webkit-slider-thumb { cursor: grabbing; transform: scale(1.2); }

        /* ---- Category grid ---- */
        .ud-cat-trigger {
          width: 100%;
          padding: 12px 18px;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .ud-cat-trigger:hover { border-color: var(--accent); }
        .ud-cat-icon-wrap {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ud-cat-dropdown {
          margin-top: 10px;
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          padding: 12px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          animation: slide-in-up 0.2s ease;
        }
        @media (max-width: 500px) {
          .ud-cat-dropdown { grid-template-columns: repeat(2, 1fr); }
        }
        .ud-cat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          border-radius: 12px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-align: center;
        }
        .ud-cat-item:hover { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }
        .ud-cat-item.selected { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }

        /* ---- Keyword input ---- */
        .ud-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .ud-input::placeholder { color: var(--text-muted); }
        .ud-input:focus { border-color: var(--border-active); box-shadow: 0 0 0 3px var(--accent-glow); }

        /* ---- Custom radius ---- */
        .ud-custom-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(99,102,241,0.04);
          border: 1.5px dashed rgba(99,102,241,0.2);
          border-radius: 12px;
        }
        .ud-custom-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .ud-custom-input {
          width: 70px;
          padding: 5px 8px;
          text-align: center;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg-card);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          outline: none;
        }
        .ud-custom-input:focus { border-color: var(--border-active); }
        .ud-apply-btn {
          padding: 8px 16px;
          border-radius: 10px;
          background: var(--text-primary);
          color: white;
          font-size: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ud-apply-btn:hover { opacity: 0.85; }

        /* ---- CTA Search Button ---- */
        .ud-search-btn {
          width: 100%;
          padding: 18px 24px;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
          background-size: 200%;
          color: white;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 30px rgba(99,102,241,0.35);
          margin-top: 24px;
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }
        .ud-search-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .ud-search-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99,102,241,0.45); background-position: 100%; }
        .ud-search-btn:hover::before { opacity: 1; }
        .ud-search-btn:active { transform: scale(0.98); }
        .ud-search-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ---- Right sidebar ---- */
        .ud-sidebar-card {
          background: var(--bg-card);
          border-radius: 20px;
          border: 1.5px solid var(--border);
          padding: 24px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          animation: slide-in-up 0.5s ease;
        }
        .ud-sidebar-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .ud-sidebar-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .ud-quick-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.25s;
          margin-bottom: 10px;
          text-align: left;
          width: 100%;
          background: transparent;
        }
        .ud-quick-card:last-child { margin-bottom: 0; }
        .ud-quick-card:hover { transform: translateX(4px); }
        .ud-quick-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ud-quick-info { flex: 1; min-width: 0; }
        .ud-quick-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .ud-quick-desc {
          font-size: 11px;
          color: var(--text-muted);
        }
        .ud-quick-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        /* ---- AI tip card ---- */
        .ud-ai-card {
          margin-top: 20px;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          border-radius: 20px;
          padding: 22px;
          border: 1px solid rgba(99,102,241,0.25);
          position: relative;
          overflow: hidden;
        }
        .ud-ai-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%);
        }
        .ud-ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }
        .ud-ai-text {
          font-size: 12px;
          color: #cbd5e1;
          line-height: 1.65;
          font-weight: 500;
        }

        /* ---- Error ---- */
        .ud-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(244,63,94,0.07);
          border: 1.5px solid rgba(244,63,94,0.2);
          font-size: 12px;
          font-weight: 600;
          color: #f43f5e;
          margin-top: 16px;
        }
      `}</style>

      <Navbar />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Background orbs */}
        <div className="ud-orb ud-orb-1" />
        <div className="ud-orb ud-orb-2" />
        <div className="ud-orb ud-orb-3" />

        {/* Hero Section */}
        <div className="ud-hero">
          <div className="ud-badge">
            <Zap style={{ width: 12, height: 12 }} />
            <span>Website Presence Detection</span>
          </div>

          <h1 className="ud-title">
            Find Nearby Shops &{' '}
            <span className="ud-title-gradient">Businesses</span>
          </h1>
          <p className="ud-subtitle">
            Discover verified local shops near you, audit their digital presence,
            and connect directly — powered by Lexon IT.
          </p>

          {/* AI-style search input */}
          <div className="ud-search-wrapper">
            <div className="ud-search-ring" />
            <div className="ud-search-box">
              <MapPin className="ud-search-icon" />
              <div className="ud-search-inner">
                <GooglePlacesAutocomplete
                  forceValue={forceInputValue}
                  placeholder="Search a location… e.g. HITEC City, Hyderabad"
                  onPlaceSelect={handlePlaceSelect}
                  onTyping={handleTyping}
                  onClear={handleClearLocation}
                />
              </div>
              <button
                type="button"
                onClick={() => handleDetectLocation(false)}
                disabled={isDetectingLocation}
                className="ud-gps-btn"
              >
                <Crosshair
                  style={{ width: 14, height: 14 }}
                  className={isDetectingLocation ? 'ud-gps-spin' : ''}
                />
                <span>{isDetectingLocation ? 'Locating…' : 'Use GPS'}</span>
              </button>
            </div>
          </div>

          {/* Location selected indicator */}
          {!isTyping && (
            <>
              {searchCenter.type === 'place' && searchCenter.name && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <div className="ud-loc-pill">
                    <div className="ud-loc-dot" />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div className="ud-loc-name">📍 {searchCenter.name}</div>
                      {searchCenter.formattedAddress && (
                        <div className="ud-loc-addr">{searchCenter.formattedAddress}</div>
                      )}
                    </div>
                    <CheckCircle2 style={{ width: 14, height: 14, color: '#6366f1', flexShrink: 0 }} />
                  </div>
                </div>
              )}
              {searchCenter.type === 'gps' && locationPermissionGranted && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                  <div className="ud-loc-pill ud-loc-pill-gps">
                    <div className="ud-loc-dot ud-loc-dot-gps" />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        📍 {searchCenter.name || 'Current Location'}
                      </span>
                      {searchCenter.formattedAddress && searchCenter.formattedAddress !== searchCenter.name && (
                        <div className="ud-loc-addr" style={{ color: '#047857' }}>{searchCenter.formattedAddress}</div>
                      )}
                    </div>
                    <CheckCircle2 style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }} />
                  </div>
                </div>
              )}
              {locationStatus && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className="ud-status-msg">
                    <Navigation style={{ width: 13, height: 13 }} />
                    <span>{locationStatus}</span>
                  </div>
                </div>
              )}

              {/* Quick Select Popular Towns */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 2 }}>Quick Towns:</span>
                {QUICK_TOWNS.map((t) => {
                  const isCur = searchCenter?.name?.toLowerCase().includes(t.name.toLowerCase());
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => handlePlaceSelect({
                        type: 'place',
                        placeId: `loc_${t.name.toLowerCase().replace(/\s+/g, '_')}`,
                        name: t.name,
                        formattedAddress: t.full,
                        shortAddress: t.name,
                        latitude: t.lat,
                        longitude: t.lng,
                      })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: isCur ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isCur ? '1.5px solid #6366f1' : '1px solid #e2e8f0',
                        background: isCur ? '#ede9fe' : '#ffffff',
                        color: isCur ? '#4338ca' : '#475569',
                        boxShadow: isCur ? '0 2px 6px rgba(99, 102, 241, 0.18)' : '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      📍 {t.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Main content area */}
        <div className="ud-content">
          {/* Left: Config cards */}
          <div>
            {/* Card 1: Search Radius */}
            <div className="ud-card">
              <div className="ud-card-header">
                <div className="ud-card-label">
                  <div className={`ud-card-num ${radiusKm !== 1 ? 'ud-card-num-done' : 'ud-card-num-active'}`}>
                    {radiusKm !== 1 ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : '1'}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sliders style={{ width: 15, height: 15, color: '#6366f1' }} />
                    Search Radius
                  </span>
                </div>
                <span style={{
                  fontSize: 22, fontWeight: 900,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {radiusKm} km
                </span>
              </div>

              <input
                type="range"
                min="1" max="50" step="1"
                value={radiusKm}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="ud-range"
                style={{ '--fill': `${((radiusKm - 1) / 49) * 100}%` }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
                <span>1 km</span><span>25 km</span><span>50 km</span>
              </div>

              <div className="ud-radius-grid">
                {PRESET_DISTANCES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRadius(d)}
                    className={`ud-radius-btn ${radiusKm === d ? 'active' : ''}`}
                  >
                    {d < 1 ? `${d * 1000} m` : `${d} km`}
                  </button>
                ))}
              </div>

              <div className="ud-custom-row">
                <span className="ud-custom-label">Custom:</span>
                <input
                  type="number" min="1" max="200" step="1"
                  value={customRadiusInput}
                  onChange={(e) => setCustomRadiusInput(e.target.value)}
                  placeholder="e.g. 30"
                  className="ud-custom-input"
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>KM</span>
                <button
                  type="button"
                  onClick={() => {
                    const v = parseFloat(customRadiusInput);
                    if (!isNaN(v) && v > 0) setRadius(v);
                  }}
                  className="ud-apply-btn"
                >Apply</button>
              </div>
            </div>

            {/* Card 2: Category */}
            <div className="ud-card">
              <div className="ud-card-header">
                <div className="ud-card-label">
                  <div className={`ud-card-num ${selectedCat.value !== '' ? 'ud-card-num-done' : 'ud-card-num-active'}`}>
                    {selectedCat.value !== '' ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : '2'}
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Store style={{ width: 15, height: 15, color: '#6366f1' }} />
                    Shop Category
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryGrid(!showCategoryGrid)}
                className="ud-cat-trigger"
              >
                <div
                  className="ud-cat-icon-wrap"
                  style={{ background: selectedCat.color + '22' }}
                >
                  {React.createElement(selectedCat.icon, {
                    style: { width: 16, height: 16, color: selectedCat.color }
                  })}
                </div>
                <span style={{ flex: 1 }}>{selectedCat.label}</span>
                <ChevronDown
                  style={{
                    width: 16, height: 16,
                    color: 'var(--text-muted)',
                    transform: showCategoryGrid ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              {showCategoryGrid && (
                <div className="ud-cat-dropdown">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`ud-cat-item ${selectedCat.value === cat.value ? 'selected' : ''}`}
                    >
                      <div
                        className="ud-cat-icon-wrap"
                        style={{ background: cat.color + '22', width: 36, height: 36 }}
                      >
                        {React.createElement(cat.icon, {
                          style: { width: 16, height: 16, color: cat.color }
                        })}
                      </div>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Keyword Search with Downside Category Suggestions */}
            <div className="ud-card" style={{ position: 'relative' }}>
              <div className="ud-card-header">
                <div className="ud-card-label">
                  <div className="ud-card-num ud-card-num-active">3</div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Search style={{ width: 15, height: 15, color: '#6366f1' }} />
                    Search Keyword / Category
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'none' }}>(e.g. restaurant, supermarket)</span>
                  </span>
                </div>
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setShowKeywordDropdown(true);
                  }}
                  onFocus={() => setShowKeywordDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowKeywordDropdown(false);
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Type category (e.g. restaurant, supermarket, bakery, pharmacy…)"
                  className="ud-input"
                  style={{ paddingRight: 64 }}
                />
                <div style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {keyword?.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyword('');
                        setShowKeywordDropdown(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4,
                      }}
                      title="Clear search"
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowKeywordDropdown(!showKeywordDropdown)}
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '5px 8px',
                      transition: 'all 0.2s',
                    }}
                    title="Select Category from Dropdown"
                  >
                    <ChevronDown
                      style={{
                        width: 15,
                        height: 15,
                        transform: showKeywordDropdown ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Downside Category Dropdown List */}
              {showKeywordDropdown && (
                <div
                  style={{
                    marginTop: 8,
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-active)',
                    borderRadius: 14,
                    padding: '8px',
                    boxShadow: '0 12px 32px rgba(99,102,241,0.18)',
                    maxHeight: 250,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    zIndex: 50,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px' }}>
                    Select Category to Search ({radiusKm} km):
                  </div>
                  {matchingKeywordCategories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setKeyword(cat.label);
                        handleCategorySelect(cat);
                        setShowKeywordDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        border: selectedCat.value === cat.value ? '1px solid var(--accent)' : '1px solid transparent',
                        background: selectedCat.value === cat.value ? 'rgba(99,102,241,0.12)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: cat.color + '22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {React.createElement(cat.icon, {
                            style: { width: 15, height: 15, color: cat.color },
                          })}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {cat.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--accent)',
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(99,102,241,0.08)',
                        }}
                      >
                        Search {cat.label} →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="ud-error">
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</span>
              </div>
            )}

            {/* Search CTA */}
            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={loading}
              className="ud-search-btn"
            >
              {loading ? (
                <>
                  <Sparkles style={{ width: 18, height: 18 }} className="ud-gps-spin" />
                  <span>Searching businesses near you…</span>
                </>
              ) : (
                <>
                  <Search style={{ width: 18, height: 18 }} />
                  <span>Search {selectedCat?.value && selectedCat.value !== 'All Categories' ? `${selectedCat.label} ` : (keyword ? `"${keyword}" ` : '')}Within {radiusKm} km</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </div>

          {/* Right Sidebar */}
          <div>
            <div className="ud-sidebar-card">
              <div className="ud-sidebar-title">Explore by Category</div>
              <div className="ud-sidebar-sub">Jump directly into presence groups</div>

              {QUICK_LINKS.map(({ to, icon: Icon, color, gradient, border, title, desc, badge }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="ud-quick-card"
                  style={{
                    background: gradient,
                    border: `1.5px solid ${border}`,
                  }}
                >
                  <div
                    className="ud-quick-icon"
                    style={{ background: color + '22' }}
                  >
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                  <div className="ud-quick-info">
                    <div className="ud-quick-title">{title}</div>
                    <div className="ud-quick-desc">{desc}</div>
                  </div>
                  <div
                    className="ud-quick-badge"
                    style={{ background: color + '22', color }}
                  >
                    {badge}
                  </div>
                </button>
              ))}
            </div>

            {/* Google Maps API Connection Card */}
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 ${googleConnected ? 'text-emerald-500' : 'text-blue-500'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Google Maps API</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    googleConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {googleConnected ? 'Connected' : 'Free Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                {googleConnected
                  ? 'Official Google Places API is active. Real-time global search enabled.'
                  : 'Connect your free Google Places API key to get instant 20+ live listings & photos worldwide.'}
              </p>
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  googleConnected
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{googleConnected ? 'Manage Google API Key' : 'Connect Google Maps Key'}</span>
              </button>
            </div>

            {/* AI powered tip */}
            <div className="ud-ai-card">
              <div className="ud-ai-badge">
                <Sparkles style={{ width: 12, height: 12 }} />
                <span>Powered by Lexon IT</span>
              </div>
              <p className="ud-ai-text">
                Our AI scans business listings in real-time, audits website quality scores,
                and surfaces shops that need a digital upgrade — helping you identify the
                best outreach opportunities near your selected location.
              </p>
            </div>
          </div>
        </div>

        {/* AI Daily Dashboard & WhatsApp Activity Tracking */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px', position: 'relative', zIndex: 1 }}>
          <WhatsAppAnalyticsDashboard />
        </div>
      </main>

      <GoogleMapsConnectModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onConnected={() => {
          checkGoogleStatus();
        }}
      />

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
