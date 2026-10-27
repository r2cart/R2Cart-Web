import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — Triggers a CSS class when element enters viewport.
 * Uses IntersectionObserver for 60fps scroll performance.
 *
 * @param {string} revealClass - CSS class to add when visible (default: 'is-revealed')
 * @param {number} threshold - 0..1, how much of element must be visible (default: 0.12)
 * @param {string} rootMargin - Viewport margin (default: '0px 0px -60px 0px' — fires slightly before full entry)
 * @returns {ref} - Attach to the element you want to animate
 */
export function useScrollReveal(
  revealClass = 'is-revealed',
  threshold = 0.12,
  rootMargin = '0px 0px -60px 0px'
) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already visible (e.g. first-paint above fold), reveal immediately
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(revealClass);
          observer.unobserve(el); // animate only once
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealClass, threshold, rootMargin]);

  return ref;
}
