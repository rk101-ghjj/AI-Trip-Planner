import React, { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const About = memo(() => {
  const navigate = useNavigate();

  const handleStartPlanning = useCallback(() => {
    navigate('/create-trip');
  }, [navigate]);

  const handleContactUs = useCallback(() => {
    navigate('/help');
  }, [navigate]);

  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">About Trip-Planner</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Your trusted partner in creating unforgettable travel experiences
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Company Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Founded in 2025 by Raju Kar, Trip-Planner emerged from a simple yet powerful vision: to make travel planning 
              accessible, enjoyable, and stress-free for everyone. We believe that every journey should be 
              an adventure worth remembering.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our team of travel enthusiasts, technology experts, and local guides work together to create 
              personalized itineraries that go beyond the ordinary. We combine AI-powered recommendations 
              with human expertise to deliver experiences that truly matter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleStartPlanning}
                className="px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                Start Planning
              </Button>
              <Button 
                variant="outline" 
                onClick={handleContactUs}
                className="px-8 py-3 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                Contact Us
              </Button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="/a.jpg" 
              alt="Our team and mission" 
              className="w-full h-96 object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500"
            />
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5000+</div>
                <div className="text-sm text-gray-600">Trips Planned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To democratize travel planning by providing intelligent, personalized, and accessible tools 
              that empower every traveler to discover the world on their own terms, creating meaningful 
              connections and unforgettable memories.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">👁️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              To become the world's most trusted travel companion, where technology meets human insight 
              to create seamless, personalized, and sustainable travel experiences that inspire and 
              connect people across cultures and continents.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trust & Reliability</h3>
              <p className="text-gray-600">
                We build lasting relationships through transparency, honesty, and consistent delivery of exceptional service.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously evolve our technology and services to stay ahead of travel trends and user needs.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sustainability</h3>
              <p className="text-gray-600">
                We promote responsible tourism and sustainable travel practices that benefit local communities.
              </p>
            </div>
          </div>
        </div>

       

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-12 text-white text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Happy Travelers</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Countries Covered</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Trips Planned</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white p-12 rounded-2xl shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of travelers who trust Trip-Planner to create their perfect adventure. 
            Let us help you discover your next destination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleStartPlanning}
              className="px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Plan Your Trip
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToHome}
              className="px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

About.displayName = 'About';

export default About;
