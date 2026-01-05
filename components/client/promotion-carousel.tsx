"use client";

import { useState, useEffect, useRef } from "react";
import { PromotionBanner } from "@/components/promotion-banner";

interface PromotionCarouselProps {
  banners: any[];
}

export function PromotionCarousel({ banners }: PromotionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const dragStartTime = useRef(0);

  useEffect(() => {
    // Reset progress when currentIndex changes
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    // Only set up auto-rotation if user is not interacting
    if (isDragging) return;
    
    const duration = 3000; // 3 seconds
    const intervalTime = 50; // Update progress every 50ms
    const steps = duration / intervalTime;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          // Using 99 instead of 100 to account for floating point precision
          return 0;
        }
        return prev + 100 / steps;
      });
    }, intervalTime);

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [banners.length, currentIndex, isDragging]);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
    currentX.current = clientX;
    dragStartTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    currentX.current = clientX;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diffX = currentX.current - startX.current;
    const dragDuration = Date.now() - dragStartTime.current;
    
    // Minimum swipe distance (in pixels) or quick flick
    const minSwipeDistance = 50;
    const minFlickSpeed = 0.5; // pixels per ms
    
    const isQuickSwipe = Math.abs(diffX) / dragDuration > minFlickSpeed;
    const isLongSwipe = Math.abs(diffX) > minSwipeDistance;
    
    if (isQuickSwipe || isLongSwipe) {
      if (diffX > 0) {
        // Swipe right - go to previous
        setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
      } else {
        // Swipe left - go to next
        setCurrentIndex(prev => (prev + 1) % banners.length);
      }
    }
    
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleTouchStart(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleTouchMove(e);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="w-full flex flex-col items-center px-4">
      <div 
        className="relative w-full max-w-[90vw] sm:max-w-[396px] mx-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <PromotionBanner data={banners[currentIndex]} />
      </div>
      <div className="mt-2 w-full max-w-[90vw] sm:max-w-[396px] mx-auto px-2 flex gap-2">
        {banners.map((_, idx) => (
          <div
            key={idx}
            className="h-1.5 flex-1 rounded-full bg-black/20 overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{
                width:
                  idx === currentIndex
                    ? `${progress}%`
                    : idx < currentIndex
                    ? "100%"
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
