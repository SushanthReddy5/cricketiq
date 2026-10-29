import { useEffect, useRef } from 'react';
export default function useReveal(delay = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const items = el.querySelectorAll('.reveal,.reveal-l,.reveal-r');
        if (items.length) {
          items.forEach((it, i) => setTimeout(() => it.classList.add('on'), delay + i * 110));
        } else {
          setTimeout(() => el.classList.add('on'), delay);
        }
        obs.unobserve(el);
      }
    }, { threshold: 0.07 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}
