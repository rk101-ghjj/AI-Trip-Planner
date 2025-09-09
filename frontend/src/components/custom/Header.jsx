import React, { memo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const Header = memo(() => {
  const navigate = useNavigate()

  const handleHelpClick = useCallback(() => {
    navigate('/help');
  }, [navigate]);

  return (
    <>
      <div className='w-full fixed top-0 left-0 z-50 border-b bg-background/80 supports-[backdrop-filter]:backdrop-blur'>
        <div className='w-full flex justify-between items-center px-2 sm:px-3 py-2'>
          <div className='flex items-center gap-2'>
            <img src="/logo.svg" alt="logo" className='w-10 h-10' />
            <span className='font-black italic text-xl sm:text-2xl md:text-3xl text-[#00DC33]'>Trip-Planner</span>
          </div>
          <div className='ml-auto'>
            <Button 
              onClick={handleHelpClick}
              className="hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
            >
              Help
            </Button>
          </div>
        </div>
      </div>
    </>
  )
});

Header.displayName = 'Header';

export default Header
