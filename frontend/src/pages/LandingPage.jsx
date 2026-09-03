import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
  MapPin,
  Sliders,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Send,
  User,
  Zap,
  LogIn,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useAuthStore } from '../store/authStore';
import { GooglePlacesAutocomplete } from '../components/location/GooglePlacesAutocomplete';
import { useShopStore } from '../store/shopStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { setSearchCenterFromPlace, searchNearby } = useShopStore();

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  const handleHeroSearchSubmit = (e) => {
    e?.preventDefault?.();
    searchNearby();
    navigate('/shops');
  };

  const handlePlaceSelect = (details) => {
    setSearchCenterFromPlace(details);
    searchNearby();
    navigate('/shops');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 pb-mobile-nav md:pb-0">
      <Navbar />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section id="search" className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 pt-14 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Discover Nearby Shops &amp; Check Their <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Website Presence</span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Find grocery stores, retail shops, and local businesses near your location. Audit website quality, check digital presence, and connect directly with shop owners — powered by <span className="font-bold text-slate-900 dark:text-white">Lexon IT</span>.
          </p>

          {/* Quick Action Navigation CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>Go to User Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/shops"
                  className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs"
                >
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Browse All Shops</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started / Register</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-xs"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>

          {/* Integrated Location Search Box */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-500/5 dark:shadow-none max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex-1">
                <GooglePlacesAutocomplete
                  placeholder="Search by city, location, or locality... e.g. HITEC City, Hyderabad"
                  onPlaceSelect={handlePlaceSelect}
                />
              </div>
              <button
                type="button"
                onClick={handleHeroSearchSubmit}
                className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search Shops</span>
              </button>
            </div>
          </div>

          {/* Trust badges below search */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>1,200+ verified listings</span>
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-500" />
              <span>50,000+ shops detected</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Direct Lexon IT WhatsApp</span>
            </span>
          </div>

        </div>
      </section>

      {/* ─── Categories Section (#categories) ──────────────────────────────── */}
      <section id="categories" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Explore Categorized Shops</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              Browse Shops By Digital Presence
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Filter local stores based on active websites, quality scores, and custom design opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1: Shops Having Websites */}
            <div
              onClick={() => navigate('/shops/websites')}
              className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-emerald-600 transition-colors">
                Shops Having Websites
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Explore local merchants with live standalone websites and view digital quality metrics.
              </p>
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1">
                <span>View Live Websites</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Category 2: Shops Without Websites */}
            <div
              onClick={() => navigate('/shops/no-websites')}
              className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-rose-600 transition-colors">
                Shops Without Websites
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Identify offline stores missing a website and connect directly via Lexon IT WhatsApp.
              </p>
              <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 gap-1">
                <span>Suggest Website</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Category 3: Needs Improvement */}
            <div
              onClick={() => navigate('/shops/needs-improvement')}
              className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-amber-600 transition-colors">
                Needs Improvement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Websites with lower performance or missing mobile optimization ready for redesign.
              </p>
              <span className="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 gap-1">
                <span>Improve Website</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>

            {/* Category 4: Good Quality Websites */}
            <div
              onClick={() => navigate('/shops/good-websites')}
              className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 group-hover:text-blue-600 transition-colors">
                Good Quality Websites
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Top-tier local websites scoring 80+ in security, mobile responsiveness, and SEO.
              </p>
              <span className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 gap-1">
                <span>View Top Quality</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services Section (#services) ─────────────────────────────────── */}
      <section id="services" className="py-20 bg-slate-50/80 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Lexon IT Web Services</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              End-to-End Digital Solutions For Local Businesses
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              We guarantee 100% customer satisfaction with modern website development and local SEO.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Custom Web Development</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bespoke mobile-first websites tailored for retail stores, grocery shops, and pharmacies with 100% customer satisfaction guarantee.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Google Places &amp; Local SEO</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Optimize your shop's Google Maps pin, address details, and search visibility so nearby customers find you instantly.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-7 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">WhatsApp Ordering &amp; Outreach</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect your business directly to customer WhatsApp chats for instant product inquiries, orders, and customer support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── About Section (#about) ────────────────────────────────────────── */}
      <section id="about" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">About Lexon IT</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bridging The Digital Divide For Neighborhood Shops
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            While major e-commerce platforms dominate search results, millions of essential neighborhood grocery stores and local merchants remain offline. <span className="font-bold text-slate-900 dark:text-white">Lexon IT</span> was founded to empower local merchants with automated website presence detection, quality auditing, and direct WhatsApp outreach — delivering 100% satisfaction to every client.
          </p>
        </div>
      </section>

      {/* ─── CTA Registration / Login Section ────────────────────────────── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Join 1,200+ Verified Stores</span>
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Ready to Check Local Store Websites or Register Your Business?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Create your account today to search full shop listings, run website audits, and connect with business owners directly through Lexon IT.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-black text-xs rounded-xl shadow-xl shadow-slate-950/20 transition-all flex items-center gap-2 active:scale-95"
              >
                <span>Go to User Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-black text-xs rounded-xl shadow-xl shadow-slate-950/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Create Account / Register</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 bg-blue-700/60 hover:bg-blue-700 text-white border border-white/25 font-black text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Contact Section (#contact) ────────────────────────────────────── */}
      <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Get In Touch</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">Contact Lexon IT</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Have a question or want to upgrade your shop's online presence? Drop us a message.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {contactSubmitted ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 text-center text-xs font-semibold">
                ✓ Thank you for reaching out to Lexon IT! We have received your message and will respond shortly.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell Lexon IT how we can help your local business..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Message to Lexon IT</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
