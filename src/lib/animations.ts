// Animation utilities for the application

/**
 * Applies a shake animation to an element
 * @param element The DOM element to animate
 * @param duration Duration of the animation in ms
 */
export function applyShakeAnimation(element: HTMLElement | null, duration = 500) {
  if (!element) return;
  
  // Add shake animation class
  element.classList.add('shake-animation');
  
  // Remove the class after animation completes
  setTimeout(() => {
    element.classList.remove('shake-animation');
  }, duration);
}
