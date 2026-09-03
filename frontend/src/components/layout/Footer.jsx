import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Globe, Shield, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 - Brand */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="p-1.5 bg-brand-600 rounded-lg text-white">
                <Store className="w-5 h-5" />
              </div>
              <span>Website<span className="text-brand-400"> Presence Detection</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering local businesses and grocery stores to discover their digital presence, enhance website quality, and connect with nearby customers.
            </p>
          </div>

          {/* Col 2 - Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Col 3 - Platform */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Discovery</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Nearby Grocery Search</Link></li>
              <li><Link to="/shops/websites" className="hover:text-white transition-colors">Shops With Websites</Link></li>
              <li><Link to="/shops/no-websites" className="hover:text-white transition-colors">Shops Without Websites</Link></li>
              <li><Link to="/shops/good-websites" className="hover:text-white transition-colors">High Quality Websites</Link></li>
            </ul>
          </div>

          {/* Col 4 - Account & Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-white transition-colors">Admin Portal</Link></li>
              <li><span className="text-slate-500">Privacy Policy</span></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ShopPresence Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision for local commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
