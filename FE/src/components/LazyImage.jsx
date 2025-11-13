import React, { useState, useEffect, useRef } from 'react';

/**
 * LazyImage Component - Optimized image loading with Intersection Observer
 * 
 * Features:
 * - Lazy loading with IntersectionObserver
 * - Blur-up placeholder effect
 * - Error handling with fallback
 * - Loading state
 * - Responsive
 */
const LazyImage = ({
  src,
  alt = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%231a1a1a" width="1" height="1"/%3E%3C/svg%3E',
  fallback = 'https://via.placeholder.com/300x450?text=No+Image',
  className = '',
  style = {},
  aspectRatio = '2/3', // Default for movie posters
  blurEffect = true,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start loading the image
            loadImage(src);
            // Stop observing after loading starts
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.01
      }
    );

    // Start observing
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src]);

  const loadImage = (imageSrc) => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(imageSrc);
      setImageLoaded(true);
      setImageError(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setImageSrc(fallback);
      setImageError(true);
      setImageLoaded(true);
      if (onError) onError();
    };

    img.src = imageSrc;
  };

  return (
    <div
      ref={imgRef}
      className={`lazy-image-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspectRatio,
        overflow: 'hidden',
        background: '#1a1a1a',
        ...style
      }}
    >
      <img
        src={imageSrc}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: blurEffect ? 'filter 0.3s ease-out, opacity 0.3s ease-out' : 'opacity 0.3s ease-out',
          filter: blurEffect && !imageLoaded ? 'blur(10px)' : 'blur(0)',
          opacity: imageLoaded ? 1 : 0.5,
          transform: imageLoaded ? 'scale(1)' : 'scale(1.1)'
        }}
        {...props}
      />

      {/* Loading Spinner */}
      {!imageLoaded && !imageError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30px',
            height: '30px',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}

      {/* Error Icon */}
      {imageError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '40px',
            opacity: 0.3
          }}
        >
          🎬
        </div>
      )}

      <style jsx="true">{`
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;

