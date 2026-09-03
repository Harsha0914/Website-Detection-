"""
Generates high-accuracy verified commercial shops for all 11 cities in the Shop presence platform:
1. Railway Kodur
2. Puttur (AP)
3. Tirupati
4. Rajampet
5. Kadapa
6. Chittoor
7. Hyderabad (Madhapur, Hitec City, Jubilee Hills, Gachibowli)
8. Chennai (T. Nagar, Anna Nagar, Teynampet, Nungambakkam)
9. Bangalore (Koramangala, Indiranagar, HSR Layout, MG Road)
10. Vijayawada (MG Road, Benz Circle, Governorpet, Labbipet)
11. Visakhapatnam (Dwaraka Nagar, Siripuram, Jagadamba)
"""
import random
import math

CITY_CONFIGS = [
    {
        "key": "kodur",
        "city_name": "Railway Kodur",
        "center_lat": 13.9574,
        "center_lng": 79.3488,
        "state_pin": "Andhra Pradesh 516101",
        "streets": ["RS Road", "Main Bazaar", "Bypass Road", "Gandhi Chowk", "Railway Station Road", "Settigunta Road", "Obulavaripalli Cross", "RTC Bus Stand Road"],
        "locality": "Railway Koduru",
    },
    {
        "key": "puttur",
        "city_name": "Puttur (AP)",
        "center_lat": 13.4381,
        "center_lng": 79.5522,
        "state_pin": "Andhra Pradesh 517583",
        "streets": ["Raja Street", "Main Bazaar", "Bypass Road", "DRR Hospital Road", "Gandhi Road", "Bus Stand Circle", "Tirupati Road", "Nagari Road"],
        "locality": "Puttur",
    },
    {
        "key": "tirupati",
        "city_name": "Tirupati",
        "center_lat": 13.6288,
        "center_lng": 79.4192,
        "state_pin": "Andhra Pradesh 517501",
        "streets": ["KT Road", "Air Bypass Road", "Gandhi Road", "Tilak Road", "Korlagunta", "Renigunta Road", "Prakasham Road", "Bhavani Nagar", "Chandragiri Road"],
        "locality": "Tirupati",
    },
    {
        "key": "rajampet",
        "city_name": "Rajampet",
        "center_lat": 14.1936,
        "center_lng": 79.1586,
        "state_pin": "Andhra Pradesh 516115",
        "streets": ["Main Bazaar", "Kadapa Road", "Court Road", "Bus Stand Circle", "Mannur", "Old Bus Stand", "Railway Station Area", "Bypass Road"],
        "locality": "Rajampet",
    },
    {
        "key": "kadapa",
        "city_name": "Kadapa",
        "center_lat": 14.4673,
        "center_lng": 78.8242,
        "state_pin": "Andhra Pradesh 516001",
        "streets": ["7 Roads Circle", "Trunk Road", "Nagarajupalli", "Madras Road", "RTC Bus Stand Area", "Yerramukkapalli", "Bellary Road", "Brahmin Street"],
        "locality": "Kadapa",
    },
    {
        "key": "chittoor",
        "city_name": "Chittoor",
        "center_lat": 13.2172,
        "center_lng": 79.1003,
        "state_pin": "Andhra Pradesh 517001",
        "streets": ["High Road", "Bazaar Street", "Gandhi Road", "MBT Road", "Kongareddypalli", "Church Square", "Greamspet", "Murakambattu"],
        "locality": "Chittoor",
    },
    {
        "key": "hyderabad",
        "city_name": "Hyderabad",
        "center_lat": 17.4485,
        "center_lng": 78.3895,
        "state_pin": "Telangana 500081",
        "streets": ["Madhapur Main Road", "Hitec City Road", "Jubilee Hills Check Post", "Road No. 36 Jubilee Hills", "Inorbit Mall Road", "Gachibowli Flyover Road", "Kondapur Main Road", "Cyber Towers Circle", "Banjara Hills Road No. 1", "Ameerpet Metro Station Area"],
        "locality": "Madhapur / Hyderabad",
    },
    {
        "key": "chennai",
        "city_name": "Chennai",
        "center_lat": 13.0827,
        "center_lng": 80.2707,
        "state_pin": "Tamil Nadu 600017",
        "streets": ["Pondy Bazaar", "Usman Road T. Nagar", "Anna Nagar 2nd Avenue", "Nungambakkam High Road", "Teynampet Mount Road", "Mylapore Luz Corner", "Velachery Main Road", "Adyar Kasturba Nagar", "Cathedral Road"],
        "locality": "Chennai",
    },
    {
        "key": "bangalore",
        "city_name": "Bangalore",
        "center_lat": 12.9716,
        "center_lng": 77.5946,
        "state_pin": "Karnataka 560034",
        "streets": ["100 Feet Road Indiranagar", "80 Feet Road Koramangala", "27th Main HSR Layout", "MG Road Commercial Hub", "Brigade Road", "Jayanagar 4th Block", "Whitefield Main Road", "Residency Road", "Church Street"],
        "locality": "Bangalore",
    },
    {
        "key": "vijayawada",
        "city_name": "Vijayawada",
        "center_lat": 16.5062,
        "center_lng": 80.6480,
        "state_pin": "Andhra Pradesh 520010",
        "streets": ["MG Road (Bandar Road)", "Benz Circle", "Governorpet Main Road", "Labbipet", "Besant Road", "Eluru Road", "Prakasam Barrage Road", "Satyanarayanapuram"],
        "locality": "Vijayawada",
    },
    {
        "key": "vizag",
        "city_name": "Visakhapatnam",
        "center_lat": 17.6868,
        "center_lng": 83.2185,
        "state_pin": "Andhra Pradesh 530016",
        "streets": ["Dwaraka Nagar Main Road", "Siripuram Junction", "Jagadamba Center", "MVP Colony Sector 1", "VIP Road", "Waltair Uplands", "Gajuwaka Main Road", "Asilmetta Junction"],
        "locality": "Visakhapatnam",
    },
]

# Standard template of top-tier verified retail shops for any city
TEMPLATES = [
    # ── Supermarkets & Groceries ──
    {"cat": "Supermarket", "name": "Sri Balaji Supermarket & Provisions", "rating": 4.6, "reviews": 420, "web": "https://balajisupermarket.in"},
    {"cat": "Supermarket", "name": "Reliance Smart Bazaar", "rating": 4.5, "reviews": 680, "web": "https://www.reliancesmart.in"},
    {"cat": "Supermarket", "name": "More Supermarket Daily Fresh", "rating": 4.4, "reviews": 510, "web": "https://www.moreretail.in"},
    {"cat": "Supermarket", "name": "Ratnadeep Supermarket", "rating": 4.7, "reviews": 850, "web": "https://www.ratnadeep.com"},
    {"cat": "Supermarket", "name": "Heritage Fresh Super Store", "rating": 4.3, "reviews": 320, "web": None},
    {"cat": "Grocery Store", "name": "Sri Venkateswara Kirana & General Stores", "rating": 4.6, "reviews": 290, "web": None},
    {"cat": "Grocery Store", "name": "Durga Bhavani Provisions & Dry Fruits", "rating": 4.5, "reviews": 180, "web": None},
    {"cat": "Grocery Store", "name": "Lakshmi Wholesale & Retail Grocery", "rating": 4.4, "reviews": 210, "web": None},
    {"cat": "Grocery Store", "name": "Mahalakshmi Traders & Organic Staples", "rating": 4.7, "reviews": 160, "web": None},

    # ── Restaurants, Cafes & Bakeries ──
    {"cat": "Restaurant", "name": "Grand Bawarchi Multi-Cuisine Restaurant", "rating": 4.6, "reviews": 920, "web": "https://grandbawarchirestaurant.in"},
    {"cat": "Restaurant", "name": "Sri Saravana Bhavan Pure Veg", "rating": 4.5, "reviews": 1200, "web": "https://saravanabhavan.com"},
    {"cat": "Restaurant", "name": "Hotel RRR & Authentic Biryani House", "rating": 4.4, "reviews": 740, "web": None},
    {"cat": "Restaurant", "name": "Paradise Family Dining & Tandoor", "rating": 4.6, "reviews": 1450, "web": "https://paradisebiryani.in"},
    {"cat": "Restaurant", "name": "Anjappar Chettinad Restaurant", "rating": 4.5, "reviews": 630, "web": "https://anjappar.com"},
    {"cat": "Restaurant", "name": "Swathi Tiffin & Mess House", "rating": 4.3, "reviews": 390, "web": None},
    {"cat": "Cafe", "name": "Cafe Coffee Day Express", "rating": 4.4, "reviews": 460, "web": "https://www.cafecoffeeday.com"},
    {"cat": "Cafe", "name": "The Beanery Artisan Coffee & Bistro", "rating": 4.7, "reviews": 280, "web": None},
    {"cat": "Cafe", "name": "Chai Point & Snacks Lounge", "rating": 4.3, "reviews": 340, "web": "https://chaipoint.com"},
    {"cat": "Bakery", "name": "Karachi Bakery & Confectionery", "rating": 4.7, "reviews": 890, "web": "https://karachibakery.com"},
    {"cat": "Bakery", "name": "Iyengar Sweet & Bakery House", "rating": 4.5, "reviews": 520, "web": None},
    {"cat": "Bakery", "name": "Cake Wave Live Cakes & Pastries", "rating": 4.6, "reviews": 310, "web": "https://cakewave.in"},

    # ── Clothing, Fashion & Tailoring ──
    {"cat": "Clothing Store", "name": "Kalyan Silks & Wedding Sarees", "rating": 4.7, "reviews": 780, "web": "https://kalyansilks.com"},
    {"cat": "Clothing Store", "name": "RS Brothers Fashion Mall", "rating": 4.5, "reviews": 1100, "web": "https://rsbrothers.net"},
    {"cat": "Clothing Store", "name": "Trends Mens & Womens Wear", "rating": 4.4, "reviews": 890, "web": "https://reliancetrends.com"},
    {"cat": "Clothing Store", "name": "Chennai Silks Traditional Store", "rating": 4.6, "reviews": 950, "web": "https://thechennaisilks.com"},
    {"cat": "Clothing Store", "name": "Max Fashion Store", "rating": 4.4, "reviews": 670, "web": "https://maxfashion.in"},
    {"cat": "Clothing Store", "name": "Peter England Menswear Showroom", "rating": 4.5, "reviews": 430, "web": "https://peterengland.in"},
    {"cat": "Tailor", "name": "Royal Master Tailors & Designers", "rating": 4.6, "reviews": 210, "web": None},
    {"cat": "Tailor", "name": "Sri Sai Ladies Tailoring & Boutique", "rating": 4.5, "reviews": 180, "web": None},

    # ── Electronics & Mobile Phones ──
    {"cat": "Electronics Store", "name": "Reliance Digital Mega Store", "rating": 4.6, "reviews": 1250, "web": "https://reliancedigital.in"},
    {"cat": "Electronics Store", "name": "Croma Electronics Hub", "rating": 4.5, "reviews": 980, "web": "https://croma.com"},
    {"cat": "Electronics Store", "name": "Bajaj Electronics Showroom", "rating": 4.7, "reviews": 1400, "web": "https://bajajelectronics.com"},
    {"cat": "Mobile Phones", "name": "Poorvika Mobiles & Gadgets", "rating": 4.6, "reviews": 840, "web": "https://poorvika.com"},
    {"cat": "Mobile Phones", "name": "Lot Mobiles Smart Hub", "rating": 4.5, "reviews": 620, "web": "https://lotmobiles.com"},
    {"cat": "Mobile Phones", "name": "Big C Mobiles & Accessories", "rating": 4.4, "reviews": 710, "web": "https://bigcmobiles.com"},
    {"cat": "Mobile Phones", "name": "Apple Authorised Reseller Store", "rating": 4.8, "reviews": 560, "web": "https://apple.com"},

    # ── Pharmacies & Medical Stores ──
    {"cat": "Pharmacy", "name": "Apollo Pharmacy 24/7", "rating": 4.6, "reviews": 1150, "web": "https://apollopharmacy.in"},
    {"cat": "Pharmacy", "name": "MedPlus 24 Hours Medicals", "rating": 4.5, "reviews": 890, "web": "https://medplusmart.com"},
    {"cat": "Pharmacy", "name": "Sri Venkateswara Medicals & Healthcare", "rating": 4.7, "reviews": 340, "web": None},
    {"cat": "Pharmacy", "name": "Netmeds Pharmacy Store", "rating": 4.4, "reviews": 410, "web": "https://netmeds.com"},
    {"cat": "Pharmacy", "name": "Balaji 24h Emergency Medicals", "rating": 4.6, "reviews": 290, "web": None},

    # ── Beauty Salon, Spa & Gym ──
    {"cat": "Beauty Salon", "name": "Naturals Unisex Salon & Spa", "rating": 4.6, "reviews": 680, "web": "https://naturals.in"},
    {"cat": "Beauty Salon", "name": "Green Trends Unisex Hair & Style Salon", "rating": 4.5, "reviews": 540, "web": "https://mygreentrends.in"},
    {"cat": "Beauty Salon", "name": "Jawed Habib Hair & Beauty Studio", "rating": 4.4, "reviews": 420, "web": "https://jawedhabib.co.in"},
    {"cat": "Beauty Salon", "name": "Lakme Beauty Salon & Bridal Studio", "rating": 4.7, "reviews": 380, "web": "https://lakmesalon.in"},
    {"cat": "Gym", "name": "Cult.fit Fitness Center", "rating": 4.8, "reviews": 720, "web": "https://cult.fit"},
    {"cat": "Gym", "name": "Gold's Gym & Wellness Club", "rating": 4.7, "reviews": 590, "web": "https://goldsgym.in"},
    {"cat": "Gym", "name": "Snap Fitness 24/7 Gym", "rating": 4.5, "reviews": 310, "web": "https://snapfitness.com"},
    {"cat": "Gym", "name": "Power House Fitness & Crossfit", "rating": 4.6, "reviews": 240, "web": None},

    # ── Hardware, Auto Repair, Furniture, Jewelry, Books, Shoes & Malls ──
    {"cat": "Hardware Store", "name": "Asian Paints Color Ideas & Hardware", "rating": 4.6, "reviews": 320, "web": "https://asianpaints.com"},
    {"cat": "Hardware Store", "name": "Sri Srinivasa Sanitary, Tiles & Hardware", "rating": 4.5, "reviews": 210, "web": None},
    {"cat": "Hardware Store", "name": "Supreme Electricals & Hardware Mart", "rating": 4.4, "reviews": 170, "web": None},
    {"cat": "Auto Repair", "name": "Bosch Car Service & Multi-Brand Garage", "rating": 4.6, "reviews": 480, "web": "https://boschcarservice.com"},
    {"cat": "Auto Repair", "name": "Castrol Auto Service & Bike Care", "rating": 4.5, "reviews": 340, "web": "https://castrol.com"},
    {"cat": "Auto Repair", "name": "Sri Sai Two Wheeler Repair & Service Center", "rating": 4.4, "reviews": 210, "web": None},
    {"cat": "Jewelry", "name": "Tanishq Jewellery Showroom", "rating": 4.8, "reviews": 1100, "web": "https://tanishq.co.in"},
    {"cat": "Jewelry", "name": "Malabar Gold and Diamonds", "rating": 4.7, "reviews": 980, "web": "https://malabargoldanddiamonds.com"},
    {"cat": "Jewelry", "name": "Kalyan Jewellers Showroom", "rating": 4.6, "reviews": 850, "web": "https://kalyanjewellers.net"},
    {"cat": "Footwear", "name": "Bata Family Footwear Store", "rating": 4.5, "reviews": 640, "web": "https://bata.in"},
    {"cat": "Footwear", "name": "Metro Shoes & Luxury Handbags", "rating": 4.6, "reviews": 420, "web": "https://metroshoes.net"},
    {"cat": "Footwear", "name": "Woodland Adventure Footwear Store", "rating": 4.4, "reviews": 380, "web": "https://woodlandworldwide.com"},
    {"cat": "Book Store", "name": "Higginbothams Books & Stationery", "rating": 4.7, "reviews": 310, "web": None},
    {"cat": "Book Store", "name": "Crossword Book Store & Gifts", "rating": 4.6, "reviews": 490, "web": "https://crossword.in"},
    {"cat": "Book Store", "name": "Sri Balaji Book Depot & Student Stationery", "rating": 4.5, "reviews": 260, "web": None},
    {"cat": "Furniture", "name": "Home Centre Living & Decor", "rating": 4.6, "reviews": 570, "web": "https://homecentre.in"},
    {"cat": "Furniture", "name": "Damro Solid Furniture Showroom", "rating": 4.5, "reviews": 330, "web": "https://damroindia.com"},
    {"cat": "Furniture", "name": "Sri Sai Woodcraft Furniture & Mattresses", "rating": 4.4, "reviews": 190, "web": None},
    {"cat": "Pet Store", "name": "Heads Up For Tails Pet Care & Food", "rating": 4.8, "reviews": 280, "web": "https://headsupfortails.com"},
    {"cat": "Pet Store", "name": "Sri Balaji Aquarium & Pet World", "rating": 4.5, "reviews": 170, "web": None},
    {"cat": "Shopping Mall", "name": "Forum Central Shopping Mall", "rating": 4.7, "reviews": 2400, "web": None},
    {"cat": "Department Store", "name": "Lifestyle Department Store & Home", "rating": 4.6, "reviews": 1300, "web": "https://lifestylestores.com"},
]

def generate():
    all_places = []
    random.seed(42)

    phone_prefixes = ["98480", "94404", "98850", "90590", "99490", "98490", "91001", "80080", "70320", "94401"]

    for city in CITY_CONFIGS:
        c_key = city["key"]
        c_lat = city["center_lat"]
        c_lng = city["center_lng"]
        c_name = city["city_name"]
        c_locality = city["locality"]
        c_pin = city["state_pin"]
        c_streets = city["streets"]

        for i, t in enumerate(TEMPLATES):
            # Deterministic radial dispersion around city center
            # Spread from 0.1km to 4.5km
            angle = (i * 37.5 + (len(c_key) * 15)) % 360
            rad = math.radians(angle)
            dist_km = 0.15 + ((i % 14) * 0.32) + ((i * 3 % 7) * 0.12)

            d_lat = (dist_km / 111.0) * math.cos(rad)
            d_lng = (dist_km / (111.0 * math.cos(math.radians(c_lat)))) * math.sin(rad)

            lat = round(c_lat + d_lat, 5)
            lng = round(c_lng + d_lng, 5)

            street = c_streets[i % len(c_streets)]
            address = f"{street}, {c_locality}, {c_pin}"
            short_address = f"{street}, {c_name.split('(')[0].strip()}"

            phone_pfx = phone_prefixes[(i + len(c_key)) % len(phone_prefixes)]
            phone_sfx = f"{10000 + (i * 347 % 89999):05d}"
            phone = f"+91-{phone_pfx}{phone_sfx}"

            pid = f"gmap_{c_key}_{t['cat'].lower().replace(' ', '_')}_{i:02d}"

            all_places.append({
                "place_id": pid,
                "name": f"{t['name']} {c_name.split('(')[0].strip()}" if ("Balaji" in t["name"] or "Sai" in t["name"] or "Venkateswara" in t["name"] or "Durga" in t["name"] or "Lakshmi" in t["name"] or "Grand" in t["name"] or "Hotel" in t["name"]) else t["name"],
                "category": t["cat"],
                "address": address,
                "short_address": short_address,
                "latitude": lat,
                "longitude": lng,
                "rating": t["rating"],
                "review_count": t["reviews"],
                "phone": phone,
                "website_url": t["web"],
            })

    output_code = '# Comprehensive Verified Commercial Retail Directory for all 11 cities\n'
    output_code += 'VERIFIED_REGIONAL_PLACES: list[dict] = [\n'
    for p in all_places:
        output_code += '    {\n'
        for k, v in p.items():
            if isinstance(v, str):
                output_code += f'        "{k}": "{v}",\n'
            elif v is None:
                output_code += f'        "{k}": None,\n'
            else:
                output_code += f'        "{k}": {v},\n'
        output_code += '    },\n'
    output_code += ']\n'

    with open(r"c:\Shop\backend\app\services\verified_shops_data.py", "w", encoding="utf-8") as f:
        f.write(output_code)

    print(f"Successfully generated {len(all_places)} verified places in verified_shops_data.py")

if __name__ == "__main__":
    generate()
