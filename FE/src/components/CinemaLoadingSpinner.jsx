import React, { useState, useEffect } from 'react';

const CinemaLoadingSpinner = ({ 
  type = 'film-reel', // 'film-reel', 'countdown', 'film-strip'
  message = 'Loading...',
  size = 'large' // 'small', 'medium', 'large'
}) => {
  const [countdown, setCountdown] = useState(5);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (type === 'countdown') {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    if (type === 'film-strip') {
      const interval = setInterval(() => {
        setFrame(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [type]);

  // Film Reel Spinner
  const renderFilmReel = () => {
    const sizeMap = { small: 60, medium: 80, large: 100 };
    const dimension = sizeMap[size];

    return (
      <div className="cinema-loading-container" style={{ textAlign: 'center' }}>
        <div 
          className="film-reel-spinner"
          style={{
            width: `${dimension}px`,
            height: `${dimension}px`,
            margin: '0 auto 20px',
            position: 'relative'
          }}
        >
          {/* Main reel */}
          <div 
            className="reel-outer"
            style={{
              width: '100%',
              height: '100%',
              border: '4px solid',
              borderImage: 'linear-gradient(135deg, #FFD700, #FF6B00) 1',
              borderRadius: '50%',
              position: 'relative',
              animation: 'filmReelSpin 2s linear infinite',
              boxShadow: '0 0 20px rgba(255, 107, 0, 0.5), inset 0 0 20px rgba(255, 215, 0, 0.3)'
            }}
          >
            {/* Center icon */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: `${dimension * 0.4}px`,
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
            }}>
              🎬
            </div>

            {/* Perforations (8 dots around) */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const radius = dimension * 0.35;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    background: 'linear-gradient(135deg, #FFD700, #FF6B00)',
                    borderRadius: '50%',
                    top: '50%',
                    left: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
                    animation: `perfBlink ${1 + i * 0.1}s ease-in-out infinite`
                  }}
                />
              );
            })}
          </div>

          {/* Motion blur effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(255, 215, 0, 0.2) 50%, transparent 100%)',
              animation: 'filmReelSpin 1s linear infinite',
              pointerEvents: 'none'
            }}
          />
        </div>

        <div style={{
          color: '#FFD700',
          fontSize: size === 'small' ? '14px' : size === 'medium' ? '16px' : '18px',
          fontWeight: '600',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          animation: 'textPulse 1.5s ease-in-out infinite'
        }}>
          {message}
        </div>

        {/* Frame counter */}
        <div style={{
          marginTop: '10px',
          color: '#FF6B00',
          fontSize: size === 'small' ? '12px' : '14px',
          fontFamily: 'monospace',
          opacity: 0.8
        }}>
          Frame {Math.floor(Date.now() / 100) % 100}/100
        </div>
      </div>
    );
  };

  // Cinema Countdown
  const renderCountdown = () => {
    return (
      <div className="cinema-countdown" style={{
        textAlign: 'center',
        padding: '40px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(10,10,10,1) 100%)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grain texture overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAElBMVEUAAAAAAAAAAAAAAAAAAAAAAADgKxmiAAAABnRSTlMCCwsPFBfyq8kSAAAAVklEQVQ4y2NgGAWjYBSMglEwEICRkZGBgVEABBhZQICRUQAMGBkF0AEjo8AoGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEwBwBvnQMW9V6hGAAAAABJRU5ErkJggg==)',
          opacity: 0.03,
          animation: 'grainMove 0.5s steps(1) infinite',
          pointerEvents: 'none'
        }} />

        {/* Scan lines */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          pointerEvents: 'none'
        }} />

        {/* Countdown number */}
        {countdown > 0 ? (
          <div
            key={countdown}
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 0 30px rgba(255, 255, 255, 0.8), 0 0 60px rgba(220, 38, 38, 0.6)',
              animation: 'countdownPop 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
              fontFamily: 'Impact, sans-serif',
              letterSpacing: '5px'
            }}
          >
            {countdown}
          </div>
        ) : (
          <div
            style={{
              fontSize: '60px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFD700, #FF6B00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'actionFlash 0.5s ease-out',
              fontFamily: 'Impact, sans-serif'
            }}
          >
            ACTION!
          </div>
        )}

        {/* Progress circle */}
        <svg width="200" height="200" style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%) rotate(-90deg)',
          opacity: 0.3
        }}>
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${(5 - countdown) * (565 / 5)} 565`}
            style={{ transition: 'stroke-dasharray 1s ease-out' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{
          marginTop: '30px',
          color: '#d1d5db',
          fontSize: '16px',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          fontFamily: 'monospace'
        }}>
          {message}
        </div>

        {/* Vignette */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.8) 100%)',
          pointerEvents: 'none'
        }} />
      </div>
    );
  };

  // Film Strip Progress Bar
  const renderFilmStrip = () => {
    return (
      <div className="film-strip-container" style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto 16px',
          background: '#0a0a0a',
          borderRadius: '8px',
          padding: '16px',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Film strip */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '12px',
            position: 'relative'
          }}>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '40px',
                  background: i < Math.floor(frame / 10) 
                    ? 'linear-gradient(135deg, #dc2626, #ef4444)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '2px',
                  position: 'relative',
                  transition: 'background 0.3s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Shimmer effect */}
                {i === Math.floor(frame / 10) && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shimmerSlide 1s ease-in-out infinite'
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Perforations */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            paddingTop: '8px'
          }}>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  background: i < Math.floor(frame / 10) ? '#FFD700' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  animation: i < Math.floor(frame / 10) ? 'perfBlink 0.5s ease-in-out infinite' : 'none',
                  boxShadow: i < Math.floor(frame / 10) ? '0 0 8px #FFD700' : 'none'
                }}
              />
            ))}
          </div>

          {/* Progress text */}
          <div style={{
            marginTop: '16px',
            color: '#FFD700',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'monospace'
          }}>
            {frame}% Complete
          </div>
        </div>

        <div style={{
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          {message}
        </div>
      </div>
    );
  };

  // Render based on type
  return (
    <>
      {type === 'film-reel' && renderFilmReel()}
      {type === 'countdown' && renderCountdown()}
      {type === 'film-strip' && renderFilmStrip()}

      {/* Animations */}
      <style jsx="true">{`
        @keyframes filmReelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes perfBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes textPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes countdownPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes actionFlash {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes grainMove {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          30% { transform: translate(3%, -15%); }
          50% { transform: translate(-5%, 5%); }
          70% { transform: translate(15%, 0%); }
          90% { transform: translate(-10%, 15%); }
        }

        @keyframes shimmerSlide {
          from { left: -100%; }
          to { left: 200%; }
        }
      `}</style>
    </>
  );
};

export default CinemaLoadingSpinner;

