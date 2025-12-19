"use client";

import { useState, useEffect } from "react";
import { PromotionBanner } from "@/components/promotion-banner";

interface PromotionCarouselProps {
  banners: any[];
}

export function PromotionCarousel({ banners }: PromotionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset progress when currentIndex changes
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const duration = 3000; // 3 seconds
    const intervalTime = 50; // Update progress every 50ms
    const steps = duration / intervalTime;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) { // Using 99 instead of 100 to account for floating point precision
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
  }, [banners.length, currentIndex]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {/* Banner Display */}
      <div className="w-full flex justify-center">
        <PromotionBanner data={banners[currentIndex]} />
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-2 left-0 w-full px-4 z-20 flex gap-2">
        {banners.map((_, idx) => (
          <div
            key={idx}
            className="h-1.5 flex-1 rounded-full bg-black/20 overflow-hidden backdrop-blur-sm"
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
