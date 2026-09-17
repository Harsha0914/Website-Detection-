import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Store,
  Globe,
  GlobeLock,
  CheckCircle2,
  Sparkles,
  MapPin,
  Sliders,
  Layers,
  Map as MapIcon,
  List,
  Crosshair,
  X,
  Navigation,
  Search,
  ArrowLeft,
  TrendingUp,
  Zap,
  Key,
  MessageCircle,
  Send,
  Bot,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import { BusinessCard } from '../../components/shops/BusinessCard';
import { BusinessMap } from '../../components/map/BusinessMap';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { GooglePlacesAutocomplete } from '../../components/location/GooglePlacesAutocomplete';
import GoogleMapsConnectModal from '../../components/common/GoogleMapsConnectModal';
import BulkWhatsAppBroadcastModal from '../../components/shops/BulkWhatsAppBroadcastModal';
import { launchWhatsAppApp } from '../../services/whatsappService';
import { useShopStore } from '../../store/shopStore';

const CATEGORIES = [
  'All Categories',
  'Grocery Store',
  'Supermarket',
  'General Store',
  'Department Store',
  'Meat & Poultry',
  'Pharmacy',
  'Bakery',
  'Clothing Store',
  'Tailor',
  'Electronics Store',
  'Mobile Phones',
  'Restaurant',
  'Cafe',
  'Beauty Salon',
  'Gym',
  'Auto Repair',
  'Hardware Store',
  'Jewelry',
  'Footwear',
  'Book Store',
  'Furniture',
  'Pet Store',
  'Shopping Mall',
];
const PRESET_DISTANCES = [0.5, 1, 2, 5, 10, 20, 30, 50];

export const QUICK_PLACES = [
  { name: 'Rajampet', lat: 14.1936, lng: 79.1586, group: 'Local / AP' },
  { name: 'Railway Kodur', lat: 13.9574, lng: 79.3488, group: 'Local / AP' },
  { name: 'Tirupati', lat: 13.6288, lng: 79.4192, group: 'Local / AP' },
  { name: 'Kadapa', lat: 14.4673, lng: 78.8242, group: 'Local / AP' },
  { name: 'Puttur (AP)', lat: 13.4381, lng: 79.5522, group: 'Local / AP' },
  { name: 'Chittoor', lat: 13.2172, lng: 79.1003, group: 'Local / AP' },
  { name: 'Nellore', lat: 14.4426, lng: 79.9865, group: 'Local / AP' },
  { name: 'Vijayawada', lat: 16.5062, lng: 80.6480, group: 'Local / AP' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, group: 'Local / AP' },
  { name: 'Kurnool', lat: 15.8281, lng: 78.0373, group: 'Local / AP' },
  { name: 'Anantapur', lat: 14.6819, lng: 77.6006, group: 'Local / AP' },
  { name: 'Guntur', lat: 16.3067, lng: 80.4365, group: 'Local / AP' },
  { name: 'Hyderabad', lat: 17.4485, lng: 78.3895, group: 'Major Metros' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, group: 'Major Metros' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, group: 'Major Metros' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, group: 'Major Metros' },
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, group: 'Major Metros' },
];

const TAB_CONFIG = {
  all:              { color: '#6366f1', bg: '#ede9fe', label: 'All Shops' },
  websites:         { color: '#10b981', bg: '#d1fae5', label: 'Website Available' },
  'no-websites':    { color: '#f43f5e', bg: '#ffe4e6', label: 'No Website' },
  'good-websites':  { color: '#3b82f6', bg: '#dbeafe', label: 'Good Websites' },
  'needs-improvement': { color: '#f59e0b', bg: '#fef3c7', label: 'Needs Improvement' },
};

export default function ShopsPage({ defaultTab = 'all' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [viewMode, setViewMode] = useState('split');
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('send_whatsapp') === '1' || searchParams.get('broadcast') === '1') {
      setShowBroadcastModal(true);
    }
  }, [searchParams]);

  const {
    businesses, searchCenter, radiusKm, category, keyword,
    total, withWebsites, withoutWebsites, goodWebsites, needsImprovement,
    selectedBusinessId, setSelectedBusinessId, searchNearby,
    detectCurrentLocation, setSearchCenterFromPlace, setLocation, loading, error, apiError, errorType,
    setRadius, setCategory, setKeyword, isDetectingLocation, debugInfo,
  } = useShopStore();

  const latitude  = searchCenter?.latitude;
  const longitude = searchCenter?.longitude;
  const locationName = searchCenter?.name || 'Current Location';

  const [tempSearchCenter, setTempSearchCenter] = useState(searchCenter);
  const [tempRadius,   setTempRadius]   = useState(radiusKm);
  const [tempCategory, setTempCategory] = useState(category || 'All Categories');
  const [tempKeyword,  setTempKeyword]  = useState(keyword || '');
  const [modalKey,     setModalKey]     = useState(0);
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => { 
    if (businesses.length === 0) {
      searchNearby().catch(() => {});
    }
  }, []);
  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);
  useEffect(() => {
    setTempSearchCenter(searchCenter);
    setTempRadius(radiusKm);
    setTempCategory(category || 'All Categories');
    setTempKeyword(keyword || '');
    setModalKey(k => k + 1);
  }, [showModifyModal]);

  // Available Categories dynamically computed within the active radius
  const availableCategories = React.useMemo(() => {
    const counts = {};
    businesses.forEach(b => {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [businesses]);

  const filteredBusinesses = businesses.filter(b => {
    // 0. Exclude permanently & temporarily closed shops
    const status = (b.business_status || 'OPERATIONAL').toUpperCase().trim();
    if (status !== 'OPERATIONAL' || status === 'CLOSED_PERMANENTLY' || status === 'PERMANENTLY_CLOSED' || status === 'CLOSED' || status === 'CLOSED_TEMPORARILY' || status === 'TEMPORARILY_CLOSED') return false;

    const nameLower = (b.name || '').toLowerCase();
    if (nameLower.includes('(permanently closed)') || nameLower.includes('[permanently closed]') || nameLower.includes('(closed)') || nameLower.includes('closed permanently')) return false;

    // 1. Strict radius enforcement (allow nearest fallback if overall set is small)
    const maxAllowedDist = businesses.length <= 5 ? Math.max(radiusKm, 15.0) : radiusKm;
    if (b.distance_km != null && b.distance_km > maxAllowedDist) return false;

    // 2. Category selection within radius (Requirement 2)
    if (category && category !== 'All Categories') {
      const targetCat = category.toLowerCase().trim();
      const shopCat = (b.category || '').toLowerCase().trim();

      if (targetCat === 'restaurant' || targetCat.includes('restaurant')) {
        if (!['restaurant', 'family restaurant', 'fast food restaurant'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'beauty salon' || targetCat.includes('salon') || targetCat.includes('spa') || targetCat.includes('barber')) {
        if (!['beauty salon', 'hair salon', 'barber shop', 'spa'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'bakery' || targetCat.includes('bakery')) {
        if (!['bakery', 'pastry shop'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'supermarket' || targetCat.includes('supermarket')) {
        if (!['supermarket', 'hypermarket'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'grocery store' || targetCat.includes('grocery') || targetCat.includes('general store')) {
        if (!['grocery store', 'general store', 'convenience store'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'pharmacy' || targetCat.includes('pharmacy') || targetCat.includes('medical')) {
        if (!['pharmacy', 'drugstore'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'cafe' || targetCat.includes('cafe')) {
        if (!['cafe', 'coffee shop'].includes(shopCat)) {
          return false;
        }
      } else if (targetCat === 'meat & poultry' || targetCat.includes('meat') || targetCat.includes('poultry') || targetCat.includes('chicken') || targetCat.includes('mutton') || targetCat.includes('fish')) {
        if (!['meat & poultry', 'meat shop'].includes(shopCat)) {
          return false;
        }
      } else {
        if (shopCat !== targetCat && !shopCat.includes(targetCat) && !targetCat.includes(shopCat)) {
          return false;
        }
      }
    }

    // 3. Tab filter
    if (activeTab === 'websites')          return b.website_status === 'WEBSITE_AVAILABLE';
    if (activeTab === 'no-websites')       return b.website_status === 'NO_WEBSITE' || b.website_status === 'WEBSITE_UNREACHABLE';
    if (activeTab === 'good-websites')     return b.website_score != null && b.website_score >= 80;
    if (activeTab === 'needs-improvement') return b.website_status === 'WEBSITE_AVAILABLE' && (b.website_score == null || b.website_score < 80);
    return true;
  });

  // Shops without website available for bulk outreach
  const noWebsiteShops = React.useMemo(() => {
    return filteredBusinesses.filter(b => b.website_status === 'NO_WEBSITE' || b.website_status === 'WEBSITE_UNREACHABLE');
  }, [filteredBusinesses]);

  const broadcastTargetList = activeTab === 'no-websites' 
    ? filteredBusinesses 
    : (noWebsiteShops.length > 0 ? noWebsiteShops : filteredBusinesses);

  const tabs = [
    { id: 'all',              label: 'All Shops',          count: total,           icon: Store,        path: '/shops' },
    { id: 'websites',         label: 'Website Available',  count: withWebsites,    icon: Globe,        path: '/shops/websites' },
    { id: 'no-websites',      label: 'No Website',         count: withoutWebsites, icon: GlobeLock,    path: '/shops/no-websites' },
    { id: 'good-websites',    label: 'Good Websites',      count: goodWebsites,    icon: CheckCircle2, path: '/shops/good-websites' },
    { id: 'needs-improvement',label: 'Needs Improvement',  count: needsImprovement,icon: TrendingUp,   path: '/shops/needs-improvement' },
  ];

  const handleApplyModify = async () => {
    if (tempSearchCenter && tempSearchCenter.latitude != null && tempSearchCenter.longitude != null) {
      if (tempSearchCenter.type === 'place' || tempSearchCenter.placeId) {
        await setSearchCenterFromPlace(tempSearchCenter, false);
      } else {
        await setLocation(tempSearchCenter.latitude, tempSearchCenter.longitude, tempSearchCenter.name || 'Current Location', null, false);
      }
    }
    setRadius(tempRadius);
    setCategory(tempCategory === 'All Categories' ? '' : tempCategory);
    setKeyword(tempKeyword);
    setShowModifyModal(false);
    await searchNearby().catch(() => {});
  };

  const activeTabCfg = TAB_CONFIG[activeTab] || TAB_CONFIG.all;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sp-bg)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        :root {
          --sp-bg: #f0f4ff;
          --sp-card: rgba(255,255,255,0.97);
          --sp-border: rgba(148,163,184,0.22);
          --sp-text: #0f172a;
          --sp-muted: #64748b;
          --sp-accent: #6366f1;
          --sp-glow: rgba(99,102,241,0.18);
        }
        .dark {
          --sp-bg: #080d1a;
          --sp-card: rgba(15,23,42,0.97);
          --sp-border: rgba(30,41,59,0.8);
          --sp-text: #f8fafc;
          --sp-muted: #94a3b8;
          --sp-accent: #818cf8;
          --sp-glow: rgba(129,140,248,0.14);
        }

        @keyframes sp-float {
          0%,100%{transform:translateY(0) scale(1);}
          50%{transform:translateY(-24px) scale(1.04);}
        }
        @keyframes sp-fadein {
          from{opacity:0;transform:translateY(14px);}
          to{opacity:1;transform:translateY(0);}
        }
        @keyframes sp-spin {
          from{transform:rotate(0deg);}
          to{transform:rotate(360deg);}
        }
        @keyframes sp-shimmer {
          0%{background-position:-200% center;}
          100%{background-position:200% center;}
        }

        .sp-orb {
          position:absolute; border-radius:50%;
          filter:blur(90px); pointer-events:none;
          animation: sp-float 9s ease-in-out infinite;
        }
        .sp-orb-1{width:380px;height:380px;background:radial-gradient(circle,rgba(99,102,241,.22),transparent 70%);top:-60px;left:-80px;animation-delay:0s;}
        .sp-orb-2{width:320px;height:320px;background:radial-gradient(circle,rgba(16,185,129,.16),transparent 70%);top:120px;right:-60px;animation-delay:4s;}
        .sp-orb-3{width:260px;height:260px;background:radial-gradient(circle,rgba(245,158,11,.12),transparent 70%);bottom:40px;left:38%;animation-delay:7s;}

        /* ---- hero strip ---- */
        .sp-hero {
          position:relative; overflow:hidden;
          padding: 32px 0 0;
        }
        .sp-hero-inner {
          max-width:1280px; margin:0 auto; padding:0 28px;
          display:flex; flex-wrap:wrap; align-items:flex-start;
          justify-content:space-between; gap:16px;
          position:relative; z-index:2;
        }
        .sp-badge {
          display:inline-flex; align-items:center; gap:5px;
          padding:4px 12px; border-radius:99px;
          background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));
          border:1px solid rgba(99,102,241,.3);
          color:var(--sp-accent); font-size:10px; font-weight:800;
          text-transform:uppercase; letter-spacing:.08em; margin-bottom:10px;
        }
        .sp-title {
          font-size:clamp(20px,3vw,32px); font-weight:900;
          color:var(--sp-text); letter-spacing:-.03em; margin:0 0 6px;
          line-height:1.15;
        }
        .sp-title-grad {
          background:linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          background-clip:text;
        }
        .sp-subtitle {
          font-size:12px; color:var(--sp-muted); font-weight:500; line-height:1.6;
        }
        .sp-subtitle strong { color:var(--sp-accent); font-weight:800; -webkit-text-fill-color:var(--sp-accent); }
        .sp-subtitle b { color:var(--sp-text); font-weight:700; -webkit-text-fill-color:var(--sp-text); }

        /* ---- control row ---- */
        .sp-controls {
          display:flex; align-items:center; gap:8px; flex-wrap:wrap;
        }
        .sp-ctrl-btn {
          display:flex; align-items:center; gap:6px;
          padding:9px 16px; border-radius:12px; border:1.5px solid var(--sp-border);
          background:var(--sp-card); font-size:11px; font-weight:700;
          color:var(--sp-text); cursor:pointer; transition:all .2s;
          white-space:nowrap;
        }
        .sp-ctrl-btn:hover { border-color:var(--sp-accent); color:var(--sp-accent); }
        .sp-ctrl-btn:disabled { opacity:.55; cursor:not-allowed; }
        .sp-ctrl-gps {
          background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.06));
          border-color:rgba(99,102,241,.3); color:var(--sp-accent);
        }
        .sp-ctrl-gps:hover { background:rgba(99,102,241,.18); }
        .sp-modify-btn {
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border-color:transparent; color:#fff;
          box-shadow:0 4px 16px rgba(99,102,241,.3);
        }
        .sp-modify-btn:hover { filter:brightness(1.1); transform:translateY(-1px); }
        .sp-view-group {
          display:flex; align-items:center;
          background:var(--sp-card); border:1.5px solid var(--sp-border);
          border-radius:12px; padding:3px; gap:2px;
        }
        .sp-view-btn {
          display:flex; align-items:center; gap:5px;
          padding:7px 12px; border-radius:9px; border:none;
          font-size:11px; font-weight:700; cursor:pointer;
          transition:all .2s; color:var(--sp-muted); background:transparent;
        }
        .sp-view-btn.active {
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          color:#fff; box-shadow:0 3px 10px rgba(99,102,241,.3);
        }
        .sp-view-btn:not(.active):hover { color:var(--sp-accent); }

        /* ---- tab bar ---- */
        .sp-tab-wrap {
          max-width:1280px; margin:24px auto 0; padding:0 28px 0;
          position:relative; z-index:3;
        }
        .sp-tabs {
          display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;
        }
        .sp-tabs::-webkit-scrollbar { height:0; }
        .sp-tab {
          display:flex; align-items:center; gap:7px;
          padding:9px 18px; border-radius:14px; border:1.5px solid var(--sp-border);
          background:var(--sp-card); font-size:11px; font-weight:700;
          color:var(--sp-muted); cursor:pointer; transition:all .2s; white-space:nowrap;
          flex-shrink:0;
        }
        .sp-tab:hover { border-color:var(--sp-accent); color:var(--sp-accent); }
        .sp-tab.active {
          border-color:transparent; color:#fff;
          box-shadow:0 4px 16px rgba(99,102,241,.28); transform:translateY(-1px);
        }
        .sp-tab-count {
          padding:2px 8px; border-radius:99px; font-size:10px; font-weight:900;
        }

        /* ---- main content ---- */
        .sp-main {
          max-width:1280px; margin:0 auto;
          padding:20px 28px 56px; position:relative; z-index:2;
          flex:1;
        }
        @media(max-width:768px){ .sp-main{padding:16px 16px 48px;} }

        /* ---- list panel ---- */
        .sp-list-panel {
          height:780px; overflow-y:auto; padding-right:4px; scroll-behavior:smooth;
        }
        .sp-list-panel::-webkit-scrollbar{width:4px;}
        .sp-list-panel::-webkit-scrollbar-track{background:transparent;}
        .sp-list-panel::-webkit-scrollbar-thumb{background:rgba(99,102,241,.25);border-radius:4px;}

        /* ---- map panel ---- */
        .sp-map-panel {
          border-radius:20px; overflow:hidden;
          border:1.5px solid var(--sp-border);
          box-shadow:0 8px 32px rgba(0,0,0,.1);
        }

        /* ---- spin ---- */
        .sp-spin { animation:sp-spin 1s linear infinite; }

        /* ---- loading card ---- */
        .sp-loading-card {
          background:var(--sp-card); border-radius:20px;
          border:1.5px solid var(--sp-border);
          padding:64px 32px;
          box-shadow:0 4px 24px rgba(0,0,0,.06);
        }

        /* ===== MODAL ===== */
        .sp-overlay {
          position:fixed; inset:0; z-index:60;
          background:rgba(8,13,26,.6); backdrop-filter:blur(6px);
          display:flex; align-items:center; justify-content:center; padding:16px;
          animation:sp-fadein .2s ease;
        }
        .sp-modal {
          background:var(--sp-card); border-radius:24px; max-width:500px; width:100%;
          border:1.5px solid var(--sp-border);
          box-shadow:0 24px 80px rgba(0,0,0,.25); overflow:hidden;
          animation:sp-fadein .25s ease;
        }
        .sp-modal-header {
          padding:22px 24px 0;
          display:flex; align-items:center; justify-content:space-between;
        }
        .sp-modal-icon {
          width:40px; height:40px; border-radius:12px;
          background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(139,92,246,.08));
          border:1.5px solid rgba(99,102,241,.2);
          display:flex; align-items:center; justify-content:center;
        }
        .sp-modal-title {
          font-size:15px; font-weight:900; color:var(--sp-text); letter-spacing:-.02em;
        }
        .sp-modal-close {
          width:34px; height:34px; border-radius:10px; border:1.5px solid var(--sp-border);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; background:transparent; color:var(--sp-muted);
          transition:all .2s;
        }
        .sp-modal-close:hover { border-color:var(--sp-accent); color:var(--sp-accent); }
        .sp-modal-body { padding:20px 24px; display:flex; flex-direction:column; gap:18px; }
        .sp-modal-label {
          font-size:10px; font-weight:800; text-transform:uppercase;
          letter-spacing:.08em; color:var(--sp-muted); margin-bottom:8px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .sp-modal-radius-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .sp-modal-r-btn {
          padding:8px 16px; border-radius:11px; border:1.5px solid var(--sp-border);
          background:transparent; font-size:12px; font-weight:700;
          color:var(--sp-muted); cursor:pointer; transition:all .2s;
        }
        .sp-modal-r-btn:hover { border-color:var(--sp-accent); color:var(--sp-accent); }
        .sp-modal-r-btn.active {
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border-color:transparent; color:#fff;
          box-shadow:0 4px 14px rgba(99,102,241,.3);
        }
        .sp-modal-input {
          width:100%; padding:11px 16px; border-radius:12px;
          border:1.5px solid var(--sp-border); background:var(--sp-card);
          font-size:12px; font-weight:500; color:var(--sp-text);
          outline:none; transition:all .2s; box-sizing:border-box;
        }
        .sp-modal-input:focus { border-color:var(--sp-accent); box-shadow:0 0 0 3px var(--sp-glow); }
        .sp-modal-input::placeholder { color:var(--sp-muted); }
        .sp-modal-footer {
          padding:0 24px 24px; display:flex; gap:10px;
        }
        .sp-modal-cancel {
          flex:1; padding:13px; border-radius:14px;
          border:1.5px solid var(--sp-border); background:transparent;
          font-size:12px; font-weight:700; color:var(--sp-muted); cursor:pointer;
          transition:all .2s;
        }
        .sp-modal-cancel:hover { border-color:var(--sp-accent); color:var(--sp-accent); }
        .sp-modal-apply {
          flex:2; padding:13px; border-radius:14px; border:none;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          font-size:12px; font-weight:800; color:#fff; cursor:pointer;
          box-shadow:0 6px 20px rgba(99,102,241,.3); transition:all .2s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .sp-modal-apply:hover { filter:brightness(1.1); transform:translateY(-1px); }
      `}</style>

      <Navbar />

      <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Ambient orbs */}
        <div className="sp-orb sp-orb-1" />
        <div className="sp-orb sp-orb-2" />
        <div className="sp-orb sp-orb-3" />

        {/* ── Hero Header ── */}
        <div className="sp-hero">
          <div className="sp-hero-inner">
            {/* Left: title */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div className="sp-badge">
                <Navigation style={{ width: 11, height: 11 }} />
                <span>Live GPS Perimeter</span>
              </div>
              <h1 className="sp-title">
                Nearby Shops &{' '}
                <span className="sp-title-grad">Map ({radiusKm} km)</span>
              </h1>
              <p className="sp-subtitle">
                Within <strong>{radiusKm} km</strong> of{' '}
                <b>{locationName}</b>{' \u2022 '}
                <span style={{ color: 'var(--sp-text)', fontWeight: 800 }}>
                  {loading
                    ? `Searching within ${radiusKm} km…`
                    : total > 0
                    ? `${total} shops found within ${radiusKm} km`
                    : `No shops found within ${radiusKm} km. Try modifying search radius.`}
                </span>
              </p>

              {/* Location Selector & GPS controls directly under subtitle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={async () => { try { await detectCurrentLocation(true); } catch(_){} }}
                  disabled={isDetectingLocation}
                  className="sp-ctrl-btn sp-ctrl-gps"
                  style={{ padding: '7px 14px' }}
                >
                  <Crosshair
                    style={{ width: 13, height: 13 }}
                    className={isDetectingLocation ? 'sp-spin' : ''}
                  />
                  <span>{isDetectingLocation ? 'Locating…' : 'Use Current GPS'}</span>
                </button>

                {/* Quick Places Switcher Dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={QUICK_PLACES.find(c => locationName?.toLowerCase()?.includes(c.name.toLowerCase()))?.name || ''}
                    onChange={(e) => {
                      const selected = QUICK_PLACES.find(c => c.name === e.target.value);
                      if (selected) {
                        setLocation(selected.lat, selected.lng, selected.name, null, true);
                      }
                    }}
                    className="sp-ctrl-btn"
                    style={{
                      padding: '7px 12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                    title="Quick switch city / place"
                  >
                    <option value="" disabled>📍 Quick Places</option>
                    <optgroup label="📍 Local & Andhra Pradesh">
                      {QUICK_PLACES.filter(p => p.group === 'Local / AP').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🏢 Major Metros">
                      {QUICK_PLACES.filter(p => p.group === 'Major Metros').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div className="sp-controls">
              {/* View mode switcher */}
              <div className="sp-view-group">
                {[
                  { id: 'split', icon: Layers,  label: 'Split' },
                  { id: 'list',  icon: List,    label: 'List'  },
                  { id: 'map',   icon: MapIcon, label: 'Map'   },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className={`sp-view-btn ${viewMode === id ? 'active' : ''}`}
                  >
                    <Icon style={{ width: 13, height: 13 }} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowModifyModal(true)}
                className="sp-ctrl-btn sp-modify-btn"
              >
                <Sliders style={{ width: 13, height: 13 }} />
                <span>Modify Search</span>
              </button>

              <button
                onClick={() => setShowKeyModal(true)}
                className="sp-ctrl-btn"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))',
                  border: '1px solid rgba(99,102,241,0.3)',
                  color: '#6366f1',
                }}
                title="Connect or Update Google Places API Key"
              >
                <Key style={{ width: 13, height: 13 }} />
                <span>Google Maps Key</span>
              </button>
            </div>
          </div>

          {/* ── Tab Bar ── */}
          <div className="sp-tab-wrap">
            <div className="sp-tabs">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const cfg  = TAB_CONFIG[tab.id];
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); navigate(tab.path); }}
                    className={`sp-tab ${isActive ? 'active' : ''}`}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}cc)`,
                    } : {}}
                  >
                    <Icon style={{ width: 13, height: 13, color: isActive ? '#fff' : cfg.color }} />
                    <span>{tab.label}</span>
                    <span
                      className="sp-tab-count"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.22)' : cfg.bg,
                        color: isActive ? '#fff' : cfg.color,
                      }}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Categories Available Within Radius (Requirement 2) ── */}
        {availableCategories.length > 0 && (
          <div style={{ maxWidth: '1280px', margin: '12px auto 0', padding: '0 28px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '6px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--sp-muted)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                📍 Within {radiusKm} km:
              </span>
              <button
                type="button"
                onClick={() => setCategory('')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: !category || category === 'All Categories' ? '1.5px solid var(--sp-accent)' : '1px solid var(--sp-border)',
                  background: !category || category === 'All Categories' ? 'var(--sp-accent)' : 'var(--sp-card)',
                  color: !category || category === 'All Categories' ? '#fff' : 'var(--sp-text)',
                  boxShadow: !category || category === 'All Categories' ? '0 2px 8px var(--sp-glow)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                All Categories ({businesses.length})
              </button>
              {availableCategories.map(([catName, catCount]) => {
                const isCatActive = category === catName;
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setCategory(isCatActive ? '' : catName)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      border: isCatActive ? '1.5px solid var(--sp-accent)' : '1px solid var(--sp-border)',
                      background: isCatActive ? 'var(--sp-accent)' : 'var(--sp-card)',
                      color: isCatActive ? '#fff' : 'var(--sp-text)',
                      boxShadow: isCatActive ? '0 2px 8px var(--sp-glow)' : 'none',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{catName}</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '99px',
                      fontSize: '10px',
                      fontWeight: 900,
                      background: isCatActive ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.12)',
                      color: isCatActive ? '#fff' : 'var(--sp-accent)',
                    }}>
                      {catCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── API Diagnostic Notice ── */}
        {apiError && (
          <div style={{
            maxWidth: '1280px',
            width: 'calc(100% - 56px)',
            margin: '16px auto 0',
            padding: '14px 20px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxSizing: 'border-box',
          }}>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em', background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: 6 }}>
              {errorType || 'API NOTICE'}
            </div>
            <div style={{ flex: 1 }}>{apiError}</div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="sp-main">
          {loading || isDetectingLocation ? (
            <div className="sp-loading-card">
              <LoadingSpinner message={isDetectingLocation ? "Detecting your live GPS location…" : `Searching businesses within ${radiusKm} km radius…`} />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <EmptyState
              title={activeTab !== 'all' ? `No shops found under "${activeTabCfg.label}"` : "No shops found in this radius"}
              description={
                total > 0
                  ? `There are ${total} other shops found in this area. Switch to 'All Shops' or expand your radius to view them.`
                  : `No businesses found within ${radiusKm} km of ${locationName}. Try choosing a quick city above or expanding the search radius.`
              }
              actionLabel={total > 0 && activeTab !== 'all' ? `View All Shops (${total})` : "Expand Radius to 50 km"}
              onAction={() => {
                if (total > 0 && activeTab !== 'all') {
                  setActiveTab('all');
                } else {
                  setRadius(50);
                  searchNearby();
                }
              }}
            />
          ) : (
            <div
              className={`grid gap-6 relative z-10 ${
                viewMode === 'split'
                  ? 'grid-cols-1 lg:grid-cols-12'
                  : 'grid-cols-1'
              }`}
            >
              {/* List Column */}
              {(viewMode === 'split' || viewMode === 'list') && (
                <div
                  className={`${
                    viewMode === 'split'
                      ? 'lg:col-span-6 xl:col-span-5 max-h-[780px] overflow-y-auto space-y-4 pr-2'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  }`}
                >
                  {filteredBusinesses.map((b) => (
                    <BusinessCard
                      key={b.id}
                      business={b}
                      isSelected={selectedBusinessId === b.id}
                      onSelect={() => setSelectedBusinessId(b.id)}
                    />
                  ))}
                </div>
              )}

              {/* Map Column */}
              {(viewMode === 'split' || viewMode === 'map') && (
                <div
                  className={`${
                    viewMode === 'split'
                      ? 'lg:col-span-6 xl:col-span-7 h-[780px] sticky top-20'
                      : 'h-[750px]'
                  }`}
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                    <BusinessMap
                      businesses={filteredBusinesses}
                      userCenter={[latitude, longitude]}
                      radiusKm={radiusKm}
                      selectedId={selectedBusinessId}
                      onMarkerSelect={(id) => setSelectedBusinessId(id)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ═══ Modify Search Modal ═══ */}
      {showModifyModal && (
        <div className="sp-overlay" onClick={e => e.target === e.currentTarget && setShowModifyModal(false)}>
          <div className="sp-modal">
            {/* Header */}
            <div className="sp-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="sp-modal-icon">
                  <Sliders style={{ width: 18, height: 18, color: '#6366f1' }} />
                </div>
                <div>
                  <div className="sp-modal-title">Modify Search</div>
                  <div style={{ fontSize: 11, color: 'var(--sp-muted)', marginTop: 1 }}>
                    Update location, radius &amp; category
                  </div>
                </div>
              </div>
              <button className="sp-modal-close" onClick={() => setShowModifyModal(false)}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Body */}
            <div className="sp-modal-body">
              {/* Location */}
              <div>
                <div className="sp-modal-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin style={{ width: 12, height: 12, color: '#6366f1' }} />
                    Search Center Location
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const pos = await detectCurrentLocation(false);
                        if (pos) {
                          setTempSearchCenter({
                            type: 'gps',
                            latitude: pos.latitude,
                            longitude: pos.longitude,
                            accuracy: pos.accuracy,
                            name: pos.name || 'Current GPS Location',
                            formattedAddress: pos.formattedAddress || '',
                          });
                          setModalKey(k => k + 1);
                        }
                      } catch (_) {}
                    }}
                    disabled={isDetectingLocation}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 700, color: '#6366f1',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <Crosshair
                      style={{ width: 12, height: 12 }}
                      className={isDetectingLocation ? 'sp-spin' : ''}
                    />
                    <span>Use GPS</span>
                  </button>
                </div>
                <GooglePlacesAutocomplete
                  key={modalKey}
                  forceValue={tempSearchCenter?.type === 'gps' ? 'Current GPS Location' : tempSearchCenter?.name || ''}
                  placeholder="Search location or city… e.g. Chennai, Bangalore, Hyderabad"
                  onPlaceSelect={details => setTempSearchCenter(details)}
                />

                {/* Quick Select Places Grid in Modal */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--sp-muted)', marginBottom: 6 }}>
                    ⚡ Quick Select Popular Places:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto', padding: '2px 0' }}>
                    {QUICK_PLACES.map(city => {
                      const isSelected = tempSearchCenter?.name?.toLowerCase()?.includes(city.name.toLowerCase());
                      return (
                        <button
                          key={city.name}
                          type="button"
                          onClick={() => {
                            setTempSearchCenter({
                              type: 'place',
                              latitude: city.lat,
                              longitude: city.lng,
                              name: city.name,
                              formattedAddress: `${city.name}, India`,
                            });
                            setModalKey(k => k + 1);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: isSelected ? '1.5px solid var(--sp-accent)' : '1px solid var(--sp-border)',
                            background: isSelected ? 'var(--sp-accent)' : 'var(--sp-card)',
                            color: isSelected ? '#fff' : 'var(--sp-text)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {city.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Radius */}
              <div>
                <div className="sp-modal-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap style={{ width: 12, height: 12, color: '#6366f1' }} />
                    Search Radius
                  </span>
                  <span style={{ color: '#6366f1', fontSize: 13, fontWeight: 900 }}>{tempRadius} km</span>
                </div>
                <div className="sp-modal-radius-grid">
                  {PRESET_DISTANCES.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTempRadius(d)}
                      className={`sp-modal-r-btn ${tempRadius === d ? 'active' : ''}`}
                    >
                      {d < 1 ? `${d * 1000} m` : `${d} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="sp-modal-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Store style={{ width: 12, height: 12, color: '#6366f1' }} />
                    Category
                  </span>
                </div>
                <select
                  value={tempCategory}
                  onChange={e => setTempCategory(e.target.value)}
                  className="sp-modal-input"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Keyword */}
              <div>
                <div className="sp-modal-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Search style={{ width: 12, height: 12, color: '#6366f1' }} />
                    Keyword <span style={{ fontWeight: 500, textTransform: 'none' }}>(optional)</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={tempKeyword}
                  onChange={e => setTempKeyword(e.target.value)}
                  placeholder="e.g. Organic, Tailor, Medical…"
                  className="sp-modal-input"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sp-modal-footer">
              <button className="sp-modal-cancel" onClick={() => setShowModifyModal(false)}>
                Cancel
              </button>
              <button className="sp-modal-apply" onClick={handleApplyModify}>
                <Search style={{ width: 14, height: 14 }} />
                Apply Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps API Key Modal */}
      <GoogleMapsConnectModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onConnected={() => {
          searchNearby().catch(() => {});
        }}
      />

      {/* Bulk AI WhatsApp Broadcast Modal */}
      <BulkWhatsAppBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        shops={broadcastTargetList}
        onBroadcastComplete={() => {
          // Trigger search update or any required refresh
        }}
      />

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
