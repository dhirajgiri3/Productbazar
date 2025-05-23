import * as React from "react";
import { cn } from "../../lib/utils";
import confetti from "canvas-confetti";

// Helper function for random values
const randomInRange = (min, max) => Math.random() * (max - min) + min;

// Enhanced confetti with multiple effects
const triggerConfetti = (colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"], options = {}) => {
  const duration = options.duration || 3000;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    shapes: options.shapes || ["circle", "square"],
    scalar: options.scalar || 1,
    gravity: options.gravity || 1,
    drift: options.drift || 0,
    decay: options.decay || 0.94
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.3) },
      colors,
    });
  }, 250);

  return interval;
};

// Firework effect
const triggerFireworks = (colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"]) => {
  const myConfetti = confetti.create(null, { resize: true, useWorker: true });

  // Center blast
  myConfetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors,
    shapes: ["circle", "square"],
    gravity: 1.2,
    scalar: 1.2,
    ticks: 300
  });

  // Side blasts with slight delay
  setTimeout(() => {
    // Left side blast
    myConfetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.5 },
      colors,
      shapes: ["circle", "square"],
      gravity: 1.2,
      scalar: 1.2,
      ticks: 300
    });

    // Right side blast
    myConfetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.5 },
      colors,
      shapes: ["circle", "square"],
      gravity: 1.2,
      scalar: 1.2,
      ticks: 300
    });
  }, 300);
};

// Glitter effect
const triggerGlitter = (colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"]) => {
  const myConfetti = confetti.create(null, { resize: true, useWorker: true });

  myConfetti({
    particleCount: 60,
    angle: randomInRange(0, 360),
    spread: 360,
    startVelocity: randomInRange(15, 25),
    origin: { x: 0.5, y: 0.5 },
    colors,
    shapes: ["star"],
    ticks: 200,
    scalar: 0.8,
    gravity: 0.6,
    decay: 0.95,
    drift: 0,
    zIndex: 100
  });
};

// Shower effect
const triggerShower = (colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"]) => {
  const myConfetti = confetti.create(null, { resize: true, useWorker: true });
  const end = Date.now() + 1500;

  const interval = setInterval(() => {
    if (Date.now() > end) {
      return clearInterval(interval);
    }

    myConfetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.25 },
      colors,
      ticks: 300,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 45,
      shapes: ["square", "circle"]
    });

    myConfetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.25 },
      colors,
      ticks: 300,
      gravity: 1.2,
      decay: 0.94,
      startVelocity: 45,
      shapes: ["square", "circle"]
    });
  }, 50);

  return interval;
};

// Combined celebration effect
const triggerCelebration = (colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"]) => {
  const myConfetti = confetti.create(null, { resize: true, useWorker: true });
  let intervals = [];

  // Initial center burst
  myConfetti({
    particleCount: 120,
    angle: randomInRange(0, 360),
    spread: 360,
    startVelocity: 40,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    origin: { x: 0.5, y: 0.5 },
    colors,
    shapes: ["circle", "square"],
    scalar: randomInRange(0.8, 1.2),
    zIndex: 100
  });

  // Side bursts with slight delay
  setTimeout(() => {
    myConfetti({
      particleCount: 80,
      angle: randomInRange(0, 360),
      spread: 360,
      startVelocity: 40,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: { x: 0.2, y: 0.5 },
      colors,
      shapes: ["circle", "square"],
      scalar: randomInRange(0.8, 1.2),
      zIndex: 100
    });

    myConfetti({
      particleCount: 80,
      angle: randomInRange(0, 360),
      spread: 360,
      startVelocity: 40,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      origin: { x: 0.8, y: 0.5 },
      colors,
      shapes: ["circle", "square"],
      scalar: randomInRange(0.8, 1.2),
      zIndex: 100
    });
  }, 300);

  // Continuous shower for a short period
  setTimeout(() => {
    const showerInterval = triggerShower(colors);
    intervals.push(showerInterval);
  }, 800);

  return intervals;
};

const Balloons = React.forwardRef(
  ({
    type = "default",
    text,
    fontSize = 120,
    className,
    onLaunch,
    colors = ["#8B5CF6", "#C4B5FD", "#6D28D9", "#DDD6FE", "#A78BFA"],
    options = {}
  }, ref) => {
    const containerRef = React.useRef(null);
    const intervalsRef = React.useRef([]);

    // Clean up any running animations
    const cleanupAnimations = React.useCallback(() => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
    }, []);

    const launchAnimation = React.useCallback(() => {
      // Clean up any existing animations first
      cleanupAnimations();

      if (type === "confetti") {
        const interval = triggerConfetti(colors, options);
        intervalsRef.current.push(interval);
      } else if (type === "fireworks") {
        triggerFireworks(colors);
      } else if (type === "glitter") {
        triggerGlitter(colors);
      } else if (type === "shower") {
        const interval = triggerShower(colors);
        intervalsRef.current.push(interval);
      } else if (type === "celebration") {
        const intervals = triggerCelebration(colors);
        intervalsRef.current.push(...intervals);
      } else if (type === "default") {
        import("balloons-js").then(({ balloons }) => {
          balloons();
        });
      } else if (type === "text" && text) {
        import("balloons-js").then(({ textBalloons }) => {
          textBalloons([
            {
              text,
              fontSize,
              colors,
            },
          ]);
        });
      }

      if (onLaunch) {
        onLaunch();
      }
    }, [type, text, fontSize, onLaunch, colors, options, cleanupAnimations]);

    // Clean up on unmount
    React.useEffect(() => {
      return () => {
        cleanupAnimations();
      };
    }, [cleanupAnimations]);

    // Export the animation launch method
    React.useImperativeHandle(ref, () => ({
      launchAnimation,
      cleanupAnimations,
      ...(containerRef.current || {})
    }), [launchAnimation, cleanupAnimations]);

    return <div ref={containerRef} className={cn("balloons-container", className)} />;
  }
);

Balloons.displayName = "Balloons";

export { Balloons };