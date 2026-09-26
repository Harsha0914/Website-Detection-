import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Star,
  Globe,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Navigation,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { WebsiteStatusBadge } from './WebsiteStatusBadge';
import { formatDistance, estimateRoadDistance, estimateDriveTime } from '../../services/distanceService';
import { useShopStore } from '../../store/shopStore';
import { getGoogleMapsUrl, getGoogleMapsDirectionsUrl } from '../../services/locationService';
import { getWhatsAppUrl, launchWhatsAppApp } from '../../services/whatsappService';
import WhatsAppLaunchModal from '../chat/WhatsAppLaunchModal';

const CATEGORY_IMAGES = {
  'Grocery Store': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80&auto=format&fit=crop',
  'Supermarket': 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80&auto=format&fit=crop',
  'General Store': 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=500&q=80&auto=format&fit=crop',
  'Pharmacy': 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&q=80&auto=format&fit=crop',
  'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80&auto=format&fit=crop',
  'Clothing Store': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&q=80&auto=format&fit=crop',
  'Tailor': 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80&auto=format&fit=crop',
  'Electronics Store': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=500&q=80&auto=format&fit=crop',
  'Mobile Phones': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80&auto=format&fit=crop',
  'Restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80&auto=format&fit=crop',
  'Cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80&auto=format&fit=crop',
  'Beauty Salon': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80&auto=format&fit=crop',
  'Gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&q=80&auto=format&fit=crop',
  'Auto Repair': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&q=80&auto=format&fit=crop',
  'Hardware Store': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=500&q=80&auto=format&fit=crop',
  'Jewelry': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80&auto=format&fit=crop',
  'Footwear': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80&auto=format&fit=crop',
  'Book Store': 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&q=80&auto=format&fit=crop',
  'Furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&q=80&auto=format&fit=crop',
  'Pet Store': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500&q=80&auto=format&fit=crop',
  'Department Store': 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&q=80&auto=format&fit=crop',
  'Shopping Mall': 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=500&q=80&auto=format&fit=crop',
};

const getBusinessPhoto = (business) => {
  if (business.photo_url) return business.photo_url;
  return CATEGORY_IMAGES[business.category] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80&auto=format&fit=crop';
};

export function BusinessCard({ business, onSelect, isSelected = false }) {
  const { userGps } = useShopStore();
  const hasWebsite = business.website_status === 'WEBSITE_AVAILABLE';
  const shopPhoto = getBusinessPhoto(business);
  const [showWAModal, setShowWAModal] = useState(false);

  // Exact Google Maps location link (pinned at coordinates with label)
  const googleMapsUrl = getGoogleMapsUrl(business);

  // Directions from user's live device location / GPS to business location
  const directionsUrl = getGoogleMapsDirectionsUrl(business, userGps);

  // Direct WhatsApp contact URL
  const whatsAppUrl = getWhatsAppUrl(business);

  const displayAddress = business.address || business.short_address;

  return (
  <>
    <div
      onClick={onSelect}
      className={`group relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden shrink-0 ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/25 shadow-xl shadow-blue-500/10 scale-[1.01]'
          : 'border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md dark:hover:shadow-slate-950/60'
      }`}
    >
      {/* Top photo banner */}
      <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={shopPhoto}
          alt={business.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Floating Category and Distance badges over photo */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm ${
              hasWebsite
                ? 'bg-emerald-600/90 text-white'
                : 'bg-rose-600/90 text-white'
            }`}
          >
            {business.category || 'Local Shop'}
          </span>
          {business.distance_km != null && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-slate-900/85 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-sm"
              title={`Distance: ${formatDistance(business.distance_km)} | Drive time: ~${estimateDriveTime(business.distance_km)}`}
            >
              <Navigation className="w-3 h-3 text-blue-400" />
              <span>{formatDistance(business.distance_km)}</span>
              <span className="text-slate-300/80 text-[9px] font-normal">| ~{estimateDriveTime(business.distance_km)}</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-4">

        {/* Shop Name (clickable to Google Maps directly) + Exact Calculated Distance */}
        <div className="flex flex-wrap items-baseline justify-between gap-1 mb-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Open ${business.name} in Google Maps`}
            className="text-base font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug tracking-tight hover:underline"
          >
            {business.name}
          </a>
          {business.distance_km != null && (
            <span
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 shrink-0"
              title={`Direct distance from search center: ${formatDistance(business.distance_km)}`}
            >
              — {formatDistance(business.distance_km)}
            </span>
          )}
        </div>

        {/* Real Address (clickable to Google Maps) */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 group/addr"
          title="Open in Google Maps"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span className="line-clamp-2 underline decoration-slate-300 dark:decoration-slate-700 group-hover/addr:decoration-blue-500 font-medium leading-relaxed">
            {displayAddress || 'View Location on Google Maps →'}
          </span>
        </a>

        {/* Phone */}
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-3"
          >
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="font-medium">{business.phone}</span>
          </a>
        )}

        {/* Rating + Website Status Row */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {business.rating ? (
              <>
                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50 dark:border-amber-900/40">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {business.rating.toFixed(1)}
                  </span>
                </div>
                {business.review_count != null && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    ({business.review_count})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Not available</span>
            )}
          </div>

          <WebsiteStatusBadge
            status={business.website_status}
            score={business.website_score}
            quality={business.website_quality}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Directions / Open in Maps Button */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950/80 border border-blue-200/60 dark:border-blue-900/50 rounded-xl transition-all shadow-2xs"
            title={`Get driving directions to ${business.name} on Google Maps`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
          </a>

          {/* Direct WhatsApp Contact Button – opens template modal */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowWAModal(true);
            }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
              !hasWebsite
                ? 'text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                : 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
            }`}
            title={!hasWebsite ? `Send a WhatsApp pitch to ${business.name} (Lexon IT)` : `Chat with ${business.name} on WhatsApp`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
            <span>{!hasWebsite ? '⚡ Send WhatsApp Pitch' : 'WhatsApp'}</span>
          </button>

        {hasWebsite ? (
          <>
            {business.website_url && (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Visit</span>
              </a>
            )}
          </>
        ) : null}

        <Link
          to={`/shop/${business.id}`}
          onClick={(e) => e.stopPropagation()}
          title="View full audit & details"
          className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>

  {/* WhatsApp Launch Modal */}
  <WhatsAppLaunchModal
    business={business}
    isOpen={showWAModal}
    onClose={() => setShowWAModal(false)}
  />
  </>
  );
}

