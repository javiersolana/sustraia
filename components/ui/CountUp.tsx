import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({ end, duration = 2000, suffix = "", className }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeValue = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(easeValue * end));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {count}{suffix}
    </span>
  );
};