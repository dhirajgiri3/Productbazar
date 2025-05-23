"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

const SuccessConfetti = ({ trigger = true, duration = 5000 }) => {

  // Create a canvas for the confetti
  const createCanvas = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    Object.assign(canvas.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "1000",
      pointerEvents: "none",
      backgroundColor: "transparent",
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    return canvas;
  }, []);

  // Simplified celebration sequence with just 3 main effects
  const launchCelebration = useCallback((myConfetti) => {
    // Modern color palette with violet as the accent color
    const colors = [
      "#8B5CF6", // Violet (primary)
      "#A78BFA", // Light Violet
      "#C4B5FD", // Lighter Violet
      "#7C3AED", // Purple
      "#6D28D9", // Indigo
      "#4F46E5", // Blue
      "#F472B6", // Pink
      "#EC4899", // Hot Pink
      "#F59E0B", // Amber
      "#10B981", // Emerald
    ];

    let intervals = [];

    // 1. Initial center burst - the main effect
    myConfetti({
      particleCount: 150,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      colors,
      shapes: ["circle", "square"],
      gravity: 1,
      scalar: 1.2,
      ticks: 300,
      startVelocity: 45,
      decay: 0.92
    });

    // 2. Side bursts - simultaneous left and right
    setTimeout(() => {
      // Left side burst
      myConfetti({
        particleCount: 80,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors,
        shapes: ["circle", "square"],
        gravity: 1,
        scalar: 1,
        ticks: 250,
        startVelocity: 40,
        decay: 0.92
      });

      // Right side burst
      myConfetti({
        particleCount: 80,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors,
        shapes: ["circle", "square"],
        gravity: 1,
        scalar: 1,
        ticks: 250,
        startVelocity: 40,
        decay: 0.92
      });
    }, 300);

    // 3. Optional: Add a subtle shower effect for a short period
    const end = Date.now() + 1500;
    const showerInterval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(showerInterval);
        return;
      }

      // Gentle shower from both sides
      myConfetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.25 },
        colors,
        ticks: 200,
        gravity: 1.2,
        decay: 0.92,
        startVelocity: 35,
        shapes: ["square", "circle"]
      });

      myConfetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.25 },
        colors,
        ticks: 200,
        gravity: 1.2,
        decay: 0.92,
        startVelocity: 35,
        shapes: ["square", "circle"]
      });
    }, 50);

    intervals.push(showerInterval);
    return intervals;
  }, []);

  useEffect(() => {
    if (!trigger) return;

    // Clean up any existing canvas
    document.querySelector(".confetti-canvas")?.remove();

    // Create new canvas
    const canvas = createCanvas();
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true // Use a worker thread for better performance
    });

    // Launch the celebration
    const intervals = launchCelebration(myConfetti);

    // Set up cleanup
    const cleanupTimer = setTimeout(() => {
      canvas.remove();
      intervals.forEach(interval => clearInterval(interval));
    }, duration);

    return () => {
      clearTimeout(cleanupTimer);
      intervals.forEach(interval => clearInterval(interval));
      canvas.remove();
    };
  }, [trigger, duration, createCanvas, launchCelebration]);

  return null;
};

export default SuccessConfetti;
