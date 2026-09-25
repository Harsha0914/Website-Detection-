/**
 * searchMatcher.js
 * Comprehensive semantic dictionary and matcher for categories, items, keywords, and prefixes.
 */

export const CATEGORY_ITEM_KEYWORDS = {
  'Restaurant': [
    'restaurant', 'restaurants', 'resu', 'rest', 'resta', 'restaur', 'dining', 'dine', 'food',
    'dhaba', 'dhabas', 'hotel', 'hotels', 'bhojanalaya', 'mess', 'canteen', 'curry point',
    'biryani', 'biriyani', 'mandi', 'mandhi', 'shawarma', 'kebab', 'kabab', 'grill', 'tandoori',
    'pizza', 'pizzeria', 'burger', 'burgers', 'sandwich', 'fast food', 'tiffin', 'tiffins',
    'meals', 'veg', 'non veg', 'chinese', 'south indian', 'north indian', 'eatery', 'kitchen',
    'bistro', 'bawarchi', 'paradise', 'kfc', 'dominos', 'subway', 'burger king', 'haldiram'
  ],
  'Cafe': [
    'cafe', 'cafes', 'coffee', 'coffee shop', 'tea', 'tea stall', 'tea point', 'chai',
    'chai point', 'beverages', 'juice', 'juice center', 'shake', 'shakes', 'smoothie',
    'starbucks', 'ccd', 'costa', 'dunkin'
  ],
  'Bakery': [
    'bakery', 'bakeries', 'bake', 'bakes', 'bakers', 'bak', 'cake', 'cakes', 'pastry',
    'pastries', 'sweet', 'sweets', 'sweet shop', 'sweet house', 'mithai', 'confectionery',
    'chocolate', 'chocolates', 'cookie', 'cookies', 'biscuit', 'biscuits', 'puff', 'puffs',
    'ice cream', 'ice cream parlour', 'dessert', 'desserts', 'cakezone', 'karachi bakery', 'theobroma'
  ],
  'Meat & Poultry': [
    'meat', 'poultry', 'chicken', 'fresh chicken', 'chicken centre', 'chicken center',
    'chicken shop', 'chicken mart', 'chicken stall', 'mutton', 'mutton shop', 'mutton centre',
    'mutton center', 'mutton mart', 'fish', 'fish market', 'fish shop', 'seafood', 'prawns',
    'crabs', 'egg', 'eggs', 'egg center', 'butcher', 'broiler', 'vencobb', 'live fish'
  ],
  'Grocery Store': [
    'grocery', 'groceries', 'groc', 'kirana', 'kiranam', 'provisions', 'provision',
    'general store', 'daily needs', 'ration', 'vegetables', 'vegetable shop', 'fruits',
    'fruit stall', 'milk', 'dairy', 'dairy parlour', 'curd', 'paneer', 'rice', 'rice depot',
    'flour mill', 'atta', 'oil', 'oil depot', 'spices', 'dry fruits', 'nuts', 'organic store',
    'patanjali', 'heritage', 'big basket', 'zepto', 'blinkit', 'dunzo'
  ],
  'Supermarket': [
    'supermarket', 'supermarkets', 'super', 'superm', 'hypermarket', 'hypermarkets',
    'super mart', 'super market', 'super bazar', 'super bazaar', 'mart', 'marts',
    'dmart', 'd-mart', 'reliance smart', 'smart point', 'more supermarket', 'ratnadeep',
    'spencer', 'spar hypermarket'
  ],
  'Department Store': [
    'department store', 'department stores', 'departmental store', 'dept store', 'variety store'
  ],
  'Shopping Mall': [
    'shopping mall', 'shopping malls', 'mall', 'malls', 'shopping complex', 'commercial complex',
    'arcade', 'plaza', 'galleria'
  ],
  'Pharmacy': [
    'pharmacy', 'pharmacies', 'phar', 'pharm', 'pharma', 'medical', 'medicals', 'medical store',
    'medicine', 'medicines', 'chemist', 'druggist', 'drugstore', 'drug store', 'drugs',
    'tablets', 'capsules', 'syrup', 'ointment', 'first aid', 'health store', 'surgicals',
    'apollo pharmacy', 'medplus', 'netmeds', '1mg', 'diagnostics', 'clinic', 'pathology'
  ],
  'Clothing Store': [
    'clothing', 'clothing store', 'cloth', 'clothes', 'garments', 'garment', 'apparel',
    'fashion', 'textiles', 'textile', 'dresses', 'dress', 'sarees', 'saree', 'silks', 'silk',
    'mens wear', 'kids wear', 'ladies wear', 'shirts', 'shirt', 'pants', 'pant', 'jeans',
    't-shirts', 'trousers', 'ethnic wear', 'boutique', 'trends', 'max fashion', 'zudio',
    'manyavar', 'decathlon', 'lenskart'
  ],
  'Tailor': [
    'tailor', 'tailors', 'tailoring', 'tail', 'master tailor', 'stitching', 'alteration',
    'blouse stitching', 'suit tailoring', 'raymond tailor'
  ],
  'Footwear': [
    'footwear', 'foot', 'shoes', 'shoe', 'shoe store', 'chappal', 'chappals', 'sandals',
    'sandal', 'slippers', 'slipper', 'boots', 'sneakers', 'leather works', 'bata', 'woodland',
    'khadim', 'paragon', 'relaxo', 'red tape', 'metro shoes', 'mochi'
  ],
  'Jewelry': [
    'jewelry', 'jewellery', 'jewel', 'jewels', 'jewellers', 'jeweller', 'gold', 'silver',
    'diamond', 'diamonds', 'platinum', 'gold ornaments', 'necklace', 'bangles', 'rings',
    'earrings', 'kalyan jewellers', 'tanishq', 'malabar gold', 'joyalukkas', 'lalitha jewellery'
  ],
  'Mobile Phones': [
    'mobile', 'mobiles', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones',
    'smartphone', 'smartphones', 'phone store', 'mobile store', 'mobile care', 'accessories',
    'recharge', 'screen guard', 'back cover', 'charger', 'poorvika', 'sangeetha', 'lotus mobiles'
  ],
  'Electronics Store': [
    'electronics', 'electronic', 'electronics store', 'elec', 'elect', 'computers', 'computer',
    'laptop', 'laptops', 'tv', 'television', 'refrigerator', 'fridge', 'washing machine',
    'ac', 'air conditioner', 'cooler', 'appliances', 'home appliances', 'cctv', 'printers',
    'croma', 'vijay sales', 'reliance digital'
  ],
  'Beauty Salon': [
    'beauty salon', 'beauty parlour', 'beauty parlor', 'salon', 'salons', 'sal', 'saloon',
    'saloons', 'spa', 'spas', 'hair salon', 'hairdresser', 'hair style', 'barber', 'barbers',
    'barber shop', 'haircut', 'facial', 'makeup', 'bridal makeup', 'pedicure', 'manicure',
    'naturals', 'green trends', 'jawed habib', 'enrich', 'toni & guy', 'urban company'
  ],
  'Gym': [
    'gym', 'gyms', 'fitness', 'fit', 'fitness centre', 'fitness center', 'health club',
    'workout', 'bodybuilding', 'crossfit', 'cult fit', 'golds gym', 'anytime fitness', 'slam fitness'
  ],
  'Auto Repair': [
    'auto repair', 'auto', 'car repair', 'car service', 'bike repair', 'bike service',
    'mechanic', 'garage', 'puncture', 'tyres', 'tyre', 'tire', 'tires', 'wheel alignment',
    'oil change', 'water wash', 'car wash', 'auto parts', 'spare parts', 'bosch car service',
    'castrol', 'mrf', 'apollo tyres', 'ceat', 'royal enfield service', 'maruti service', 'hero service'
  ],
  'Hardware Store': [
    'hardware', 'hardware store', 'hard', 'electricals', 'electrical', 'lighting', 'paints',
    'paint', 'asian paints', 'cement', 'steel', 'pipes', 'pipe', 'plumbing', 'sanitary',
    'plywood', 'glass', 'tiles', 'tools', 'building materials'
  ],
  'Furniture': [
    'furniture', 'furn', 'furniture store', 'furnishing', 'sofa', 'bed', 'cot', 'dining table',
    'chair', 'chairs', 'table', 'cupboard', 'almirah', 'mattress', 'curtains', 'interior decor',
    'godrej interio', 'nilkamal', 'home centre', 'pepperfry', 'ikea'
  ],
  'Book Store': [
    'book store', 'book', 'books', 'stationery', 'stationery store', 'book depot', 'book stall',
    'notebooks', 'pens', 'school books', 'college books', 'xerox', 'photocopy', 'printing',
    'gift shop', 'gifts', 'novelties', 'crossword', 'sapna book house', 'archies'
  ],
  'Pet Store': [
    'pet store', 'pet', 'pets', 'dog food', 'cat food', 'aquarium', 'birds', 'pet clinic',
    'pet grooming', 'pet supplies'
  ]
};

/**
 * Resolves a keyword/prefix to matching canonical category names.
 */
export function resolveKeywordToCategories(keyword) {
  if (!keyword || typeof keyword !== 'string') return [];
  const kw = keyword.trim().toLowerCase();
  if (!kw || ['all', 'all categories', 'all shops', 'none', 'null'].includes(kw)) return [];

  const matched = [];
  for (const [catName, kwList] of Object.entries(CATEGORY_ITEM_KEYWORDS)) {
    for (const term of kwList) {
      if (kw === term || kw.startsWith(term) || term.startsWith(kw) || (kw.length >= 3 && term.includes(kw))) {
        if (!matched.includes(catName)) {
          matched.push(catName);
        }
        break;
      }
    }
  }
  return matched;
}

/**
 * Checks if a business object matches a selected category and/or search keyword.
 */
export function isBusinessMatching(business, keyword, selectedCategory) {
  if (!business) return false;

  const shopCat = (business.category || '').toLowerCase().trim();
  const shopName = (business.name || '').toLowerCase().trim();
  const shopAddr = (business.address || business.short_address || '').toLowerCase().trim();

  // 1. Direct Category Match if selected
  if (selectedCategory && selectedCategory !== 'All Categories') {
    const targetCat = selectedCategory.toLowerCase().trim();

    if (targetCat === 'restaurant' || targetCat.includes('restaurant')) {
      if (!['restaurant', 'family restaurant', 'fast food restaurant'].includes(shopCat)) return false;
    } else if (targetCat === 'beauty salon' || targetCat.includes('salon') || targetCat.includes('spa') || targetCat.includes('barber')) {
      if (!['beauty salon', 'hair salon', 'barber shop', 'spa'].includes(shopCat)) return false;
    } else if (targetCat === 'bakery' || targetCat.includes('bakery')) {
      if (!['bakery', 'pastry shop'].includes(shopCat)) return false;
    } else if (targetCat === 'supermarket' || targetCat.includes('supermarket')) {
      if (!['supermarket', 'hypermarket'].includes(shopCat)) return false;
    } else if (targetCat === 'grocery store' || targetCat.includes('grocery') || targetCat.includes('general store')) {
      if (!['grocery store', 'general store', 'convenience store'].includes(shopCat)) return false;
    } else if (targetCat === 'pharmacy' || targetCat.includes('pharmacy') || targetCat.includes('medical')) {
      if (!['pharmacy', 'drugstore'].includes(shopCat)) return false;
    } else if (targetCat === 'cafe' || targetCat.includes('cafe')) {
      if (!['cafe', 'coffee shop'].includes(shopCat)) return false;
    } else if (targetCat === 'meat & poultry' || targetCat.includes('meat') || targetCat.includes('poultry') || targetCat.includes('chicken') || targetCat.includes('mutton') || targetCat.includes('fish')) {
      if (!['meat & poultry', 'meat shop'].includes(shopCat)) return false;
    } else {
      if (shopCat !== targetCat && !shopCat.includes(targetCat) && !targetCat.includes(shopCat)) return false;
    }
  }

  // 2. Keyword check if provided
  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
    return true;
  }

  const kw = keyword.trim().toLowerCase();
  if (['all', 'all categories', 'all shops', 'none', 'null'].includes(kw)) {
    return true;
  }

  // Substring match on name or address
  if (shopName.includes(kw) || shopAddr.includes(kw)) {
    return true;
  }

  // Substring or prefix match on category
  if (shopCat.includes(kw) || shopCat.startsWith(kw) || kw.startsWith(shopCat)) {
    return true;
  }

  // Category resolution from keyword (e.g. 'resu' matches 'Restaurant', 'pizza' matches 'Restaurant')
  const matchedCats = resolveKeywordToCategories(kw);
  for (const mc of matchedCats) {
    const mcLower = mc.toLowerCase();
    if (shopCat.includes(mcLower) || mcLower.includes(shopCat)) {
      return true;
    }
  }

  return false;
}
