import React from 'react';

/**
 * Yeshua Guide Logo Component
 * Renders the brand logo in various formats and sizes
 */

export const YeshuaGuideLogo = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const sizes = {
    xs: { icon: 24, wordmark: 120 },
    sm: { icon: 32, wordmark: 160 },
    md: { icon: 48, wordmark: 240 },
    lg: { icon: 64, wordmark: 320 },
    xl: { icon: 96, wordmark: 480 }
  };

  const s = sizes[size] || sizes.md;

  // Icon only version
  if (variant === 'icon') {
    return (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width={s.icon} 
        height={s.icon}
        className={className}
        aria-label="Yeshua Guide"
      >
        <defs>
          <linearGradient id="yg-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B06A"/>
            <stop offset="100%" stopColor="#C4A35A"/>
          </linearGradient>
          <linearGradient id="yg-navy" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2B3C4E"/>
            <stop offset="100%" stopColor="#1E2A3A"/>
          </linearGradient>
        </defs>
        
        {/* Background */}
        <circle cx="50" cy="50" r="48" fill="#F5F1E8"/>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#yg-gold)" strokeWidth="1" opacity="0.5"/>
        
        {/* Staff */}
        <path 
          d="M 47 70 L 47 35 Q 47 20 58 12 Q 68 5 68 18 Q 68 28 58 30 Q 52 32 49 38"
          fill="none" 
          stroke="url(#yg-navy)" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Dove */}
        <path 
          d="M 35 48 Q 42 32 62 36 Q 72 38 74 48 Q 72 51 67 51 L 38 55 Q 33 55 35 48"
          fill="url(#yg-gold)"
          opacity="0.85"
        />
        <path 
          d="M 42 46 Q 48 30 68 34 Q 60 42 55 46 Q 48 46 42 46"
          fill="#FEFCF9"
          opacity="0.9"
        />
        <circle cx="65" cy="40" r="2" fill="#1E2A3A"/>
      </svg>
    );
  }

  // Full logo with wordmark
  return (
    <div className={`yeshua-guide-logo ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Icon */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width={s.icon} 
        height={s.icon}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="yg-gold-full" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4B06A"/>
            <stop offset="100%" stopColor="#C4A35A"/>
          </linearGradient>
          <linearGradient id="yg-navy-full" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2B3C4E"/>
            <stop offset="100%" stopColor="#1E2A3A"/>
          </linearGradient>
        </defs>
        
        <circle cx="50" cy="50" r="48" fill="#F5F1E8"/>
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#yg-gold-full)" strokeWidth="1" opacity="0.5"/>
        
        <path 
          d="M 47 70 L 47 35 Q 47 20 58 12 Q 68 5 68 18 Q 68 28 58 30 Q 52 32 49 38"
          fill="none" 
          stroke="url(#yg-navy-full)" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        <path 
          d="M 35 48 Q 42 32 62 36 Q 72 38 74 48 Q 72 51 67 51 L 38 55 Q 33 55 35 48"
          fill="url(#yg-gold-full)"
          opacity="0.85"
        />
        <path 
          d="M 42 46 Q 48 30 68 34 Q 60 42 55 46 Q 48 46 42 46"
          fill="#FEFCF9"
          opacity="0.9"
        />
        <circle cx="65" cy="40" r="2" fill="#1E2A3A"/>
      </svg>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ 
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: s.icon * 0.65,
          fontWeight: 500,
          color: '#1E2A3A',
          letterSpacing: '0.08em'
        }}>
          YESHUA
        </span>
        <span style={{ 
          fontFamily: "'Source Sans Pro', sans-serif",
          fontSize: s.icon * 0.32,
          fontWeight: 300,
          color: '#6B5B4F',
          letterSpacing: '0.15em',
          marginTop: 2
        }}>
          GUIDE
        </span>
      </div>
    </div>
  );
};

/**
 * Animated loading logo
 */
export const YeshuaGuideLoading = ({ size = 48, className = '' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={size} 
      height={size}
      className={className}
      aria-label="Loading..."
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(196, 163, 90, 0.3)); }
          50% { filter: drop-shadow(0 0 8px rgba(196, 163, 90, 0.6)); }
        }
        .yg-pulse { animation: pulse 2s ease-in-out infinite; }
        .yg-glow { animation: glow 2s ease-in-out infinite; }
      `}</style>
      
      <defs>
        <linearGradient id="yg-gold-load" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4B06A"/>
          <stop offset="100%" stopColor="#C4A35A"/>
        </linearGradient>
      </defs>
      
      <circle cx="50" cy="50" r="48" fill="#F5F1E8"/>
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#yg-gold-load)" strokeWidth="1" className="yg-pulse"/>
      
      <g className="yg-glow">
        <path 
          d="M 47 70 L 47 35 Q 47 20 58 12 Q 68 5 68 18 Q 68 28 58 30 Q 52 32 49 38"
          fill="none" 
          stroke="#1E2A3A" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        <path 
          d="M 35 48 Q 42 32 62 36 Q 72 38 74 48 Q 72 51 67 51 L 38 55 Q 33 55 35 48"
          fill="url(#yg-gold-load)"
        />
      </g>
    </svg>
  );
};

export default YeshuaGuideLogo;
