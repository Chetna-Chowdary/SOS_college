
import React, { useState, useRef, useEffect } from 'react';

interface SOSButtonProps {
  onTrigger: () => void;
  disabled?: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger, disabled }) => {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const DURATION = 2000; // 2 seconds for safety

  const handleStart = () => {
    if (disabled) return;
    setPressing(true);
    startTimeRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        handleEnd(true);
      }
    }, 20);
  };

  const handleEnd = (triggered = false) => {
    setPressing(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (triggered || progress >= 100) {
      onTrigger();
    }
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center">
      {/* Visual background ripple when pressing */}
      {pressing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-red-100 rounded-full animate-ping opacity-75"></div>
        </div>
      )}

      {/* The main button */}
      <button
        onMouseDown={handleStart}
        onMouseUp={() => handleEnd(false)}
        onMouseLeave={() => handleEnd(false)}
        onTouchStart={handleStart}
        onTouchEnd={() => handleEnd(false)}
        className={`relative z-10 w-48 h-48 rounded-full shadow-2xl transition-all duration-300 transform active:scale-95 flex flex-col items-center justify-center
          ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 cursor-pointer'}
        `}
      >
        <span className="text-white text-3xl font-black tracking-widest mb-1">SOS</span>
        <span className="text-white text-xs font-medium uppercase opacity-90">
          {pressing ? 'Hold on...' : 'Press 2s'}
        </span>

        {/* Circular progress overlay */}
        {pressing && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="92"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={`${(progress * 5.78).toFixed(2)} 578`}
              className="opacity-40"
            />
          </svg>
        )}
      </button>
      
      <p className="mt-8 text-gray-500 text-sm font-medium animate-pulse">
        {pressing ? 'Sending alert in a moment...' : 'Secure connection established'}
      </p>
    </div>
  );
};

export default SOSButton;
