require('dotenv').config();
const express = require('express');
const fetch = global.fetch || require('node-fetch');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5050;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. Set it in server/.env');
}

function buildPrompt({ location, days, travellers, budget, currency }) {
  return `
You are a travel itinerary generator for ${location}. Generate a realistic travel plan with REAL hotels and attractions from ${location}.

CRITICAL REQUIREMENTS:
1. Use REAL hotel names that exist in ${location} (e.g., "Taj Palace Mumbai", "The Oberoi Mumbai", "ITC Maratha")
2. Use REAL tourist attractions and landmarks from ${location} (e.g., "Gateway of India", "Marine Drive", "Elephanta Caves")
3. Generate SPECIFIC images for each EXACT location using these precise formats:
   - For Gateway of India: https://source.unsplash.com/800x600/?gateway+of+india+mumbai+monument+architecture&sig=SEED
   - For Taj Palace: https://source.unsplash.com/800x600/?taj+palace+mumbai+hotel+luxury&sig=SEED
   - For Marine Drive: https://source.unsplash.com/800x600/?marine+drive+mumbai+queens+necklace+seafront&sig=SEED
   - For Red Fort: https://source.unsplash.com/800x600/?red+fort+delhi+unesco+heritage+monument&sig=SEED
   - For India Gate: https://source.unsplash.com/800x600/?india+gate+delhi+war+memorial+monument&sig=SEED
   Replace SEED with unique numbers (1, 2, 3, etc.) for each image.

4. Use realistic addresses in ${location}
5. Set appropriate prices based on budget: ${budget}
6. Include real coordinates for ${location} area

Return at least 3 REAL hotel options from ${location}. For each hotel include: hotelName (real hotel name), address (real address in ${location}), price (number), currency, imageUrl (specific to that hotel), geo {lat,lng}, rating (number 0-5), description.

For each day (1..days) produce a "plans" array with REAL places from ${location}:
  placeName (real attraction name), placeDetails (brief paragraph about the actual place), placeImageUrl (specific to that place), geo {lat,lng}, ticketPrice (number), currency, bestTimeToVisit (string), estimatedVisitDurationMinutes (number), travelTimeFromPreviousMinutes (number).

Inputs:
- location: "${location}"
- days: ${days}
- travellers: "${travellers}"
- budget: "${budget}"
- currency: "${currency}"

Schema (must match exactly):
{
  "location": string,
  "days": integer,
  "travellers": string,
  "budget": string,
  "currency": string,
  "hotels": [ { "hotelName": string, "address": string, "price": number, "currency": string, "imageUrl": string, "geo": {"lat": number, "lng": number}, "rating": number, "description": string } ],
  "itinerary": [ { "day": integer, "date": string | null, "plans": [ { "placeName": string, "placeDetails": string, "placeImageUrl": string, "geo": {"lat": number, "lng": number}, "ticketPrice": number, "currency": string, "bestTimeToVisit": string, "estimatedVisitDurationMinutes": number, "travelTimeFromPreviousMinutes": number } ] } ]
}

Return ONLY the JSON object with REAL places and hotels from ${location}.
`;
}

app.post('/api/generate-trip', async (req, res) => {
  try {
    console.log('[API] /api/generate-trip request received');
    const { location = 'Las Vegas', days = 3, travellers = 'couple', budget = 'cheap', currency = 'USD' } = req.body || {};

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Server misconfiguration: GEMINI_API_KEY not set' });
    }

    const prompt = buildPrompt({ location, days, travellers, budget, currency });

    const model = 'gemini-1.5-pro';
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    };

    const r = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    }, 2, 15000);

    if (!r.ok) {
      const errText = await r.text();
      console.error('Gemini API error', r.status, errText);
      const fallback = await buildFallbackPlan({ location, days, travellers, budget, currency });
      console.log('[API] Returning fallback due to Gemini error');
      return res.status(200).json(fallback);
    }

    const responseJson = await r.json();

    let modelText = null;
    if (Array.isArray(responseJson?.candidates) && responseJson.candidates[0]) {
      const cand = responseJson.candidates[0];
      if (cand?.content?.parts?.length) {
        const parts = cand.content.parts;
        modelText = parts.map((p) => (typeof p.text === 'string' ? p.text : '')).filter(Boolean).join('\n');
      }
    }
    if (!modelText && typeof responseJson?.text === 'string') modelText = responseJson.text;

    if (!modelText) {
      modelText = JSON.stringify(responseJson);
    }

    let parsed;
    try {
      parsed = JSON.parse(modelText);
    } catch (e) {
      const jsonMatch = modelText.match(/\{[\s\S]*\}$/m);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (err2) {
          console.error('Failed parsing model output:', modelText);
          return res.status(500).json({ error: 'Failed to parse model JSON', raw: modelText });
        }
      } else {
        console.error('Model returned non-JSON:', modelText);
        return res.status(500).json({ error: 'Model output not valid JSON', raw: modelText });
      }
    }

    if (!parsed.hotels || !parsed.itinerary) {
      const fallback = await buildFallbackPlan({ location, days, travellers, budget, currency });
      console.log('[API] Returning fallback due to missing keys');
      return res.status(200).json(fallback);
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    try {
      const { location = 'Las Vegas', days = 3, travellers = 'couple', budget = 'cheap', currency = 'USD' } = req.body || {};
      const fallback = await buildFallbackPlan({ location, days, travellers, budget, currency });
      console.log('[API] Returning fallback due to exception');
      return res.status(200).json(fallback);
    } catch (_) {
      return res.status(500).json({ error: 'Internal server error', message: String(err) });
    }
  }
});

// Help/Feedback endpoint
app.post('/api/help/feedback', async (req, res) => {
  try {
    const { name, email, difficulty, improvement, rating, message, recipientEmail } = req.body;
    
    // For now, we'll just log the feedback and return success
    // In a real application, you would integrate with an email service like SendGrid, Nodemailer, etc.
    console.log('=== FEEDBACK RECEIVED ===');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Rating:', rating);
    console.log('Difficulties:', difficulty);
    console.log('Improvements:', improvement);
    console.log('Additional Comments:', message);
    console.log('Recipient Email:', recipientEmail);
    console.log('========================');
    
    // Here you would typically send an email to rkar6618@gmail.com
    // For now, we'll just simulate success
    res.status(200).json({ 
      success: true, 
      message: 'Feedback received successfully' 
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process feedback' 
    });
  }
});

// Mount JWT auth/demo routes BEFORE listening
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

async function fetchWithRetry(url, options, retries = 2, timeoutMs = 15000) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeoutMs);
      const r = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(t);
      return r;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) throw e;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function buildFallbackPlan({ location, days, travellers, budget, currency }) {
  const base = await geocodeLocation(location);
  
  // Real hotel names based on location and budget
  const getRealHotelNames = (location, budget) => {
    const hotelChains = {
      cheap: ['Ibis', 'Holiday Inn Express', 'Comfort Inn', 'Travelodge', 'Days Inn'],
      moderate: ['Hilton Garden Inn', 'Courtyard by Marriott', 'Hampton Inn', 'Hyatt Place', 'Holiday Inn'],
      luxury: ['Taj', 'Oberoi', 'Marriott', 'Hyatt Regency', 'Four Seasons', 'Ritz-Carlton', 'JW Marriott']
    };
    
    const chains = hotelChains[budget] || hotelChains.moderate;
    return chains.map(chain => `${chain} ${location}`);
  };
  
  const hotelNames = getRealHotelNames(location, budget);
  const hotels = Array.from({ length: 3 }).map((_, i) => {
    const hotelName = hotelNames[i] || `${location} ${budget === 'cheap' ? 'Budget' : budget === 'moderate' ? 'Comfort' : 'Luxury'} Hotel ${i + 1}`;
    return {
      hotelName,
      address: `${i + 1} Main Street, ${location}`,
      price: budget === 'cheap' ? 80 + i * 10 : budget === 'moderate' ? 150 + i * 20 : 300 + i * 50,
      currency,
      imageUrl: getHotelImageUrl(hotelName, location, i),
      geo: { lat: Number(base.lat) + 0.01 * i, lng: Number(base.lon) + 0.01 * i },
      rating: 4.0 - i * 0.2,
      description: `Comfortable stay in ${location} for ${travellers}.`
    };
  });

  // Real attraction names based on location
  const getRealAttractions = (location) => {
    const attractions = {
      'mumbai': ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Juhu Beach', 'Siddhivinayak Temple', 'Haji Ali Dargah', 'Bandra-Worli Sea Link', 'Crawford Market'],
      'delhi': ['Red Fort', 'India Gate', 'Qutub Minar', 'Lotus Temple', 'Jama Masjid', 'Humayun\'s Tomb', 'Akshardham Temple', 'Chandni Chowk'],
      'bangalore': ['Lalbagh Botanical Garden', 'Cubbon Park', 'Vidhana Soudha', 'Bangalore Palace', 'ISKCON Temple', 'Ulsoor Lake', 'Commercial Street', 'Nandi Hills'],
      'default': ['City Center', 'Local Market', 'Historic District', 'Waterfront', 'Cultural Center', 'Shopping District', 'Park', 'Museum']
    };
    
    const cityKey = location.toLowerCase();
    return attractions[cityKey] || attractions.default;
  };
  
  const realAttractions = getRealAttractions(location);
  
  const itinerary = [];
  for (let d = 1; d <= Number(days || 1); d++) {
    itinerary.push({
      day: d,
      date: null,
      plans: Array.from({ length: 3 }).map((_, idx) => {
        const attractionIndex = (d - 1) * 3 + idx;
        const placeName = realAttractions[attractionIndex % realAttractions.length] || `${location} Attraction ${d}.${idx + 1}`;
        const lat = Number(base.lat) + 0.01 * d + 0.003 * (idx + 1);
        const lng = Number(base.lon) + 0.01 * d + 0.003 * (idx + 1);
        return {
          placeName,
          placeDetails: `Famous attraction in ${location}. A must-visit destination for tourists.`,
          placeImageUrl: getPlaceImageUrl(placeName, location, d * 10 + idx),
          geo: { lat, lng },
          ticketPrice: placeName.includes('Beach') || placeName.includes('Park') ? 0 : (budget === 'cheap' ? 10 + idx * 5 : 25 + idx * 10),
          currency,
          bestTimeToVisit: idx === 0 ? 'Morning' : idx === 1 ? 'Afternoon' : 'Evening',
          estimatedVisitDurationMinutes: 60 + idx * 30,
          travelTimeFromPreviousMinutes: idx === 0 ? 0 : 15 + idx * 5,
        };
      }),
    });
  }

  return { location, days: Number(days), travellers, budget, currency, hotels, itinerary, source: 'fallback' };
}

async function geocodeLocation(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const r = await fetchWithRetry(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'ai-trip-planner/1.0' } }, 1, 10000);
    if (!r.ok) return { lat: 0, lon: 0 };
    const arr = await r.json();
    const first = Array.isArray(arr) && arr[0] ? arr[0] : null;
    return first ? { lat: Number(first.lat) || 0, lon: Number(first.lon) || 0 } : { lat: 0, lon: 0 };
  } catch (_) {
    return { lat: 0, lon: 0 };
  }
}

function getImageUrl(query, seed = 0) {
  // Clean and optimize the query for better image results
  const cleanQuery = query
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '+') // Replace spaces with +
    .toLowerCase();
  
  // Multiple image sources with better search terms
  const sources = [
    `https://source.unsplash.com/800x600/?${cleanQuery}&sig=${seed}`,
    `https://images.unsplash.com/photo-${1500000000000 + seed * 1000000}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&q=${encodeURIComponent(cleanQuery)}`,
    `https://picsum.photos/800/600?random=${seed}&blur=0`
  ];
  
  return sources[0];
}

// Enhanced image generation for specific places
function getSpecificPlaceImage(placeName, location, type = 'landmark', seed = 0) {
  // Create very specific search terms based on the place
  const specificTerms = {
    // Mumbai landmarks
    'gateway of india': 'gateway+of+india+mumbai+monument+architecture+india',
    'marine drive': 'marine+drive+mumbai+queens+necklace+seafront+night',
    'elephanta caves': 'elephanta+caves+mumbai+unesco+heritage+sculpture',
    'juhu beach': 'juhu+beach+mumbai+sunset+seaside',
    'siddhivinayak temple': 'siddhivinayak+temple+mumbai+ganesh+religious',
    'haji ali dargah': 'haji+ali+dargah+mumbai+mosque+island',
    'bandra worli sea link': 'bandra+worli+sea+link+mumbai+bridge+architecture',
    'crawford market': 'crawford+market+mumbai+shopping+heritage',
    
    // Delhi landmarks
    'red fort': 'red+fort+delhi+unesco+heritage+monument+mughal',
    'india gate': 'india+gate+delhi+war+memorial+monument+night',
    'qutub minar': 'qutub+minar+delhi+unesco+heritage+tower+minaret',
    'lotus temple': 'lotus+temple+delhi+bahai+house+worship+architecture',
    'jama masjid': 'jama+masjid+delhi+mosque+mughal+architecture',
    'humayun tomb': 'humayun+tomb+delhi+unesco+heritage+mausoleum',
    'akshardham temple': 'akshardham+temple+delhi+swaminarayan+architecture',
    'chandni chowk': 'chandni+chowk+delhi+market+street+heritage',
    
    // Bangalore landmarks
    'lalbagh': 'lalbagh+botanical+garden+bangalore+glass+house+flowers',
    'cubbon park': 'cubbon+park+bangalore+green+space+statue',
    'vidhana soudha': 'vidhana+soudha+bangalore+government+building+architecture',
    'bangalore palace': 'bangalore+palace+karnataka+royal+architecture',
    'iskcon temple': 'iskcon+temple+bangalore+krishna+religious',
    'ulsoor lake': 'ulsoor+lake+bangalore+water+serene',
    'commercial street': 'commercial+street+bangalore+shopping+market',
    'nandi hills': 'nandi+hills+bangalore+sunrise+viewpoint',
    
    // Generic terms for other places
    'museum': 'museum+interior+exhibition+art+history',
    'temple': 'temple+religious+architecture+spiritual',
    'beach': 'beach+seaside+ocean+sunset',
    'park': 'park+green+space+nature+trees',
    'market': 'market+shopping+street+vendors',
    'mountain': 'mountain+peak+landscape+scenic',
    'lake': 'lake+water+serene+reflection',
    'garden': 'garden+flowers+plants+beautiful'
  };
  
  const key = placeName.toLowerCase().replace(/[^\w\s]/g, '').trim();
  let specificTerm = specificTerms[key];
  
  // If exact match not found, try partial matches
  if (!specificTerm) {
    for (const [term, searchTerm] of Object.entries(specificTerms)) {
      if (key.includes(term) || term.includes(key)) {
        specificTerm = searchTerm;
        break;
      }
    }
  }
  
  // If still no match, create a specific term
  if (!specificTerm) {
    const cleanPlace = placeName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, '+').toLowerCase();
    const cleanLocation = location.toLowerCase();
    specificTerm = `${cleanPlace}+${cleanLocation}+${type}+landmark+architecture`;
  }
  
  return `https://source.unsplash.com/800x600/?${specificTerm}&sig=${seed}`;
}

// Enhanced hotel image generation
function getSpecificHotelImage(hotelName, location, seed = 0) {
  const hotelTerms = {
    // Luxury hotels
    'taj palace': 'taj+palace+mumbai+hotel+luxury+accommodation+heritage',
    'taj': 'taj+palace+hotel+luxury+accommodation+heritage',
    'oberoi': 'oberoi+mumbai+hotel+luxury+accommodation+premium',
    'itc maratha': 'itc+maratha+mumbai+hotel+luxury+accommodation',
    'four seasons': 'four+seasons+hotel+luxury+accommodation+premium',
    'ritz carlton': 'ritz+carlton+hotel+luxury+accommodation+premium',
    'jw marriott': 'jw+marriott+hotel+luxury+accommodation',
    'hyatt regency': 'hyatt+regency+hotel+luxury+accommodation',
    
    // Mid-range hotels
    'marriott': 'marriott+hotel+accommodation+mid+range',
    'hyatt': 'hyatt+hotel+accommodation+mid+range',
    'hilton': 'hilton+hotel+accommodation+mid+range',
    'courtyard': 'courtyard+marriott+hotel+accommodation',
    'hampton inn': 'hampton+inn+hotel+accommodation',
    'holiday inn': 'holiday+inn+hotel+accommodation+mid+range',
    
    // Budget hotels
    'ibis': 'ibis+hotel+budget+accommodation+affordable',
    'comfort inn': 'comfort+inn+hotel+budget+accommodation',
    'travelodge': 'travelodge+hotel+budget+accommodation',
    'days inn': 'days+inn+hotel+budget+accommodation'
  };
  
  const hotelKey = hotelName.toLowerCase().replace(/[^\w\s]/g, '').trim();
  let specificTerm = '';
  
  // Try exact matches first
  for (const [key, term] of Object.entries(hotelTerms)) {
    if (hotelKey === key || hotelKey.includes(key)) {
      specificTerm = `${term}+${location.toLowerCase()}`;
      break;
    }
  }
  
  // If no exact match, try partial matches
  if (!specificTerm) {
    for (const [key, term] of Object.entries(hotelTerms)) {
      if (key.includes(hotelKey) || hotelKey.includes(key)) {
        specificTerm = `${term}+${location.toLowerCase()}`;
        break;
      }
    }
  }
  
  // If still no match, create a generic term
  if (!specificTerm) {
    const cleanHotel = hotelName.replace(/[^\w\s]/g, ' ').replace(/\s+/g, '+').toLowerCase();
    const cleanLocation = location.toLowerCase();
    specificTerm = `${cleanHotel}+${cleanLocation}+hotel+accommodation+exterior`;
  }
  
  return `https://source.unsplash.com/800x600/?${specificTerm}&sig=${seed}`;
}

function getHotelImageUrl(hotelName, location, seed = 0) {
  // Use specific hotel image generation for better results
  return getSpecificHotelImage(hotelName, location, seed);
}

function getPlaceImageUrl(placeName, location, seed = 0) {
  // Use specific place image generation for better results
  return getSpecificPlaceImage(placeName, location, 'landmark', seed);
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}



