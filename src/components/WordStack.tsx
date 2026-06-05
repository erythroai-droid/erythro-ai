'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface WordStackProps {
  words: string[] // Array of phrases pulled dynamically
  mode?: 'loop' | 'scroll' // Mode: cyclic loop or scroll-bound
}

export default function WordStack({ words, mode = 'loop' }: WordStackProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (wordsRef.current.length === 0) return

    // Using gsap.matchMedia for desktop-only animation triggers
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      // Runs ONLY on viewport >= 1024px
      if (mode === 'loop') {
        const tl = gsap.timeline({ repeat: -1 })
        
        wordsRef.current.forEach((word) => {
          if (!word) return
          tl.to(word, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: 'power2.out',
          })
          .to(word, {
            opacity: 0,
            scale: 1.5,
            duration: 0.6,
            ease: 'power2.in',
            delay: 1.2,
          })
        })
      } else if (mode === 'scroll') {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top center',
            end: '+=300',
            scrub: 1,
            pin: false, // Don't pin on simple embedded blocks
          },
        })

        wordsRef.current.forEach((word) => {
          if (!word) return
          tl.to(word, { opacity: 1, scale: 1, duration: 1 })
            .to(word, { opacity: 0, scale: 1.8, duration: 1 }, '+=0.5')
        })
      }
    })

    // Memory cleanup on component unmount or resize
    return () => mm.revert()
  }, [words, mode])

  return (
    <div 
      ref={containerRef} 
      className="s-words-stack relative w-full h-[60px] md:h-[90px] lg:h-[120px] flex items-center justify-center mb-space-l overflow-hidden"
    >
      <div className="relative w-full h-full">
        {words.map((word, index) => {
          const isBorderEffect = index % 2 !== 0
          
          return (
            <div
              key={index}
              ref={(el) => {
                if (el) wordsRef.current[index] = el
              }}
              className={`
                absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 
                font-sans text-[2.2rem] md:text-[3.5rem] lg:text-[4.5rem] font-extrabold uppercase tracking-wider 
                will-change-[transform,opacity] origin-center whitespace-nowrap
                ${index === 0 
                  ? 'opacity-100 scale-100 block' 
                  : 'opacity-0 lg:opacity-0 scale-50 hidden lg:block'
                }
                ${isBorderEffect 
                  ? 'text-transparent [ -webkit-text-stroke:1.5px_#E52421 ] dark:[ -webkit-text-stroke:1.5px_#FFE9C7 ] lg:[ -webkit-text-stroke:2px_#E52421 ] dark:lg:[ -webkit-text-stroke:2px_#FFE9C7 ]' 
                  : 'text-erythro-500 dark:text-gold-500'
                }
              `}
            >
              {word}
            </div>
          )
        })}
      </div>
    </div>
  )
}
