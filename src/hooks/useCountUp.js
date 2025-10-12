// src/hooks/useCountUp.js
import { animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInView } from 'react-intersection-observer';

/**
 * Custom hook to animate a number counting up.
 * @param {number} to - The number to animate to.
 * @param {number} duration - The duration of the animation in seconds.
 * @returns {React.MutableRefObject} - A ref to attach to the DOM element.
 */
// Added optional `format` param to customize the display (e.g., add suffixes)
export const useCountUp = (to, duration = 2, startOnView = true, threshold = 0.2, format) => {
  const nodeRef = useRef(null);
  const startedRef = useRef(false);
  const [inViewRef, inView] = useInView({ threshold, triggerOnce: true });

  // Merge refs so we can both observe and write to the node
  const setRefs = (node) => {
    nodeRef.current = node;
    inViewRef(node);
  };

  useEffect(() => {
    const shouldStart = startOnView ? inView : true;
    const node = nodeRef.current;
    if (!node || !shouldStart || startedRef.current) return;

    startedRef.current = true;
    const controls = animate(0, to, {
      duration,
      onUpdate(value) {
        const rounded = Math.round(value);
        node.textContent = typeof format === 'function' ? format(value, rounded, to) : rounded;
      },
    });

    return () => controls.stop();
  }, [to, duration, inView, startOnView]);

  return setRefs;
};