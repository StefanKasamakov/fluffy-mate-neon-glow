import { useSpring, animated } from "react-spring";
import { useEffect } from "react";

interface SuperLikeAnimationProps {
  isVisible: boolean;
  onComplete: () => void;
}

export const SuperLikeAnimation = ({ isVisible, onComplete }: SuperLikeAnimationProps) => {
  const [springs, api] = useSpring(() => ({
    scale: 0,
    opacity: 0,
    y: 0,
    config: { tension: 200, friction: 20 }
  }));

  useEffect(() => {
    if (isVisible) {
      api.start({
        scale: 1.5,
        opacity: 1,
        y: -200,
        config: { tension: 150, friction: 8 }
      });
      
      setTimeout(() => {
        api.start({
          scale: 0,
          opacity: 0,
          y: -400,
          config: { tension: 200, friction: 10 }
        });
        setTimeout(onComplete, 300);
      }, 800);
    }
  }, [isVisible, api, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <animated.div
        style={springs}
        className="text-8xl"
      >
        🚀
      </animated.div>
      <animated.div
        style={{
          ...springs,
          scale: springs.scale.to(s => s * 0.6)
        }}
        className="absolute text-6xl"
      >
        👅
      </animated.div>
      <animated.div
        style={{
          opacity: springs.opacity,
          scale: springs.scale.to(s => s * 0.8)
        }}
        className="absolute text-3xl font-bold text-neon-yellow drop-shadow-lg mt-20"
      >
        SUPER LICK!
      </animated.div>
    </div>
  );
};