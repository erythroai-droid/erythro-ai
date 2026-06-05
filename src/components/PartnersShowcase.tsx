'use client'

import React from 'react'

// Defined high-fidelity, premium SVG logos for the tech partners
const brandLogos = [
  {
    name: 'Next.js',
    colorClass: 'group-hover:text-black dark:group-hover:text-white',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <path d="M90 0C40.29 0 0 40.29 0 90s40.29 90 90 90 90-40.29 90-90S139.71 0 90 0zM141.7 131.7L97.5 73.1v58.6H84.3V48.3h13.2l44.2 58.6V48.3h13.2v83.4h-13z" />
      </svg>
    ),
  },
  {
    name: 'Vercel',
    colorClass: 'group-hover:text-black dark:group-hover:text-white',
    svg: (
      <svg className="h-5 md:h-7 fill-current transition-colors duration-300" viewBox="0 0 115 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M57.5 0L115 100H0L57.5 0Z" />
      </svg>
    ),
  },
  {
    name: 'React',
    colorClass: 'group-hover:text-[#61DAFB]',
    svg: (
      <svg className="h-6 md:h-8 fill-none stroke-current transition-colors duration-300" viewBox="-11.5 -10.23174 23 20.46348" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
        <circle cx="0" cy="0" r="2.05" fill="currentColor" stroke="none" />
        <g stroke="currentColor">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    name: 'GSAP',
    colorClass: 'group-hover:text-[#88CE02]',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="22" fontFamily="sans-serif" fontWeight="900" fontSize="20">GSAP</text>
      </svg>
    ),
  },
  {
    name: 'Figma',
    colorClass: 'group-hover:text-[#F24E1E]',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 90c8.284 0 15-6.716 15-15V60H15c-8.284 0-15 6.716-15 15s6.716 15 15 15zM15 30h15V0H15C6.716 0 0 6.716 0 15s6.716 15 15 15zM45 30c8.284 0 15-6.716 15-15S53.284 0 45 0s-15 6.716-15 15 6.716 15 15 15zM15 60h15V30H15c-8.284 0-15 6.716-15 15s6.716 15 15 15zM45 60c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15z" />
      </svg>
    ),
  },
  {
    name: 'Adobe',
    colorClass: 'group-hover:text-[#FF0000]',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M62 10h28v80L62 10zm-24 0H10v80l28-80zm12 28.5L71.5 90H56.3l-7-16H34.5l15.5-35.5z" />
      </svg>
    ),
  },
  {
    name: 'WordPress',
    colorClass: 'group-hover:text-[#21759B]',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
        <path d="M90 0C40.29 0 0 40.29 0 90s40.29 90 90 90 90-40.29 90-90S139.71 0 90 0zm0 170c-44.11 0-80-35.89-80-80 0-5.74.61-11.34 1.77-16.75l45.47 124.57c10.45 6.64 22.86 10.51 36.1 10.51 5.92 0 11.66-.77 17.15-2.22L61.76 68.32C61.76 68.32 61 62.46 61 58c0-7.32 4.1-14.63 4.1-14.63s1.46-2.93 4.39-2.93H70c2.93 0 2.2 4.39 2.2 4.39s.73 3.66.73 7.32c0 3.66-2.2 8.78-4.39 12.44L94.75 145.7l23.51-69.57c-2.2-3.66-4.39-8.78-4.39-12.44 0-3.66.73-7.32.73-7.32s-.73-4.39 2.2-4.39H118c2.93 0 4.39 2.93 4.39 2.93s4.1 7.31 4.1 14.63c0 1.55-.26 3.29-.6 5.17l-35.89 98.7C130.66 170.82 111.08 170 90 170z" />
      </svg>
    ),
  },
  {
    name: 'Spring',
    colorClass: 'group-hover:text-[#6DB33F]',
    svg: (
      <svg className="h-6 md:h-8 fill-current transition-colors duration-300" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
        <text x="5" y="22" fontFamily="sans-serif" fontWeight="900" fontSize="20">Spring</text>
      </svg>
    ),
  },
]

export default function PartnersShowcase() {
  return (
    <div className="w-full py-12 bg-coal-900 border-t border-b border-coal-800 overflow-hidden select-none">
      <div className="max-w-[1170px] mx-auto px-[30px] mb-8">
        <h3 className="font-sans text-xs font-bold text-center tracking-widest text-coal-300 uppercase">
          Erythro.ai Ecosystem Technology Partners
        </h3>
      </div>
      
      {/* Infinite loop animation belt container */}
      <div className="relative w-full overflow-hidden flex flex-nowrap">
        {/* Row 1 */}
        <div className="flex gap-16 md:gap-24 shrink-0 animate-marquee items-center justify-around min-w-full">
          {brandLogos.map((brand, i) => (
            <div
              key={`marquee-1-${i}`}
              className={`group flex flex-col items-center justify-center text-coal-400 hover:text-white transition-all duration-300 ease-in-out cursor-pointer hover:scale-110 ${brand.colorClass}`}
            >
              {brand.svg}
              <span className="mt-2 text-[10px] tracking-widest font-mono text-coal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase">
                {brand.name}
              </span>
            </div>
          ))}
        </div>

        {/* Cloned Row 2 for seamless infinite scroll */}
        <div className="flex gap-16 md:gap-24 shrink-0 animate-marquee items-center justify-around min-w-full" aria-hidden="true">
          {brandLogos.map((brand, i) => (
            <div
              key={`marquee-2-${i}`}
              className={`group flex flex-col items-center justify-center text-coal-400 hover:text-white transition-all duration-300 ease-in-out cursor-pointer hover:scale-110 ${brand.colorClass}`}
            >
              {brand.svg}
              <span className="mt-2 text-[10px] tracking-widest font-mono text-coal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase">
                {brand.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
