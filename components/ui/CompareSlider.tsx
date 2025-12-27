import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

interface CompareSliderProps {
  leftImage: string;
  rightImage: string;
  leftLabel?: string;
  rightLabel?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  leftImage,
  rightImage,
  leftLabel = "Before",
  rightLabel = "After"
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    let clientX;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else {
      clientX = event.touches[0].clientX;
    }

    const position = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, position)));
  }, []);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("touchmove", handleMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[50vh] md:h-[600px] overflow-hidden rounded-2xl select-none cursor-ew-resize group shadow-2xl"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Right Image (After) - Background */}
      <img
        src={rightImage}
        alt="After"
        className="absolute top-0 left-0 w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Right Label */}
      <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold z-10 border border-white/10">
        {rightLabel}
      </div>

      {/* Left Image (Before) - Clipped */}
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={leftImage}
          alt="Before"
          className="absolute top-0 left-0 w-full h-full object-cover"
          draggable={false}
        />
        {/* Left Label */}
        <div className="absolute top-6 left-6 bg-sustraia-green/90 px-4 py-2 rounded-full text-sustraia-dark text-sm font-bold z-10">
            {leftLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-sustraia-dark transform transition-transform group-hover:scale-110">
          <ArrowLeftRight size={20} />
        </div>
      </div>
    </div>
  );
};