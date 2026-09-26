/**
 * searchMatcher.js
 * Comprehensive semantic dictionary and matcher for categories, items, keywords, and prefixes.
 */

export const CATEGORY_ITEM_KEYWORDS = {
  'Restaurant': [
    'restaurant', 'restaurants', 'restuarnt', 'resturant', 'restaurent', 'restarant', 'restuarant',
    'restaren', 'restuarent', 'rastaurant', 'resu', 'rest', 'resta', 'restaur', 'dining', 'dine', 'food',
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
    'bakery', 'bakeries', 'bake', 'bakes', 'bakers', 'bak', 'bekery', 'bekary', 'bekari', 'bakri',
    'cake', 'cakes', 'pastry', 'pastries', 'sweet', 'sweets', 'sweet shop', 'sweet house', 'mithai',
    'swits', 'confectionery', 'chocolate', 'chocolates', 'cookie', 'cookies', 'biscuit', 'biscuits',
    'puff', 'puffs', 'ice cream', 'ice cream parlour', 'dessert', 'desserts', 'cakezone', 'karachi bakery', 'theobroma'
  ],
  'Meat & Poultry': [
    'meat', 'poultry', 'chicken', 'fresh chicken', 'chicken centre', 'chicken center',
    'chicken shop', 'chicken mart', 'chicken stall', 'mutton', 'mutton shop', 'mutton centre',
    'mutton center', 'mutton mart', 'fish', 'fish market', 'fish shop', 'seafood', 'prawns',
    'crabs', 'egg', 'eggs', 'egg center', 'butcher', 'broiler', 'vencobb', 'live fish'
  ],
  'Grocery Store': [
    'grocery', 'groceries', 'grocerry', 'grocrey', 'groccery', 'grosery', 'groc', 'kirana', 'kiranam',
    'kirana store', 'provisions', 'provision', 'provisions store', 'general store', 'daily needs',
    'ration', 'vegetables', 'vegetable shop', 'fruits', 'fruit stall', 'milk', 'dairy', 'dairy parlour',
    'curd', 'paneer', 'rice', 'rice depot', 'flour mill', 'atta', 'oil', 'oil depot', 'spices',
    'dry fruits', 'nuts', 'organic store', 'patanjali', 'heritage', 'big basket', 'zepto', 'blinkit', 'dunzo'
  ],
  'Supermarket': [
    'supermarket', 'supermarkets', 'super market', 'super markets', 'supermaket', 'supermart',
    'supermrkt', 'supramarket', 'supper market', 'super', 'superm', 'hypermarket', 'hypermarkets',
    'super mart', 'super bazar', 'super bazaar', 'mart', 'marts',
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
    'pharmacy', 'pharmacies', 'phar', 'pharm', 'pharma', 'parmacy', 'farmacy', 'pharmecy',
    'medical', 'medicals', 'medical store', 'madical', 'medicine', 'medicines', 'medicin', 'medicne',
    'madicine', 'chemist', 'druggist', 'drugstore', 'drug store', 'drugs',
    'tablets', 'capsules', 'syrup', 'ointment', 'first aid', 'health store', 'surgicals',
    'apollo pharmacy', 'medplus', 'netmeds', '1mg', 'diagnostics', 'clinic', 'pathology'
  ],
  'Clothing Store': [
    'clothing', 'clothing store', 'cloth', 'clothes', 'cloths', 'clothe', 'clothings', 'cloting',
    'garments', 'garment', 'apparel', 'fashion', 'fasion', 'textiles', 'textile', 'dresses',
    'dress', 'sarees', 'saree', 'silks', 'silk', 'mens wear', 'kids wear', 'ladies wear',
    'shirts', 'shirt', 'pants', 'pant', 'jeans', 't-shirts', 'trousers', 'ethnic wear',
    'boutique', 'trends', 'max fashion', 'zudio', 'manyavar', 'decathlon', 'lenskart'
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
    'mobile', 'mobiles', 'mobail', 'mobile phone', 'mobile phones', 'cell phone', 'cell phones',
    'smartphone', 'smartphones', 'phone store', 'mobile store', 'mobile care', 'accessories',
    'recharge', 'screen guard', 'back cover', 'charger', 'poorvika', 'sangeetha', 'lotus mobiles'
  ],
  'Electronics Store': [
    'electronics', 'electronic', 'electronics store', 'elctronics', 'electornics', 'electronis',
    'electonics', 'elec', 'elect', 'computers', 'computer', 'laptop', 'laptops', 'tv', 'television',
    'refrigerator', 'fridge', 'washing machine', 'ac', 'air conditioner', 'cooler', 'appliances',
    'home appliances', 'cctv', 'printers', 'croma', 'vijay sales', 'reliance digital'
  ],
  'Beauty Salon': [
    'beauty salon', 'beauty parlour', 'beauty parlor', 'beuty', 'beuty salon', 'beauti salon',
    'salon', 'salons', 'sal', 'salun', 'saloon', 'saloons', 'spa', 'spas', 'hair salon',
    'hairdresser', 'hair style', 'barber', 'barbers', 'barber shop', 'haircut', 'facial',
    'makeup', 'bridal makeup', 'pedicure', 'manicure', 'naturals', 'green trends', 'jawed habib', 'enrich', 'toni & guy', 'urban company'
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

function levenshteinDistance(s1, s2) {
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;
  const v0 = new Array(s2.length + 1);
  const v1 = new Array(s2.length + 1);
  for (let i = 0; i <= s2.length; i++) v0[i] = i;
  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= s2.length; j++) v0[j] = v1[j];
  }
  return v1[s2.length];
}

/**
 * Resolves a keyword/prefix/typo to matching canonical category names.
 */
export function resolveKeywordToCategories(keyword) {
  if (!keyword || typeof keyword !== 'string') return [];
  const kw = keyword.trim().toLowerCase();
  if (!kw || ['all', 'all categories', 'all shops', 'none', 'null'].includes(kw)) return [];

  const matched = [];

  // 1. Check primary category names first (highest priority)
  for (const [catName, kwList] of Object.entries(CATEGORY_ITEM_KEYWORDS)) {
    const catLower = catName.toLowerCase();
    if (catLower.startsWith(kw) || kw.startsWith(catLower)) {
      if (!matched.includes(catName)) matched.push(catName);
    }
  }

  // 2. If short prefix (<= 2 chars), only match top 2 primary terms per category
  if (kw.length <= 2) {
    for (const [catName, kwList] of Object.entries(CATEGORY_ITEM_KEYWORDS)) {
      if (matched.includes(catName)) continue;
      const primaryTerms = kwList.slice(0, 2);
      for (const term of primaryTerms) {
        if (term.startsWith(kw)) {
          matched.push(catName);
          break;
        }
      }
    }
    return matched.slice(0, 3);
  }

  // 3. For length >= 3, match sub-items, synonyms, and typos
  for (const [catName, kwList] of Object.entries(CATEGORY_ITEM_KEYWORDS)) {
    if (matched.includes(catName)) continue;
    for (const term of kwList) {
      if (
        kw === term ||
        kw.startsWith(term) ||
        term.startsWith(kw) ||
        (kw.length >= 3 && term.includes(kw)) ||
        (kw.length >= 4 && term.length >= 4 && (
          kw.slice(0, 4) === term.slice(0, 4) ||
          levenshteinDistance(kw, term) <= 2 ||
          (1 - levenshteinDistance(kw, term) / Math.max(kw.length, term.length)) >= 0.65
        ))
      ) {
        matched.push(catName);
        break;
      }
    }
  }

  return matched.slice(0, 3);
}

/**
 * Checks if a business matches the selected category using the alias dictionary.
 * Returns true if shopCat, shopName, or shopAddr contains any known synonym
 * for the selected category.
 */
function categoryMatchesBusiness(shopCat, shopName, shopAddr, selectedCategory) {
  const targetCat = selectedCategory.toLowerCase().trim();

  // Find the canonical category in CATEGORY_ITEM_KEYWORDS
  let canonicalCat = null;
  for (const catName of Object.keys(CATEGORY_ITEM_KEYWORDS)) {
    if (catName.toLowerCase() === targetCat) {
      canonicalCat = catName;
      break;
    }
  }

  // Build the set of all synonyms for this category
  const synonyms = canonicalCat ? CATEGORY_ITEM_KEYWORDS[canonicalCat] : [];

  // 1. Direct category name match (shopCat contains/is-contained-by targetCat)
  if (shopCat === targetCat || shopCat.includes(targetCat) || targetCat.includes(shopCat)) {
    return true;
  }

  // 2. Any synonym matches shopCat, shopName, or shopAddr
  for (const syn of synonyms) {
    if (
      shopCat === syn ||
      shopCat.includes(syn) ||
      syn.includes(shopCat) ||
      shopName.includes(syn) ||
      shopAddr.includes(syn)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a business object matches a selected category and/or search keyword.
 */
export function isBusinessMatching(business, keyword, selectedCategory) {
  if (!business) return false;

  const shopCat = (business.category || '').toLowerCase().trim();
  const shopName = (business.name || '').toLowerCase().trim();
  const shopAddr = (business.address || business.short_address || '').toLowerCase().trim();

  // 1. Category filter (if a specific category is selected)
  if (selectedCategory && selectedCategory !== 'All Categories') {
    if (!categoryMatchesBusiness(shopCat, shopName, shopAddr, selectedCategory)) {
      return false;
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

  // Substring match on name, address, or category
  if (shopName.includes(kw) || shopAddr.includes(kw) || shopCat.includes(kw)) {
    return true;
  }

  // Prefix match on category
  if (shopCat.startsWith(kw) || kw.startsWith(shopCat)) {
    return true;
  }

  // Category resolution from keyword (e.g. 'resu' → 'Restaurant', 'pizza' → 'Restaurant')
  const matchedCats = resolveKeywordToCategories(kw);
  for (const mc of matchedCats) {
    const mcLower = mc.toLowerCase();
    // Check if resolved category matches shopCat, name, or addr
    if (shopCat.includes(mcLower) || mcLower.includes(shopCat)) {
      return true;
    }
    // Also check synonyms for the resolved category
    const syns = CATEGORY_ITEM_KEYWORDS[mc] || [];
    for (const syn of syns) {
      if (shopCat.includes(syn) || shopName.includes(syn) || shopAddr.includes(syn)) {
        return true;
      }
    }
  }

  return false;
}
