import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} - The debounced value
 */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    console.log('⏱️ useDebounce: value changed to:', value, '- will update after', delay, 'ms');
    
    // Set timer để update debouncedValue sau delay
    const timer = setTimeout(() => {
      console.log('✅ useDebounce: timer fired - updating debouncedValue to:', value);
      setDebouncedValue(value);
    }, delay);

    // Clear timer nếu value thay đổi trước khi delay kết thúc
    return () => {
      console.log('🧹 useDebounce: clearing timer');
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
