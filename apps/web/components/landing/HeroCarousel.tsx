'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const slides = [
  {
    id: 1,
    title: 'Turn Manifestation Into Action',
    subtitle: 'Transform your dreams into daily habits',
    description: 'Bridge the gap between visualization and reality. Track your progress, build discipline, and manifest your goals through consistent action.',
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: 'from-purple-500 to-indigo-600',
    accentColor: 'purple',
  },
  {
    id: 2,
    title: 'Accountability Challenges',
    subtitle: 'Put stakes on the line and stay committed',
    description: 'Create challenges with real stakes. Invite accountability partners to verify your progress. Win your prize when you complete the challenge.',
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-600',
    accentColor: 'amber',
  },
  {
    id: 3,
    title: 'Daily Activity Tracker',
    subtitle: 'See all your activities in one place',
    description: 'View all activities due today organized by category and goal. Quick log your progress with a single tap and stay on track.',
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-green-500 to-teal-600',
    accentColor: 'green',
  },
  {
    id: 4,
    title: 'Goals & Activities System',
    subtitle: 'Build discipline with structured tracking',
    description: 'Organize your life with categories, SMART goals, and trackable activities. Monitor streaks, track different types of metrics, and build lasting habits.',
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-cyan-600',
    accentColor: 'blue',
  },
  {
    id: 5,
    title: 'Align Manifestation to Reality',
    subtitle: 'Daily actions that match your vision',
    description: 'Your manifestations guide your goals. Your goals drive your daily activities. Stay aligned and watch your dreams become reality through consistent action.',
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    gradient: 'from-pink-500 to-rose-600',
    accentColor: 'pink',
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Slide Content */}
      <div className="relative min-h-[650px] flex items-center justify-center px-8 py-20">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} opacity-10 transition-all duration-700`} />

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8 flex items-center justify-center">
            <div className={`p-6 rounded-2xl bg-gradient-to-br ${slide.gradient} text-white shadow-lg transform transition-transform duration-500 hover:scale-110`}>
              {slide.icon}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 transition-all duration-500">
            {slide.title}
          </h2>

          {/* Subtitle */}
          <p className={`text-2xl md:text-3xl font-semibold bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent mb-6 transition-all duration-500`}>
            {slide.subtitle}
          </p>

          {/* Description */}
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed transition-all duration-500">
            {slide.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className={`bg-gradient-to-r ${slide.gradient} text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105`}
            >
              Start Your Journey
            </Link>
            <Link
              href="/login"
              className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-white hover:shadow-lg"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'w-12 h-3 bg-slate-900'
                : 'w-3 h-3 bg-slate-400 hover:bg-slate-600'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Number Indicator */}
      <div className="absolute top-8 right-8 z-20 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
        <span className="text-sm font-semibold text-slate-900">
          {currentSlide + 1} / {slides.length}
        </span>
      </div>
    </div>
  );
}
