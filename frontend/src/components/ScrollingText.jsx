import React, { useState, useEffect, useRef } from 'react';

const ScrollingText = ({ text, textClass, hoverOnly = false }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current && textRef.current.children[0]) {
        const textSpan = textRef.current.children[0];
        // Ensure span is inline-block to measure its true unrestricted width
        textSpan.style.display = 'inline-block';
        const singleTextWidth = textSpan.scrollWidth;
        textSpan.style.display = '';
        
        setIsOverflowing(singleTextWidth > containerRef.current.clientWidth);
      }
    };
    
    // Slight delay to ensure DOM is fully rendered before measuring
    const timeout = setTimeout(checkOverflow, 50);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  return (
    <div ref={containerRef} className="scrolling-container">
      <div 
        ref={textRef} 
        className={`${isOverflowing ? 'scrolling-text-animate' : 'text-truncate'} ${textClass || ''} ${hoverOnly && isOverflowing ? 'hover-only-scroll' : ''}`}
      >
        <span className="scroll-item">{text}</span>
        {isOverflowing && <span className="scroll-item">{text}</span>}
      </div>
    </div>
  );
};

export default ScrollingText;
