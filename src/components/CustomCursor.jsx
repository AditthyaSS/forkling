import { useEffect, useRef, useState } from 'react';

// Elements that should trigger the "hover" state on the cursor
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], input, textarea, select, .chip, .card-hover, .card-hover-models, [data-cursor-hover]';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    // Skip on touch devices and for users who prefer reduced motion
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouchDevice || prefersReducedMotion) {
      return;
    }

    setEnabled(true);
    document.documentElement.classList.add('custom-cursor-active');

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let animationFrameId;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      }
    };

    const animateRing = () => {
      // Ease the ring toward the dot for a smooth trailing effect
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringX}px, ${ringY}px)`;
      }
      animationFrameId = requestAnimationFrame(animateRing);
    };

    const handleMouseOver = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) setIsHovering(true);
    };
    const handleMouseOut = (e) => {
      if (e.target.closest(INTERACTIVE_SELECTOR)) setIsHovering(false);
    };
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeaveWindow = () => setIsHovering(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeaveWindow);

    animationFrameId = requestAnimationFrame(animateRing);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeaveWindow);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className={`custom-cursor-dot ${isClicking ? 'custom-cursor-dot--click' : ''}`} />
      <div
        ref={ringRef}
        className={`custom-cursor-ring ${isHovering ? 'custom-cursor-ring--hover' : ''} ${isClicking ? 'custom-cursor-ring--click' : ''}`}
      />
    </>
  );
}