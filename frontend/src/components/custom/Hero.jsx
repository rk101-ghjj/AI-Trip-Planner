import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Hero = memo(() => {
  const navigate = useNavigate()
  const isAuthed = useSelector((s)=>s.user.isAuthenticated)

  const handleGetStarted = useCallback(() => {
    if (!isAuthed) navigate('/signup')
    else navigate('/create-trip')
  }, [isAuthed, navigate])

  const handleLearnMore = useCallback(() => {
    navigate('/about')
  }, [navigate])

  return (
    <div className='relative min-h-[100vh] w-full overflow-hidden pt-20'>
      {/* Background gradient */}
      <div className='absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50' />
      <div className='absolute -top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl' />
      <div className='absolute -bottom-24 -right-24 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl' />

      {/* Main content container */}
      <div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]'>
          
          {/* Left side - Content */}
          <div className='flex flex-col items-start justify-center space-y-8'>
            {/* Image B above the title */}
            <div className='w-full max-w-md mx-auto lg:mx-0'>
              <img 
                src="/b.jpg" 
                alt="Travel inspiration" 
                className='w-full h-48 object-cover rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-500'
              />
            </div>

            {/* Main heading */}
            <div className='text-left space-y-4'>
              <h1 className='font-extrabold text-4xl md:text-5xl lg:text-6xl leading-tight'>
                <span className='text-primary'>Discover Your Next</span>
                <br />
                <span className='text-gray-800'>Adventure</span>
              </h1>
              <p className='text-gray-600 md:text-lg lg:text-xl max-w-lg leading-relaxed'>
                Plan your next trip with our easy-to-use trip planner. Find the perfect destination, create a detailed itinerary, and share your experience with friends and family.
              </p>
            </div>

            {/* CTA Button */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <Button 
                className='px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl' 
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                className='px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl'
                onClick={handleLearnMore}
              >
                Learn More
              </Button>
            </div>

            {/* Stats or features */}
            <div className='grid grid-cols-3 gap-8 pt-8'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>1000+</div>
                <div className='text-sm text-gray-600'>Happy Travelers</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>50+</div>
                <div className='text-sm text-gray-600'>Destinations</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-primary'>24/7</div>
                <div className='text-sm text-gray-600'>Support</div>
              </div>
            </div>
          </div>

          {/* Right side - Image A */}
          <div className='relative flex justify-center lg:justify-end'>
            <div className='relative'>
              {/* Main image */}
              <img 
                src="/a.jpg" 
                alt="Beautiful travel destination" 
                className='w-full max-w-lg h-[500px] object-cover rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-700'
              />
              
              {/* Floating elements for visual appeal */}
              <div className='absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
                <span className='text-2xl'>✈️</span>
              </div>
              <div className='absolute -bottom-4 -left-4 w-16 h-16 bg-green-400 rounded-full flex items-center justify-center shadow-lg animate-pulse'>
                <span className='text-xl'>🏖️</span>
              </div>
              <div className='absolute top-1/2 -left-8 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center shadow-lg animate-ping'>
                <span className='text-lg'>🗺️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className='absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/50 to-transparent pointer-events-none' />
    </div>
  ) 
});

Hero.displayName = 'Hero';

export default Hero;
