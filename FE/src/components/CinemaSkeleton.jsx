import React from 'react';

const CinemaSkeleton = ({ type = 'movie-card', count = 1 }) => {
  // Skeleton shimmer animation
  const shimmerStyle = {
    background: 'linear-gradient(90deg, #1a1a1a 25%, #262626 50%, #1a1a1a 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s ease-in-out infinite'
  };

  // Movie Card Skeleton
  const renderMovieCard = () => (
    <div style={{
      marginBottom: '48px',
      padding: '24px',
      background: 'var(--surface-1)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
        {/* Poster skeleton */}
        <div
          style={{
            width: '150px',
            height: '225px',
            borderRadius: '12px',
            ...shimmerStyle
          }}
        />
        
        {/* Info skeleton */}
        <div style={{ flex: 1 }}>
          {/* Title */}
          <div
            style={{
              width: '60%',
              height: '32px',
              marginBottom: '16px',
              borderRadius: '8px',
              ...shimmerStyle
            }}
          />
          
          {/* Meta info */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '120px', height: '20px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '80px', height: '20px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '100px', height: '20px', borderRadius: '4px', ...shimmerStyle }} />
          </div>
          
          {/* Tags */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '24px', borderRadius: '12px', ...shimmerStyle }} />
            <div style={{ width: '80px', height: '24px', borderRadius: '12px', ...shimmerStyle }} />
          </div>
          
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <div style={{ width: '120px', height: '40px', borderRadius: '20px', ...shimmerStyle }} />
            <div style={{ width: '140px', height: '40px', borderRadius: '20px', ...shimmerStyle }} />
          </div>
        </div>
      </div>

      {/* Showtimes skeleton */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ width: '150px', height: '24px', marginBottom: '16px', borderRadius: '6px', ...shimmerStyle }} />
        
        <div style={{ marginBottom: '16px' }}>
          <div style={{ width: '200px', height: '20px', marginBottom: '12px', borderRadius: '4px', ...shimmerStyle }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '120px',
                  height: '60px',
                  borderRadius: '8px',
                  ...shimmerStyle,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Time Slot Skeleton
  const renderTimeSlots = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            width: '120px',
            height: '60px',
            borderRadius: '8px',
            ...shimmerStyle,
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
    </div>
  );

  // Branch Card Skeleton
  const renderBranchCard = () => (
    <div style={{
      padding: '16px',
      marginBottom: '16px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* Branch header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ width: '250px', height: '20px', marginBottom: '8px', borderRadius: '4px', ...shimmerStyle }} />
        <div style={{ width: '300px', height: '16px', borderRadius: '4px', ...shimmerStyle }} />
      </div>

      {/* Movies */}
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '60px', height: '90px', borderRadius: '6px', ...shimmerStyle }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '200px', height: '18px', marginBottom: '8px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ width: '100px', height: '14px', marginBottom: '12px', borderRadius: '4px', ...shimmerStyle }} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[...Array(5)].map((_, j) => (
                <div
                  key={j}
                  style={{
                    width: '100px',
                    height: '50px',
                    borderRadius: '6px',
                    ...shimmerStyle,
                    animationDelay: `${j * 0.05}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Timeline Item Skeleton
  const renderTimelineItem = () => (
    <div style={{
      display: 'flex',
      gap: '24px',
      marginBottom: '24px',
      padding: '16px',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.05)',
      borderLeft: '4px solid rgba(220, 38, 38, 0.3)'
    }}>
      {/* Time */}
      <div style={{ minWidth: '80px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '32px', marginBottom: '8px', borderRadius: '8px', ...shimmerStyle }} />
        <div style={{ width: '60px', height: '16px', borderRadius: '4px', ...shimmerStyle, margin: '0 auto' }} />
      </div>

      {/* Poster */}
      <div style={{ width: '60px', height: '90px', borderRadius: '8px', ...shimmerStyle }} />

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ width: '70%', height: '24px', marginBottom: '12px', borderRadius: '6px', ...shimmerStyle }} />
        <div style={{ width: '50%', height: '16px', marginBottom: '12px', borderRadius: '4px', ...shimmerStyle }} />
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '80px',
                height: '24px',
                borderRadius: '12px',
                ...shimmerStyle,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Button */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100px', height: '40px', borderRadius: '20px', ...shimmerStyle }} />
      </div>
    </div>
  );

  // Cinema Chain Header Skeleton
  const renderChainHeader = () => (
    <div style={{
      marginBottom: '32px',
      padding: '24px',
      background: 'var(--surface-1)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', ...shimmerStyle }} />
        <div style={{ width: '200px', height: '32px', borderRadius: '8px', ...shimmerStyle }} />
        <div style={{ width: '60px', height: '28px', borderRadius: '14px', ...shimmerStyle }} />
      </div>
      
      {renderBranchCard()}
      {renderBranchCard()}
    </div>
  );

  // Filter Bar Skeleton
  const renderFilterBar = () => (
    <div style={{
      padding: '24px',
      background: 'var(--surface-1)',
      borderRadius: '16px',
      marginBottom: '32px',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      {/* View tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '120px',
              height: '40px',
              borderRadius: '8px',
              ...shimmerStyle,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      {/* Date selector */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ width: '100px', height: '20px', marginBottom: '12px', borderRadius: '4px', ...shimmerStyle }} />
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '100px',
                height: '60px',
                borderRadius: '8px',
                ...shimmerStyle,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Filter dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: '40px',
              borderRadius: '8px',
              ...shimmerStyle,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  // Render based on type and count
  const renderSkeleton = () => {
    switch (type) {
      case 'movie-card':
        return [...Array(count)].map((_, i) => <div key={i}>{renderMovieCard()}</div>);
      case 'time-slots':
        return renderTimeSlots();
      case 'branch-card':
        return [...Array(count)].map((_, i) => <div key={i}>{renderBranchCard()}</div>);
      case 'timeline':
        return [...Array(count)].map((_, i) => <div key={i}>{renderTimelineItem()}</div>);
      case 'chain-header':
        return [...Array(count)].map((_, i) => <div key={i}>{renderChainHeader()}</div>);
      case 'filter-bar':
        return renderFilterBar();
      default:
        return null;
    }
  };

  return (
    <>
      {renderSkeleton()}

      <style jsx="true">{`
        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </>
  );
};

export default CinemaSkeleton;

