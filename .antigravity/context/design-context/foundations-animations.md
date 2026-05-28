### Эффект динамического стека слов (Word Stack Showcase)

Реализация эффектной смены фраз (на основе стека сайта _wearebouldergroup.com_) для блока перед кнопкой **LET'S TALK...** (секциях _Let's Talk_, _Solution_ или _Services_).

#### А. Архитектурные правила для ИИ (Next.js + Tailwind + GSAP)

- **Изоляция компонента:** Блок должен быть оформлен как изолированный клиентский компонент `components/WordStack.tsx` (`'use client'`).
    
- **Десктопный таргет (Desktop Only):** Инициализация GSAP-таймлайна строго завернута в `gsap.matchMedia()` с брейкпоинтом `(min-width: 1024px)`. На экранах меньше 1024px (планшеты и мобильные) анимация полностью отключается.
    
- **Моб. фолбек (Fallback):** На мобильных устройствах отображается только первое слово из переданного массива в статичном виде. Никаких скрытых слоев с `opacity: 0` или прыжков высоты.
    
- **Декларативные стили:** Все стили наложения и обводки пишутся через утилиты Tailwind CSS.
    
- **Локализация и RTL-совместимость:** * При переключении на локаль `he` (иврит) шрифт автоматически меняется на **Inter** согласно `foundations-typography.md`.
    
    - Запрещено использовать направленные свойства трансформации. Анимация масштабирования должна происходить строго по центру (`origin-center`).
        

#### Эталонный JSX-шаблон компонента для ИИ

TypeScript

```
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface WordStackProps {
  words: string[]; // Массив фраз подтягивается динамически из Payload CMS
  mode?: 'loop' | 'scroll'; // Режим: цикличный loop или привязанный к скроллу
}

export default function WordStack({ words, mode = 'loop' }: WordStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (wordsRef.current.length === 0) return;

    // Использование gsap.matchMedia для запуска анимации только на десктопе
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      // Этот блок выполнится ТОЛЬКО на экранах >= 1024px
      if (mode === 'loop') {
        const tl = gsap.timeline({ repeat: -1 });
        
        wordsRef.current.forEach((word) => {
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
          });
        });
      } else if (mode === 'scroll') {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top center',
            end: '+=300',
            scrub: 1,
            pin: true,
          },
        });

        wordsRef.current.forEach((word) => {
          tl.to(word, { opacity: 1, scale: 1, duration: 1 })
            .to(word, { opacity: 0, scale: 1.8, duration: 1 }, '+=0.5');
        });
      }
    });

    // Очистка при размонтировании компонента или ресайзе обратно на мобилку
    return () => mm.revert();
  }, [words, mode]);

  return (
    <div 
      ref={containerRef} 
      className="s-words-stack relative w-full h-[80px] lg:h-[180px] flex items-center justify-center mb-space-l overflow-hidden"
    >
      <div className="relative w-full h-full">
        {words.map((word, index) => {
          const isBorderEffect = index % 2 !== 0;
          
          return (
            <div
              key={index}
              ref={(el) => { if (el) wordsRef.current[index] = el; }}
              {/* На мобильных (lg:absolute скрывает лишнее):
                - Первое слово (index === 0) отображается статично: opacity-100, scale-100
                - Остальные слова скрыты через lg:opacity-0 и мобильный скрывающий класс hidden lg:block
              */}
              className={`
                absolute lg:absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 
                font-inter text-[2.2rem] md:text-[3.5rem] lg:text-[4.5rem] font-extrabold uppercase tracking-wider 
                will-change-[transform,opacity] origin-center white-space-nowrap
                ${index === 0 
                  ? 'opacity-100 scale-100 block' 
                  : 'opacity-0 lg:opacity-0 scale-50 hidden lg:block'
                }
                ${isBorderEffect 
                  ? 'text-transparent [ -webkit-text-stroke:1.5px_#ffffff ] lg:[ -webkit-text-stroke:2px_#ffffff ]' 
                  : 'text-brand-cream'
                }
              `}
            >
              {word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## ⚠️ РЕГЛАМЕНТ СЛОЖНЫХ АНИМАЦИЙ: Покадровая анимация Hero-блока (Image Sequence + GSAP)

### А. Общие требования и оптимизация
- **Изоляция компонента:** Блок должен быть оформлен как изолированный клиентский компонент `components/HeroAnimation.tsx` (`'use client'`).
- **Стек:** HTML5 Canvas, JavaScript, GSAP (ScrollTrigger). Запрещено использовать анимацию через прямую смену `src` у тега `<img>`, так как это вызывает мерцание. Отрисовка должна происходить строго на элементе `<canvas>`.
- **Десктопный таргет (Desktop Only):** Инициализация Canvas и GSAP-таймлайна для скролла заворачивается строго в `gsap.matchMedia()` с брейкпоинтом `(min-width: 1024px)`. На экранах менее 1024px (планшеты и мобильные) Canvas полностью скрывается (`hidden lg:block`), чтобы сберечь батарею и производительность смартфона.
- **Мобильный фолбек (Fallback):** На мобильных устройствах вместо тяжелой анимации отображается статичное оптимизированное изображение (например, первый или ключевой кадр последовательности) через компонент `next/image`.
- **Предзагрузка (Preloading):** ИИ должен реализовать механизм предварительной загрузки (preloading) всех изображений в массив перед запуском анимации, чтобы при скролле не было пустых кадров.

### Б. Эталонный JSX-шаблон компонента для ИИ

При генерации кода ИИ обязан использовать следующий паттерн:

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HeroAnimationProps {
  imagesCount: number; // Общее количество кадров (например, 60)
  basePath: string;    // Путь к папке с кадрами, например: '/images/hero-sequence/'
}

export default function HeroAnimation({ imagesCount = 124, basePath = '/images/hero-sequence/' }: HeroAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Состояние текущего кадра для триггера анимации
  const airpods = useRef({ frame: 0 });

  // 1. Предзагрузка изображений в кэш браузера
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;

    for (let i = 1; i <= imagesCount; i++) {
      const img = new window.Image();
      // Форматирование индекса кадра, например: 0001.png, 0002.png...
      const frameIndex = String(i).padStart(4, '0');
      img.src = `${basePath}${frameIndex}.png`;
      img.onload = () => {
        count++;
        if (count === imagesCount) {
          setIsLoaded(true);
        }
      };
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, [imagesCount, basePath]);

  // 2. Инициализация GSAP ScrollTrigger и рендеринг на Canvas
  useEffect(() => {
    if (!isLoaded || images.length === 0 || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Адаптивный размер canvas под контейнер
    canvas.width = 1920;
    canvas.height = 1080;

    const render = () => {
      if (context && images[airpods.current.frame]) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(images[airpods.current.frame], 0, 0, canvas.width, canvas.height);
      }
    };

    // Отрисовка первого кадра сразу после загрузки
    render();

    // Запуск GSAP только для Desktop (Antigravity 2.0 / Стрикт адаптивности)
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      gsap.to(airpods.current, {
        frame: imagesCount - 1,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=200%', // Длина скролла для полной анимации
          scrub: 1,      // Плавность следования за скроллом (1 сек задержки для мягкости)
          pin: true,     // Фиксация Hero-блока на экране во время анимации
        },
        onUpdate: render, // Перерисовывать Canvas при каждом изменении кадра
      });
    });

    return () => mm.revert(); // Чистка памяти при размонтировании
  }, [isLoaded, images, imagesCount]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-primary overflow-hidden">
      {/* 1. Десктопная версия: Анимация на Canvas */}
      <div className="hidden lg:flex w-full h-full items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      </div>

      {/* 2. Мобильный фолбек: Статичный оптимизированный кадр */}
      <div className="block lg:hidden relative w-full h-full">
        <Image 
          src={`${basePath}0001.png`} // Показываем только первый статичный кадр
          alt="Erythro Hero Visual"
          fill
          priority
          className="object-cover"
        />
      </div>
      
      {/* Сверху накладывается контент Hero-блока (Заголовки, кнопки) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center pointer-events-none">
        {/* Контент, заголовки, разметка из макета */}
      </div>
    </div>
  );
}