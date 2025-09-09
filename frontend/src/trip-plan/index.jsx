import React, { useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { currencyFormatter, numberFormatter, toSentenceCase } from '@raju_kar/code-formatter'

function formatDisplay(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map((v) => formatDisplay(v)).join(", ");
  if (typeof value === "object") {
    const { currency, notes, amount, value: v, min, max, text } = value;
    const parts = [];
    if (text) parts.push(text);
    if (v !== undefined) parts.push(String(v));
    if (amount !== undefined) parts.push(String(amount));
    if (currency) parts.push(String(currency));
    if (min !== undefined || max !== undefined) parts.push(`[${min ?? ""}-${max ?? ""}]`);
    if (notes) parts.push(`(${notes})`);
    const joined = parts.filter(Boolean).join(" ");
    return joined || JSON.stringify(value);
  }
  return String(value);
}

// Image component with loading and error states
function ImageWithFallback({ src, alt, className, fallbackText, ...props }) {
  const [imageState, setImageState] = useState('loading'); // 'loading', 'loaded', 'error'
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleError = useCallback(() => {
    if (imageState === 'loading') {
      // Try fallback sources
      const fallbackSources = [
        `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`,
        `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=${encodeURIComponent(alt || 'Image')}`,
        `https://images.unsplash.com/photo-1506905925346-14b5e4d4b8c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`
      ];
      
      const currentIndex = fallbackSources.findIndex(s => s === currentSrc);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < fallbackSources.length) {
        setCurrentSrc(fallbackSources[nextIndex]);
        setImageState('loading');
      } else {
        setImageState('error');
      }
    } else {
      setImageState('error');
    }
  }, [imageState, currentSrc, alt]);

  if (imageState === 'error') {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-sm`} {...props}>
        <div className="text-center">
          <div className="text-2xl mb-2">🏨</div>
          <div className="text-xs">{fallbackText || 'Image unavailable'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {imageState === 'loading' && (
        <div className={`${className} bg-gray-100 flex items-center justify-center`} {...props}>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0 absolute'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  );
}

function TripPlan() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const plan = state?.plan;
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const days = useMemo(() => Array.isArray(plan?.itinerary) ? plan.itinerary : [], [plan]);
  const activeDay = days[selectedDayIdx] || null;

  function coordsFrom(obj) {
    const lat = obj?.coordinates?.lat ?? obj?.geo?.lat ?? obj?.lat ?? 0;
    const lon = obj?.coordinates?.lon ?? obj?.geo?.lng ?? obj?.lon ?? obj?.lng ?? 0;
    return { lat: Number(lat) || 0, lon: Number(lon) || 0 };
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl">✈️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Trip Plan Found</h2>
          <p className="text-gray-600 mb-8">You haven't created any trip plans yet. Start planning your next adventure!</p>
          <button 
            type="button" 
            onClick={() => navigate("/create-trip")} 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Create Your First Trip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Trip-Planner</h1>
            </div>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold">{plan.destination}</h1>
          <div className="text-sm text-muted-foreground mt-2">
            <span>Days: {plan.days}</span>
            <span className="mx-2">•</span>
            <span>Budget: {plan.budget}</span>
            <span className="mx-2">•</span>
            <span>Companions: {plan.companions}</span>
          </div>
        </div>

      <section className="mb-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Hotel Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(plan.hotels || []).map((h, idx) => (
            <div key={idx} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex gap-4">
                <ImageWithFallback 
                  src={h.hotelImageUrl || h.imageUrl} 
                  alt={h.hotelName} 
                  className="w-32 h-24 object-cover rounded-md" 
                  fallbackText="Hotel"
                />
                <div>
                  <div className="font-semibold text-lg">{h.hotelName}</div>
                  <div className="text-sm text-muted-foreground">{h.hotelAddress || h.address}</div>
                  <div className="text-sm mt-1">Price: {typeof h.price === 'number' ? currencyFormatter(h.price, h.currency || 'USD') : formatDisplay(h.price)}</div>
                  <div className="text-sm">Rating: {h.ratings ?? h.rating}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {coordsFrom(h).lat}, {coordsFrom(h).lon}
                  </div>
                </div>
              </div>
              {h.description && (
                <p className="text-sm mt-3">{h.description}</p>
              )}
              <div className="mt-3">
                <iframe
                  title={`map-hotel-${idx}`}
                  className="w-full h-40 rounded-md border"
                  src={`https://www.google.com/maps?q=${coordsFrom(h).lat},${coordsFrom(h).lon}&z=14&output=embed`}
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Itinerary</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {days.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDayIdx(i)}
              className={[
                "px-3 py-1 rounded border text-sm transition-all duration-300 transform hover:scale-105",
                i === selectedDayIdx ? "bg-primary text-white" : "bg-card hover:bg-accent"
              ].join(" ")}
            >
              {d.date ? `${d.date}` : `Day ${d.day || i + 1}`}
            </button>
          ))}
        </div>
        {activeDay && (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">{activeDay.date ? activeDay.date : `Day ${activeDay.day}`}</div>
              {activeDay.bestTimeToVisit && (
                <div className="text-sm text-muted-foreground">Best time: {activeDay.bestTimeToVisit}</div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(activeDay.places || activeDay.plans || []).map((p, pIdx) => {
                const coords = p?.coordinates ? coordsFrom(p) : coordsFrom(p?.geo ? { geo: p.geo } : p);
                return (
                  <div key={pIdx} className="rounded-lg border p-3">
                    <div className="flex gap-3">
                      <ImageWithFallback 
                        src={p.placeImageUrl || p.imageUrl} 
                        alt={p.placeName} 
                        className="w-28 h-20 object-cover rounded" 
                        fallbackText="Place"
                      />
                      <div>
                        <div className="font-medium">{p.placeName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.placeDetails}</div>
                        <div className="text-xs mt-1">Ticket: {typeof (p.ticketPrice || p.ticketPricing) === 'number' ? currencyFormatter(p.ticketPrice || p.ticketPricing, p.currency || 'USD') : formatDisplay(p.ticketPricing || p.ticketPrice)}</div>
                        <div className="text-xs">Time: {formatDisplay(p.timeOfTravel || p.bestTimeToVisit)}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          {coords.lat}, {coords.lon}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <iframe
                        title={`map-place-${selectedDayIdx}-${pIdx}`}
                        className="w-full h-40 rounded-md border"
                        src={`https://www.google.com/maps?q=${coords.lat},${coords.lon}&z=14&output=embed`}
                        loading="lazy"
                        allowFullScreen
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

export default TripPlan;


