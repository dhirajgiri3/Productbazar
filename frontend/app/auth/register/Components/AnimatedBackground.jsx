"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Add a seeded random generator for SSR
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  
  useEffect(() => {
    // Check for low performance devices
    const checkPerformance = () => {
      // Check if device is mobile or has a low memory
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsLowPerformance(isMobile);
    };
    checkPerformance();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationId;
    let lastTime = 0;
    const fps = 60;
    const interval = 1000 / fps;
    
    canvas.width = width;
    canvas.height = height;
    
    // Create grid for spatial partitioning (optimization)
    const cellSize = 100;
    const grid = {};
    
    const particles = [];
    // Adjust particle count based on performance
    const getParticleCount = () => {
      const baseCount = Math.min(width < 768 ? 15 : 30, 40);
      return isLowPerformance ? Math.floor(baseCount * 0.6) : baseCount;
    };
    
    // Palette of colors for particles
    const colorPalettes = {
      primary: ['rgba(124, 58, 237, 0.6)', 'rgba(139, 92, 246, 0.5)', 'rgba(167, 139, 250, 0.4)'],
      accent: ['rgba(79, 70, 229, 0.6)', 'rgba(99, 102, 241, 0.5)', 'rgba(129, 140, 248, 0.4)'],
      highlight: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.3)', 'rgba(244, 114, 182, 0.2)']
    };
    
    class Particle {
      constructor(particleType = 'normal', randomFn = Math.random) {
        this.reset(particleType, randomFn);
        // Start particles at random positions
        this.x = randomFn() * width;
        this.y = randomFn() * height;
      }
      
      reset(particleType, randomFn = Math.random) {
        this.type = particleType;
        this.size = this.type === 'shiny' 
          ? randomFn() * 3 + 2.5 
          : randomFn() * 2.5 + 0.8;
        
        // Slower movement for better aesthetics
        this.speedX = (randomFn() * 0.6 - 0.3) * (this.type === 'shiny' ? 1.2 : 1);
        this.speedY = (randomFn() * 0.6 - 0.3) * (this.type === 'shiny' ? 1.2 : 1);
        
        // Select color based on type
        const palette = this.type === 'shiny' 
          ? colorPalettes.highlight 
          : (randomFn() > 0.7 ? colorPalettes.accent : colorPalettes.primary);
        
        this.color = palette[Math.floor(randomFn() * palette.length)];
        this.opacity = this.type === 'shiny' ? (randomFn() * 0.4 + 0.6) : (randomFn() * 0.3 + 0.2);
        
        // For shimmering effect
        this.glowIntensity = this.type === 'shiny' ? (randomFn() * 10 + 10) : 0;
        this.pulseSpeed = randomFn() * 0.02 + 0.01;
        this.pulseValue = randomFn() * Math.PI * 2;
        
        // Cell coordinates for spatial partitioning
        this.cellX = Math.floor(this.x / cellSize);
        this.cellY = Math.floor(this.y / cellSize);
      }
      
      update() {
        // Remove from current cell
        const cellKey = `${this.cellX},${this.cellY}`;
        if (grid[cellKey]) {
          const index = grid[cellKey].indexOf(this);
          if (index !== -1) grid[cellKey].splice(index, 1);
        }
        
        // Update position with slightly variable speed for natural movement
        this.x += this.speedX * (1 + Math.sin(Date.now() * 0.001) * 0.1);
        this.y += this.speedY * (1 + Math.cos(Date.now() * 0.001) * 0.1);
        
        // Wrap around screen edges
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
        
        // Update cell position
        this.cellX = Math.floor(this.x / cellSize);
        this.cellY = Math.floor(this.y / cellSize);
        
        // Add to new cell
        const newCellKey = `${this.cellX},${this.cellY}`;
        if (!grid[newCellKey]) grid[newCellKey] = [];
        grid[newCellKey].push(this);
        
        // Update pulsing/shimmering for shiny particles
        if (this.type === 'shiny') {
          this.pulseValue += this.pulseSpeed;
          this.opacity = 0.6 + Math.sin(this.pulseValue) * 0.3;
        }
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Add glow effect for shiny particles
        if (this.type === 'shiny' && !isLowPerformance) {
          const glow = Math.abs(Math.sin(this.pulseValue)) * this.glowIntensity;
          ctx.shadowBlur = glow;
          ctx.shadowColor = this.color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
      }
    }
    
    const init = () => {
      // Clear grid and particles
      for (const key in grid) delete grid[key];
      particles.length = 0;
      
      const particleCount = getParticleCount();
      
      // Create particles with occasional shiny ones
      let randomFn = typeof window !== 'undefined' ? Math.random : seededRandom(2024);
      for (let i = 0; i < particleCount; i++) {
        const isShiny = randomFn() < 0.15; // 15% chance of being a shiny particle
        particles.push(new Particle(isShiny ? 'shiny' : 'normal', randomFn));
      }
    }
    
    const getNeighboringCells = (cellX, cellY) => {
      const neighbors = [];
      for (let x = cellX - 1; x <= cellX + 1; x++) {
        for (let y = cellY - 1; y <= cellY + 1; y++) {
          const key = `${x},${y}`;
          if (grid[key]) neighbors.push(...grid[key]);
        }
      }
      return neighbors;
    };
    
    const connect = () => {
      // Skip connections on low performance devices
      if (isLowPerformance) return;
      
      // Connection settings
      const maxDistance = width < 768 ? 80 : 120; 
      const maxDistanceSquared = maxDistance * maxDistance;
      
      // Process each particle and its neighbors only
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const neighbors = getNeighboringCells(particle.cellX, particle.cellY);
        
        for (let j = 0; j < neighbors.length; j++) {
          const neighbor = neighbors[j];
          // Skip self
          if (particle === neighbor) continue;
          
          const dx = particle.x - neighbor.x;
          const dy = particle.y - neighbor.y;
          const distanceSquared = dx * dx + dy * dy;
          
          // Using distance squared for performance (avoids square root)
          if (distanceSquared < maxDistanceSquared) {
            // Calculate opacity based on distance
            const opacity = 1 - (Math.sqrt(distanceSquared) / maxDistance);
            
            // Determine connection color based on particle types
            let connectionColor;
            if (particle.type === 'shiny' || neighbor.type === 'shiny') {
              connectionColor = `rgba(167, 139, 250, ${opacity * 0.35})`;
            } else {
              connectionColor = `rgba(124, 58, 237, ${opacity * 0.15})`;
            }
            
            // Draw the connection
            ctx.beginPath();
            ctx.strokeStyle = connectionColor;
            ctx.lineWidth = particle.type === 'shiny' || neighbor.type === 'shiny' ? 0.8 : 0.4;
            ctx.globalAlpha = opacity;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(neighbor.x, neighbor.y);
            ctx.stroke();
          }
        }
      }
    }
    
    const animate = (currentTime) => {
      // Throttle animation frame for performance
      if (currentTime - lastTime < interval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      lastTime = currentTime;
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      // Connect nearby particles
      connect();
      
      animationId = requestAnimationFrame(animate);
    }
    
    const resizeHandler = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      
      // Reinitialize when resized
      init();
    };
    
    window.addEventListener('resize', resizeHandler);
    
    // Visibility change handling to pause animation when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        lastTime = 0;
        animationId = requestAnimationFrame(animate);
      }
    });
    
    init();
    animationId = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', resizeHandler);
      document.removeEventListener('visibilitychange', () => {});
      cancelAnimationFrame(animationId);
    };
  }, [isLowPerformance]);
  
  return (
    <>
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        {/* Enhanced background gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_10%,rgba(124,58,237,0.07),transparent_40%),radial-gradient(circle_at_90%_20%,rgba(79,70,229,0.05),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(124,58,237,0.05),transparent_50%),radial-gradient(circle_at_20%_70%,rgba(139,92,246,0.07),transparent_55%)]"></div>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      </div>
      
      {/* Enhanced decorative elements with more subtle animations */}
      <motion.div 
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br from-violet-100/30 to-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.2, 0.25, 0.2],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
      
      <motion.div 
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-tr from-indigo-100/30 to-purple-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{
          scale: [1, 1.07, 1],
          opacity: [0.2, 0.27, 0.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
          delay: 2
        }}
      />
    </>
  );
};

export default AnimatedBackground;