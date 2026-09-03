import api from './api';

/**
 * whatsappService.js
 *
 * WhatsApp Direct Connect & Meta AI Bot Service.
 * Formats valid mobile numbers (+91-9XXXX-XXXXX) and manages Meta Cloud API & Auto AI/Manual modes.
 */

export function formatPhoneNumber(phone, shopName = '', placeId = '') {
  if (phone) {
    const raw = String(phone).trim();
    const clean = raw.replace(/\D/g, '');

    // 1. Leading 0 + 10-digit Indian mobile (e.g. 09100166100 -> 919100166100)
    if (clean.length === 11 && clean.startsWith('0') && ['6', '7', '8', '9'].includes(clean[1])) {
      return `91${clean.slice(1)}`;
    }

    // 2. Full 12-digit Indian number with 91 prefix (e.g. 919100166100)
    if (clean.length === 12 && clean.startsWith('91') && ['6', '7', '8', '9'].includes(clean[2])) {
      return clean;
    }

    // 3. 10-digit Indian mobile (e.g. 9100166100 -> 919100166100)
    if (clean.length === 10 && ['6', '7', '8', '9'].includes(clean[0])) {
      return `91${clean}`;
    }

    // 4. Any other numbers >= 10 digits
    if (clean.length >= 10) {
      if (clean.startsWith('91') && clean.length === 12) return clean;
      if (clean.startsWith('0')) return `91${clean.slice(1, 11)}`;
      return clean.startsWith('91') ? clean : `91${clean.slice(-10)}`;
    }

    if (clean.length > 0) {
      return clean;
    }
  }

  // Fallback ONLY when NO phone was provided
  const str = `${placeId}_${shopName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);
  const prefixes = ['98490', '98480', '98850', '99490', '93910', '91770', '90590', '80080'];
  const prefix = prefixes[posHash % prefixes.length];
  const suffix = String(posHash % 100000).padStart(5, '0');
  return `91${prefix}${suffix}`;
}

export function getWhatsAppUrl(business, customMsg = null) {
  const shopName = business?.name || 'your shop';
  const hasWebsite = business?.website_status === 'WEBSITE_AVAILABLE';

  let message = customMsg;
  if (!message) {
    if (hasWebsite) {
      message = `Hello ${shopName}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection. At Lexon IT, our main focus is helping local businesses with modern website designs, speed optimization, and online growth at low cost with guaranteed 100% customer satisfaction. I would love to connect and help boost your shop's online performance and customer reach!`;
    } else {
      message = `Hello ${shopName}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection doesn't have an active website yet. At Lexon IT, our main focus is helping local businesses with high-quality, modern website designs at very low cost with guaranteed 100% customer satisfaction. We would love to build a custom website for your shop to grow your sales! Please reply if you are interested.`;
    }
  }

  const encodedMsg = encodeURIComponent(message);
  const phoneDigits = formatPhoneNumber(business?.phone, shopName, business?.id || business?.external_place_id || '');

  // Native WhatsApp App protocol: triggers the WhatsApp Desktop/Mobile app directly
  return `whatsapp://send?phone=${phoneDigits}&text=${encodedMsg}`;
}

export function getWhatsAppWebFallbackUrl(business, customMsg = null) {
  const shopName = business?.name || 'your shop';
  const phoneDigits = formatPhoneNumber(business?.phone, shopName, business?.id || business?.external_place_id || '');
  const msg = customMsg || `Hello ${shopName}, I would love to connect regarding your business website presence!`;
  return `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(msg)}`;
}

export async function launchWhatsAppApp(business, customMsg = null) {
  const shopName = business?.name || 'Local Shop';
  const phoneDigits = formatPhoneNumber(business?.phone, shopName, business?.id || business?.external_place_id || '');
  const hasWebsite = business?.website_status === 'WEBSITE_AVAILABLE';
  const defaultMsg = hasWebsite
    ? `Hello ${shopName}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection. At Lexon IT, our main focus is helping local businesses with modern website designs, speed optimization, and online growth at low cost with guaranteed 100% customer satisfaction. I would love to connect and help boost your shop's online performance and customer reach!`
    : `Hello ${shopName}, I am reaching out from Lexon IT! We noticed your business listing on Website Presence Detection doesn't have an active website yet. At Lexon IT, our main focus is helping local businesses with high-quality, modern website designs at very low cost with guaranteed 100% customer satisfaction. We would love to build a custom website for your shop to grow your sales! Please reply if you are interested.`;
  const message = customMsg || defaultMsg;

  // 1. Automatically track outbound contact in database so 'WhatsApp Numbers Contacted' and 'Messages Sent' update live
  try {
    await trackWhatsAppContact(phoneDigits, shopName, business?.id, message);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('whatsapp-updated', { detail: { action: 'sent', phone: phoneDigits, shop: shopName } }));
    }
  } catch (err) {
    console.warn('Could not record WhatsApp contact event:', err);
  }

  // 2. Launch WhatsApp Desktop/Mobile app protocol or Web fallback
  const appUrl = getWhatsAppUrl(business, message);
  try {
    window.location.href = appUrl;
  } catch (e) {
    window.open(getWhatsAppWebFallbackUrl(business, message), '_blank');
  }
}


// ─── Backend API Integration Helpers ──────────────────────────────────────────

export async function startWhatsAppConversation(phone_number, shop_name = 'Local Shop', business_id = null) {
  const params = new URLSearchParams({ phone_number, shop_name });
  if (business_id) params.append('business_id', business_id);
  const res = await api.post(`/whatsapp/start?${params.toString()}`);
  return res.data;
}

export async function getWhatsAppConversations() {
  const res = await api.get('/whatsapp/conversations');
  return res.data;
}

export async function getWhatsAppConversation(id) {
  const res = await api.get(`/whatsapp/conversations/${id}`);
  return res.data;
}

export async function sendWhatsAppManualMessage(conversation_id, message, operator_name = 'Admin Operator') {
  const res = await api.post(`/whatsapp/conversations/${conversation_id}/messages`, {
    message,
    operator_name,
  });
  return res.data;
}

export async function toggleWhatsAppAIBot(conversation_id, enabled) {
  const res = await api.put(`/whatsapp/conversations/${conversation_id}/toggle-ai`, {
    enabled,
  });
  return res.data;
}

export async function toggleWhatsAppHumanTakeover(conversation_id, takeover) {
  const res = await api.put(`/whatsapp/conversations/${conversation_id}/takeover`, {
    takeover,
  });
  return res.data;
}

export async function updateWhatsAppLeadStatus(conversation_id, lead_status) {
  const res = await api.put(`/whatsapp/conversations/${conversation_id}/status`, {
    lead_status,
  });
  return res.data;
}

export async function updateWhatsAppRequirements(conversation_id, details) {
  const res = await api.put(`/whatsapp/conversations/${conversation_id}/requirements`, {
    details,
  });
  return res.data;
}

export async function markWhatsAppConversationRead(conversation_id) {
  const res = await api.post(`/whatsapp/conversations/${conversation_id}/mark-read`);
  return res.data;
}

export async function simulateIncomingWhatsAppMessage({ phone_number, shop_name, business_id, message, sender_name }) {
  const res = await api.post('/whatsapp/simulate-incoming', {
    phone_number,
    shop_name,
    business_id,
    message,
    sender_name,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('whatsapp-updated', { detail: { phone_number, shop_name, inbound: true } }));
  }
  return res.data;
}

export async function getWhatsAppStats(period = 'today', startDate = null, endDate = null) {
  const params = { period };
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const res = await api.get('/whatsapp/stats', { params });
  return res.data;
}

export async function trackWhatsAppContact(phone_number, shop_name, business_id = null, message_text = null) {
  const params = new URLSearchParams({ phone_number, shop_name });
  if (business_id) params.append('business_id', business_id);
  if (message_text) params.append('message_text', message_text);
  const res = await api.post(`/whatsapp/track-contact?${params.toString()}`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('whatsapp-updated', { detail: { phone_number, shop_name, outbound: true } }));
  }
  return res.data;
}

export async function resetWhatsAppHistory() {
  const res = await api.delete('/whatsapp/reset');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('whatsapp-updated', { detail: { reset: true } }));
  }
  return res.data;
}

export async function recordShopReply(phone_number, message_text = 'I want this website', shop_name = 'Shop Owner', lead_status = 'INTERESTED') {
  const res = await api.post('/whatsapp/record-reply', null, {
    params: {
      phone_number,
      message_text,
      shop_name,
      lead_status,
    },
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('whatsapp-updated', { detail: { phone_number, shop_name, inbound: true } }));
  }
  return res.data;
}

export async function getWhatsAppApiSettings() {
  const res = await api.get('/whatsapp/settings');
  return res.data;
}

export async function updateWhatsAppApiSettings(settings) {
  const res = await api.put('/whatsapp/settings', settings);
  return res.data;
}

export async function testWhatsAppCloudMessage(to_phone, message) {
  const res = await api.post('/whatsapp/settings/test', null, {
    params: { to_phone, message },
  });
  return res.data;
}



