import { useState, useCallback } from "react";

export function useCartAnimation() {
  const [animations, setAnimations] = useState<{ id: string; active: boolean }[]>([]);

  const triggerAnimation = useCallback((productId: string) => {
    // Add animation for this product
    setAnimations(prev => [...prev, { id: productId, active: true }]);
    
    // Remove animation after delay
    setTimeout(() => {
      setAnimations(prev => 
        prev.map(anim => 
          anim.id === productId ? { ...anim, active: false } : anim
        )
      );
      
      // Remove the animation entry after it's finished
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== productId));
      }, 300);
    }, 500);
  }, []);

  const isAnimating = useCallback((productId: string) => {
    const animation = animations.find(anim => anim.id === productId);
    return animation ? animation.active : false;
  }, [animations]);

  return { triggerAnimation, isAnimating };
}