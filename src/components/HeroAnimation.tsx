'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface HeroAnimationProps {
  imagesCount?: number
  basePath?: string
  children?: React.ReactNode
  navbar?: React.ReactNode
}

export default function HeroAnimation({
  imagesCount = 110,
  basePath = '/images/hero-sequence/',
  children,
  navbar,
}: HeroAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  // Current frame state tracked via a ref for high-performance GSAP updates without React re-renders
  const animationState = useRef({ frame: 0 })

  // 1. Smart progressive preloading of the 110 image sequence
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = []
    let completed = 0

    // Progressive loader: preloads all images into memory
    for (let i = 1; i <= imagesCount; i++) {
      const img = new window.Image()
      img.src = `${basePath}chip (${i}).png`

      const handleLoad = () => {
        completed++
        setLoadedCount(completed)
        if (completed === imagesCount) {
          setIsLoaded(true)
        }
      }

      img.onload = handleLoad
      img.onerror = handleLoad // Fail-safe to avoid blocking on load errors

      loadedImages.push(img)
    }

    setImages(loadedImages)
  }, [imagesCount, basePath])

  // Helper to find the nearest loaded image to prevent empty frames during partial load
  const getNearestLoadedImage = (index: number): HTMLImageElement | null => {
    if (images.length === 0) return null

    // 1. Try exact requested frame
    const exactImg = images[index]
    if (exactImg && exactImg.complete) return exactImg

    // 2. Search backwards
    for (let i = index - 1; i >= 0; i--) {
      const prevImg = images[i]
      if (prevImg && prevImg.complete) return prevImg
    }

    // 3. Search forwards
    for (let i = index + 1; i < images.length; i++) {
      const nextImg = images[i]
      if (nextImg && nextImg.complete) return nextImg
    }

    return null
  }

  // 2. GSAP ScrollTrigger and Canvas Rendering
  useEffect(() => {
    // Only run if we have images and DOM refs
    if (images.length === 0 || !canvasRef.current || !containerRef.current || !wrapperRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Internal canvas resolution
    canvas.width = 1920
    canvas.height = 1080

    // Render function drawing the selected frame centered with a cover aspect ratio
    const render = () => {
      if (!context) return

      const currentFrame = Math.round(animationState.current.frame)
      const img = getNearestLoadedImage(currentFrame)

      if (img) {
        context.clearRect(0, 0, canvas.width, canvas.height)

        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const imgWidth = img.naturalWidth || img.width
        const imgHeight = img.naturalHeight || img.height

        if (imgWidth && imgHeight) {
          const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight)
          const x = canvasWidth / 2 - (imgWidth / 2) * scale
          const y = canvasHeight / 2 - (imgHeight / 2) * scale
          context.drawImage(img, x, y, imgWidth * scale, imgHeight * scale)
        } else {
          context.drawImage(img, 0, 0, canvasWidth, canvasHeight)
        }
      }
    }

    // Initial render of the first frame immediately
    render()

    // Trigger another render if loadedCount changes (updates resolution once cached)
    if (loadedCount > 0) {
      render()
    }

    // Desktop-only animation setup using gsap.matchMedia
    const mm = gsap.matchMedia()

    mm.add('(min-width: 1024px)', () => {
      // No pin — the container is already position:fixed.
      // The wrapper height (220vh) provides scroll distance for the animation.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',
          end: 'bottom top', // Animate across the full wrapper height
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      ScrollTrigger.sort()

      // Frame progression tween
      tl.to(
        animationState.current,
        {
          frame: imagesCount - 1,
          snap: 'frame',
          ease: 'none',
          onUpdate: render,
          duration: 1.2,
        },
        0,
      )

      // Cinematic text fade out and scale
      if (contentRef.current) {
        tl.to(
          contentRef.current,
          {
            opacity: 0,
            scale: 0.92,
            y: -30,
            ease: 'power1.inOut',
            duration: 1.2,
          },
          0,
        )
      }
    })

    return () => {
      mm.revert()
    }
  }, [images, loadedCount, imagesCount])

  // Calculate loading percentage
  const loadPercentage = Math.round((loadedCount / imagesCount) * 100)

  return (
    /* Wrapper: provides scroll height. 100vh visible + 120vh animation distance = 220vh total. */
    <div ref={wrapperRef} className="relative w-full bg-primary" style={{ height: '220vh' }}>
      {/* Fixed container: stays in place while the page scrolls past */}
      <div ref={containerRef} className="fixed top-0 left-0 w-full h-screen bg-primary overflow-hidden" style={{ zIndex: 0 }}>
        
        {/* Pinned Navbar */}
        {navbar}

        {/* Premium subtle loading progress indicator */}
        {!isLoaded && (
          <div className="absolute top-0 left-0 w-full h-[3px] bg-coal-800 z-50 transition-opacity duration-500">
            <div
              className="h-full bg-gradient-to-r from-erythro-500 to-gold-500 shadow-[0_0_8px_#E52421] transition-all duration-300"
              style={{ width: `${loadPercentage}%` }}
            />
          </div>
        )}

        {/* 1. Desktop Mode: HTML5 Canvas rendering */}
        <div className="hidden lg:flex w-full h-full items-center justify-center pointer-events-none select-none z-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover opacity-85 mix-blend-lighten dark:mix-blend-screen"
          />
        </div>

        {/* 2. Mobile/Tablet Fallback: Optimized next/image displaying first frame */}
        <div className="block lg:hidden absolute inset-0 z-0 select-none pointer-events-none">
          <Image
            src={`${basePath}chip (1).png`}
            alt="Erythro Neural Chip"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-75"
          />
        </div>

        {/* Dark overlay to dim the background image/animation */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ backgroundColor: 'var(--coal-alpha-30)' }}
        />

        {/* Overlay content layered on top of the animation */}
        <div
          ref={contentRef}
          className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none"
        >
          <div className="pointer-events-auto w-full h-full flex flex-col justify-center items-center">
            {children}
          </div>
        </div>

        {/* Ambient background gradients to tie canvas to the overall site theme */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--bg-primary)_90%)] z-0" />
      </div>
    </div>
  )
}
