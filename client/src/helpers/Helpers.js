import { useRef, useEffect, useState } from 'react';

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

export function useInterval(callback, delay) {
    const savedCallback = useRef();
  
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

export const mapInfo = {
  'de_mirage': {
      scale: 5,
      x0: -3230,
      y0: 1713
  },
  'de_dust2': {
      scale: 7,
      x0: -3453,
      y0: 2887
  },
  'de_inferno': {
      scale: 4.9,
      x0: -2087,
      y0: 3870
  },
  'de_overpass': {
      scale: 5.2,
      x0: -4831,
      y0: 1781
  },
  'de_train': {
      scale: 4.7,
      x0: -2477,
      y0: 2392
  },
}