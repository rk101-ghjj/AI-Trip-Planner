import React, { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { SelectBudgetOptions } from "@/constants/options";
import { BudgetOptions } from "@/constants/budget";
import { Button } from "@/components/ui/button";
import generateTravelPlan from "@/service/AIModel.jsx";


function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Cache for destination suggestions
const suggestionCache = new Map();

// Track ongoing requests to prevent duplicate API calls
const ongoingRequests = new Map();

// Fallback suggestions for common destinations
function getFallbackSuggestions(query) {
  const commonDestinations = [
    { name: "Mumbai, Maharashtra, India", lat: 19.0760, lon: 72.8777 },
    { name: "Delhi, India", lat: 28.7041, lon: 77.1025 },
    { name: "Bangalore, Karnataka, India", lat: 12.9716, lon: 77.5946 },
    { name: "Chennai, Tamil Nadu, India", lat: 13.0827, lon: 80.2707 },
    { name: "Kolkata, West Bengal, India", lat: 22.5726, lon: 88.3639 },
    { name: "Hyderabad, Telangana, India", lat: 17.3850, lon: 78.4867 },
    { name: "Pune, Maharashtra, India", lat: 18.5204, lon: 73.8567 },
    { name: "Ahmedabad, Gujarat, India", lat: 23.0225, lon: 72.5714 },
    { name: "Jaipur, Rajasthan, India", lat: 26.9124, lon: 75.7873 },
    { name: "Kochi, Kerala, India", lat: 9.9312, lon: 76.2673 },
    { name: "Goa, India", lat: 15.2993, lon: 74.1240 },
    { name: "Shimla, Himachal Pradesh, India", lat: 31.1048, lon: 77.1734 },
    { name: "Manali, Himachal Pradesh, India", lat: 32.2432, lon: 77.1892 },
    { name: "Udaipur, Rajasthan, India", lat: 24.5854, lon: 73.7125 },
    { name: "Jodhpur, Rajasthan, India", lat: 26.2389, lon: 73.0243 },
    { name: "Agra, Uttar Pradesh, India", lat: 27.1767, lon: 78.0081 },
    { name: "Varanasi, Uttar Pradesh, India", lat: 25.3176, lon: 82.9739 },
    { name: "Rishikesh, Uttarakhand, India", lat: 30.0869, lon: 78.2676 },
    { name: "Darjeeling, West Bengal, India", lat: 27.0360, lon: 88.2627 },
    { name: "Kashmir, India", lat: 34.0837, lon: 74.7973 },
    { name: "Leh, Ladakh, India", lat: 34.1526, lon: 77.5771 },
    { name: "Mysore, Karnataka, India", lat: 12.2958, lon: 76.6394 },
    { name: "Ooty, Tamil Nadu, India", lat: 11.4102, lon: 76.6950 },
    { name: "Kodaikanal, Tamil Nadu, India", lat: 10.2381, lon: 77.4892 },
    { name: "Munnar, Kerala, India", lat: 10.0889, lon: 77.0595 },
    { name: "Kerala, India", lat: 10.8505, lon: 76.2711 },
    { name: "Rajasthan, India", lat: 27.0238, lon: 74.2179 },
    { name: "Himachal Pradesh, India", lat: 31.1048, lon: 77.1734 },
    { name: "Karnataka, India", lat: 15.3173, lon: 75.7139 },
    { name: "Tamil Nadu, India", lat: 11.1271, lon: 78.6569 }
  ];
  
  const queryLower = query.toLowerCase();
  return commonDestinations
    .filter(dest => dest.name.toLowerCase().includes(queryLower))
    .slice(0, 5)
    .map((dest, index) => ({
      id: `fallback_${index}`,
      label: dest.name,
      lat: dest.lat,
      lon: dest.lon,
    }));
}

const CreateTrip = memo(() => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 150);
  const [formData, setFormData] = useState({ destination: "", days: "", budgetId: null, companionsId: null });
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isDestinationSelected, setIsDestinationSelected] = useState(false);

  const handleInputChange = useCallback((name, value) => {
    setFormData(prev => ({...prev, [name]: value}));
  }, []);

  useEffect(()=>{
    console.log(formData);
  },[formData]);

  useEffect(() => {
    if (debouncedQuery === "") {
      setSuggestions([]);
      return;
    }

    // Only search if query has at least 2 characters
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    const cacheKey = debouncedQuery.toLowerCase().trim();
    if (suggestionCache.has(cacheKey)) {
      setSuggestions(suggestionCache.get(cacheKey));
      return;
    }

    // Check if request is already ongoing
    if (ongoingRequests.has(cacheKey)) {
      return;
    }

    const controller = new AbortController();
    let timeoutId;
    
    // Mark request as ongoing
    ongoingRequests.set(cacheKey, controller);
    
    (async () => {
      try {
        setIsLoading(true);
        
        // Add timeout to prevent hanging requests
        timeoutId = setTimeout(() => {
          controller.abort();
        }, 5000);
        
        const base = "https://nominatim.openstreetmap.org";
        const url = `${base}/search?format=json&q=${encodeURIComponent(
          debouncedQuery
        )}&addressdetails=1&limit=8&countrycodes=&bounded=1&dedupe=1`;
        
        const res = await fetch(url, {
          headers: { 
            Accept: "application/json",
            "User-Agent": "TripPlanner/1.0"
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }
        
        const formattedSuggestions = data
          .filter(item => item && item.place_id && item.display_name)
          .slice(0, 5)
          .map((item) => ({
            id: item.place_id,
            label: item.display_name,
            lat: parseFloat(item.lat) || 0,
            lon: parseFloat(item.lon) || 0,
          }));
        
        // Cache the results
        suggestionCache.set(cacheKey, formattedSuggestions);
        setSuggestions(formattedSuggestions);
        
      } catch (e) {
        clearTimeout(timeoutId);
        
        if (e.name !== "AbortError") {
          console.error("Destination search error:", e);
          
          // Try fallback suggestions for common cities
          const fallbackSuggestions = getFallbackSuggestions(debouncedQuery);
          if (fallbackSuggestions.length > 0) {
            setSuggestions(fallbackSuggestions);
          } else {
            setSuggestions([]);
          }
        }
      } finally {
        setIsLoading(false);
        // Remove from ongoing requests
        ongoingRequests.delete(cacheKey);
      }
    })();
    
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
      // Remove from ongoing requests
      ongoingRequests.delete(cacheKey);
    };
  }, [debouncedQuery]);

  const handleSelect = useCallback((opt) => {
    setQuery(opt.label);
    setSuggestions([]);
    handleInputChange("destination", opt.label);
    setIsDestinationSelected(true);
    // Clear any ongoing requests for this selection
    const cacheKey = opt.label.toLowerCase().trim();
    ongoingRequests.delete(cacheKey);
  }, [handleInputChange]);

  const handleSubmit = useCallback(async () => {
    if (!formData.destination || !formData.days || !formData.budgetId || !formData.companionsId) {
      setError("Please complete all fields before creating the trip.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const result = await generateTravelPlan(
        formData.destination,
        Number(formData.days),
        formData.budgetId,
        formData.companionsId
      );
      navigate('/trip-plan', { state: { plan: result } });
    } catch (e) {
      setError(e?.message || "Failed to generate travel plan");
    } finally {
      setIsGenerating(false);
    }
  }, [formData, navigate]);
  return (
    <>
    {/* Fullscreen Loading Overlay */}
    {isGenerating && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center shadow-2xl">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Trip Plan</h3>
          <p className="text-gray-600">Please wait while we generate your personalized travel itinerary...</p>
        </div>
      </div>
    )}
    
    <div className="max-w-5xl mx-auto px-5 py-10 pt-20">
      <h2 className="font-extrabold tracking-tight text-3xl md:text-4xl">Tell us your travel preferences🏕️🤩</h2>
      <p className="mt-3 text-muted-foreground text-sm md:text-base">
        We'll use this information to help you find the perfect trip
      </p>
      <div className="flex flex-col gap-4"></div>

      <div className="mt-10">
        <h2 className="text-xl my-3 font-medium">
          What is your destination of choice?
        </h2>
        <div className="relative max-w-xl">
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              handleInputChange("destination", e.target.value)
              setIsDestinationSelected(false)
            }}
            placeholder="Enter your destination"
            className="w-full"
            disabled={isGenerating}
          />
          {isLoading && (
            <div className="absolute right-3 top-2.5 flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Finding places...</span>
            </div>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-background shadow">
              {suggestions.map((opt) => (
                <li
                  key={opt.id}
                  className="cursor-pointer px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
          {query.length > 0 && query.length < 2 && !isLoading && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow p-3 text-sm text-muted-foreground">
              Type at least 2 characters to see suggestions
            </div>
          )}
          {query.length >= 2 && !isLoading && suggestions.length === 0 && !isDestinationSelected && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>No suggestions found for "{query}"</span>
                <button 
                  onClick={() => {
                    const cacheKey = query.toLowerCase().trim();
                    suggestionCache.delete(cacheKey);
                    ongoingRequests.delete(cacheKey);
                    setIsDestinationSelected(false);
                    // Force a re-search by temporarily clearing and setting the query
                    const currentQuery = query;
                    setQuery('');
                    setTimeout(() => setQuery(currentQuery), 10);
                  }}
                  className="text-primary hover:underline text-xs"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    <div className="max-w-5xl mx-auto px-5 mt-2 mb-10">
      <h2 className="text-xl md:text-2xl my-3 font-semibold">How many days you are planning to stay?</h2>
      <div className="relative max-w-xl">
        <Input
          placeholder="Enter the number of days"
          className="w-full"
          type="number"
          min={1}
          inputMode="numeric"
          onChange={(e) => handleInputChange("days", e.target.value)}
          value={formData.days}
          disabled={isGenerating}
        />
      </div>
      <div className="mt-10">
        <h2 className="text-xl md:text-2xl my-3 font-semibold">What is Your Budget?</h2>
        <BudgetRow
          value={formData.budgetId}
          onChange={(id) => handleInputChange("budgetId", id)}
          disabled={isGenerating}
        />
      </div>
      <div className="mt-10">
        <h2 className="text-xl md:text-2xl my-3 font-semibold">Who do you plan to travel with?</h2>
        <BudgetGrid
          value={formData.companionsId}
          onChange={(id) => handleInputChange("companionsId", id)}
          disabled={isGenerating}
        />
      </div>
    </div>
      <button 
        onClick={handleSubmit} 
        disabled={isGenerating || !formData.destination || !formData.days || !formData.budgetId || !formData.companionsId} 
        className={[
          "bg-primary text-white px-6 py-3 rounded-lg mx-auto block translate-x-110 mb-4 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:bg-primary/90 font-semibold",
          isGenerating || !formData.destination || !formData.days || !formData.budgetId || !formData.companionsId ? "opacity-50 cursor-not-allowed" : ""
        ].join(" ")}
      >
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Creating Your Trip...</span>
          </div>
        ) : (
          "Create Trip"
        )}
      </button>

      {error && (
        <div className="max-w-5xl mx-auto px-5 mb-6 text-red-600 text-sm">
          {error}
        </div>
      )}

      
    </>
  );
});

CreateTrip.displayName = 'CreateTrip';

// Sub-component: visually polished budget grid with selection
const BudgetGrid = memo(({ value, onChange, disabled = false }) => {
  const handleItemClick = useCallback((id) => {
    if (!disabled) {
      onChange(id);
    }
  }, [onChange, disabled]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
      {SelectBudgetOptions.map((item) => {
        const Icon = item.icon
        const isSelected = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item.id)}
            className={[
              "text-left rounded-xl border bg-card p-5 shadow-sm transition-all duration-300",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:bg-accent/30 hover:scale-105 cursor-pointer",
              isSelected ? "ring-4 ring-ring border-primary bg-accent/50" : "border-border",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span className="text-primary text-2xl"><Icon /></span>
              <div>
                <div className="font-semibold text-lg">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.people}</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
});

BudgetGrid.displayName = 'BudgetGrid';

const BudgetRow = memo(({ value, onChange, disabled = false }) => {
  const handleItemClick = useCallback((id) => {
    if (!disabled) {
      onChange(id);
    }
  }, [onChange, disabled]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {BudgetOptions.map((item) => {
        const Icon = item.icon
        const isSelected = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item.id)}
            className={[
              "text-left rounded-xl border bg-card p-4 shadow-sm transition-all duration-300",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:bg-accent/30 hover:scale-105 cursor-pointer",
              isSelected ? "ring-4 ring-ring border-primary bg-accent/50" : "border-border",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <span className="text-primary text-2xl"><Icon /></span>
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
});

BudgetRow.displayName = 'BudgetRow';

export default CreateTrip;
