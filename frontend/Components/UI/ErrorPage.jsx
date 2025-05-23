'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';
import Flappy404Game from './Flappy404Game';

// Button component - preserved from original with accessibility improvements
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white shadow-sm hover:bg-primary/90 focus:ring-primary/30',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus:ring-destructive/30',
        outline:
          'border border-primary/20 bg-white shadow-sm hover:bg-primary/5 hover:border-primary/30 focus:ring-primary/20',
        secondary:
          'bg-secondary/80 text-white shadow-sm hover:bg-secondary focus:ring-secondary/30',
        ghost: 'hover:bg-primary/5 hover:text-primary focus:ring-primary/20',
        link: 'text-primary underline-offset-4 hover:underline focus:ring-primary/20',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

// Enhanced 3D Shape Component with improved accessibility
function Abstract3DShape({ className, ...props }) {
  return (
    <div
      className={cn('absolute w-64 h-64 md:w-80 md:h-80', className)}
      {...props}
      style={{
        position: 'absolute',
        ...props.style,
      }}
      aria-hidden="true" // Hide from screen readers as it's decorative
    >
      <motion.svg
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        className="drop-shadow-xl"
      >
        <defs>
          <linearGradient id="shapeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.08 }} />
            <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.25 }} />
          </linearGradient>
        </defs>
        <motion.path
          d="M123.5 68C158.7 32.8 214.3 32.8 249.5 68L332 150.5C367.2 185.7 367.2 241.3 332 276.5L249.5 359C214.3 394.2 158.7 394.2 123.5 359L41 276.5C5.8 241.3 5.8 185.7 41 150.5L123.5 68Z"
          fill="url(#shapeGradient)"
          strokeWidth="1.5"
          strokeDasharray="8,4"
          stroke="var(--primary)"
          strokeOpacity="0.2"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.05, 1],
            borderRadius: ["40% 60% 60% 40% / 60% 30% 70% 40%", "40% 60%"]
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "loop"
          }}
        />
      </motion.svg>
    </div>
  );
}

// Enhanced Geometric Decoration with improved animations
function GeometricDecoration({ className, ...props }) {
  return (
    <div
      className={cn('absolute w-48 h-48 md:w-60 md:h-60', className)}
      {...props}
      style={{
        position: 'absolute',
        ...props.style,
      }}
      aria-hidden="true" // Hide from screen readers as it's decorative
    >
      <motion.svg
        initial={{ opacity: 0, rotate: -10 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.03 }} />
            <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.15 }} />
          </radialGradient>
        </defs>
        <motion.circle
          cx="150"
          cy="150"
          r="100"
          fill="url(#circleGradient)"
          animate={{
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.circle
          cx="150"
          cy="150"
          r="150"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="12,8"
          animate={{ rotate: 360 }}
          transition={{
            duration: 45,
            ease: "linear",
            repeat: Infinity
          }}
        />
        <motion.circle
          cx="150"
          cy="150"
          r="50"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeOpacity="0.2"
          strokeDasharray="4,3"
          animate={{ rotate: -360 }}
          transition={{
            duration: 30,
            ease: "linear",
            repeat: Infinity
          }}
        />
      </motion.svg>
    </div>
  );
}

// Improved 404 Illustration with animation
function Illustration(props) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 362 145"
      className="filter drop-shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      {...props}
    >
      <defs>
        <linearGradient id="numberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.08 }} />
          <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.06 }} />
        </linearGradient>
      </defs>
      <motion.path
        fill="url(#numberGradient)"
        d="M62.6 142c-2.133 0-3.2-1.067-3.2-3.2V118h-56c-2 0-3-1-3-3V92.8c0-1.333.4-2.733 1.2-4.2L58.2 4c.8-1.333 2.067-2 3.8-2h28c2 0 3 1 3 3v85.4h11.2c.933 0 1.733.333 2.4 1 .667.533 1 1.267 1 2.2v21.2c0 .933-.333 1.733-1 2.4-.667.533-1.467.8-2.4.8H93v20.8c0 2.133-1.067 3.2-3.2 3.2H62.6zM33 90.4h26.4V51.2L33 90.4zM181.67 144.6c-7.333 0-14.333-1.333-21-4-6.666-2.667-12.866-6.733-18.6-12.2-5.733-5.467-10.266-13-13.6-22.6-3.333-9.6-5-20.667-5-33.2 0-12.533 1.667-23.6 5-33.2 3.334-9.6 7.867-17.133 13.6-22.6 5.734-5.467 11.934-9.533 18.6-12.2 6.667-2.8 13.667-4.2 21-4.2 7.467 0 14.534 1.4 21.2 4.2 6.667 2.667 12.8 6.733 18.4 12.2 5.734 5.467 10.267 13 13.6 22.6 3.334 9.6 5 20.667 5 33.2 0 12.533-1.666 23.6-5 33.2-3.333 9.6-7.866 17.133-13.6 22.6-5.6 5.467-11.733 9.533-18.4 12.2-6.666 2.667-13.733 4-21.2 4zm0-31c9.067 0 15.6-3.733 19.6-11.2 4.134-7.6 6.2-17.533 6.2-29.8s-2.066-22.2-6.2-29.8c-4.133-7.6-10.666-11.4-19.6-11.4-8.933 0-15.466 3.8-19.6 11.4-4 7.6-6 17.533-6 29.8s2 22.2 6 29.8c4.134 7.467 10.667 11.2 19.6 11.2zM316.116 142c-2.134 0-3.2-1.067-3.2-3.2V118h-56c-2 0-3-1-3-3V92.8c0-1.333.4-2.733 1.2-4.2l56.6-84.6c.8-1.333 2.066-2 3.8-2h28c2 0 3 1 3 3v85.4h11.2c.933 0 1.733.333 2.4 1 .666.533 1 1.267 1 2.2v21.2c0 .933-.334 1.733-1 2.4-.667.533-1.467.8-2.4.8h-11.2v20.8c0 2.133-1.067 3.2-3.2 3.2h-27.2zm-29.6-51.6h26.4V51.2l-26.4 39.2z"
        animate={{
          y: [0, -5, 0],
          scale: [1, 1.01, 1]
        }}
        transition={{
          duration: 6,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
    </motion.svg>
  );
}

// Enhanced interactive particles with improved performance
function EnhancedParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Reduced particle count for better performance
    const particleCount = 30;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const size = Math.floor(Math.random() * 4) + 2;
      const left = Math.floor(Math.random() * 100);
      const top = Math.floor(Math.random() * 100);
      const animationDuration = Math.random() * 12 + 8;
      const delay = Math.random() * 4;
      const opacity = Math.random() * 0.2 + 0.05;

      newParticles.push({
        id: i,
        size,
        left,
        top,
        animationDuration,
        delay,
        opacity,
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
      aria-hidden="true"
    >
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: `radial-gradient(circle at 30% 30%, var(--primary), rgba(0,0,0,0))`,
            opacity: particle.opacity,
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            filter: 'blur(1px)',
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: -100,
            opacity: [0, particle.opacity, 0],
            x: particle.left > 50 ? 20 : -20
          }}
          transition={{
            duration: particle.animationDuration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Enhanced grid background with subtle animation and improved performance
function EnhancedGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.07 }}
        transition={{ duration: 1 }}
        style={{
          backgroundSize: '40px 40px',
          backgroundImage: `
            linear-gradient(to right, rgba(var(--primary-rgb), 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(var(--primary-rgb), 0.2) 1px, transparent 1px)
          `,
          zIndex: 0,
        }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        transition={{ duration: 1, delay: 0.3 }}
        style={{
          backgroundSize: '80px 80px',
          backgroundImage: `
            linear-gradient(to right, rgba(var(--primary-rgb), 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(var(--primary-rgb), 0.3) 1px, transparent 1px)
          `,
          zIndex: 0,
        }}
      />
    </div>
  );
}

// Modern error text component with subtle animation
function ErrorText({ text = '404', className, ...props }) {
  return (
    <div className={cn('relative', className)} {...props}>
      <motion.h1
        className="text-8xl md:text-9xl font-black text-primary tracking-tighter"
        data-text={text}
        aria-label={`${text} error`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          textShadow:
            '0 0 10px rgba(var(--primary-rgb), 0.5), 0 0 20px rgba(var(--primary-rgb), 0.3)',
        }}
      >
        {text}
      </motion.h1>
      <motion.div
        className="absolute inset-0 blur-2xl opacity-30 bg-primary/20 rounded-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.8 }}
      />
    </div>
  );
}

// Digital Circuit Decoration with improved animations
function DigitalCircuitDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <motion.svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        <defs>
          <pattern id="circuit" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <motion.path
              d="M100,0 L100,50 M100,50 L150,50 M150,50 L150,100 M150,100 L200,100 M50,0 L50,150 M50,150 L0,150 M0,100 L100,100 M100,100 L100,200 M150,150 L200,150"
              stroke="var(--primary)"
              strokeWidth="1"
              fill="none"
              initial={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 10, ease: "easeInOut" }}
            />
            <motion.circle
              cx="50" cy="150" r="3"
              fill="var(--primary)"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.circle
              cx="100" cy="50" r="3"
              fill="var(--primary)"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, delay: 1, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.circle
              cx="150" cy="100" r="3"
              fill="var(--primary)"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3.5, delay: 0.5, repeat: Infinity, repeatType: "reverse" }}
            />
            <motion.circle
              cx="100" cy="100" r="3"
              fill="var(--primary)"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, delay: 1.5, repeat: Infinity, repeatType: "reverse" }}
            />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)" />
      </motion.svg>
    </div>
  );
}

// Enhanced NotFound component with improved accessibility and animations
function EnhancedNotFound({
  title = 'Page not found',
  description = "Sorry, the page you are looking for doesn't exist or has been moved.",
  errorNumber = 404,
}) {
  const [currentUrl, setCurrentUrl] = useState('#');

  // Set the current URL only after component mounts (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center text-center z-10 pt-16 md:pt-20">
      {/* Flappy 404 Game above error code */}
      <Flappy404Game />
      <div className="relative inline-block mb-8">
        <ErrorText text={errorNumber} />
      </div>

      <motion.h2
        className="mt-4 text-balance text-2xl md:text-3xl font-semibold tracking-tight text-gray-800 max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {title}
      </motion.h2>

      <motion.p
        className="mt-4 text-pretty text-sm font-normal text-gray-600 max-w-md mx-auto"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {description}
      </motion.p>

      <motion.div
        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-y-4 gap-x-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Button
          variant="outline"
          asChild
          className="group transition-all duration-300 border-primary/20 hover:border-primary/40 min-w-36 hover:shadow-sm"
        >
          <a
            onClick={() => history.back()}
            href="#"
            role="button"
            aria-label="Go back to previous page"
          >
            <ArrowLeft
              className="me-2 ms-0 opacity-70 transition-transform group-hover:-translate-x-1"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Go back
          </a>
        </Button>

        <Button
          className="relative overflow-hidden -order-1 sm:order-none bg-primary hover:bg-primary/90 transition-all duration-300 min-w-36 group"
          asChild
        >
          <a
            href="/"
            aria-label="Go to home page"
          >
            <span className="relative z-10 flex items-center">
              <Home
                className="me-2 ms-0 opacity-90 transition-transform group-hover:scale-110"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
              Take me home
            </span>
            <motion.span
              className="absolute inset-0 w-full h-full bg-primary/10"
              animate={{
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              aria-hidden="true"
            />
            <motion.span
              className="absolute -inset-full h-full w-1/3 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-10"
              animate={{
                left: ["100%", "-100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 5
              }}
              aria-hidden="true"
            />
          </a>
        </Button>

        <Button
          variant="primary"
          asChild
          className="relative overflow-hidden min-w-36 group"
        >
          <a
            href={currentUrl}
            aria-label="Refresh the current page"
          >
            <RefreshCw
              className="me-2 ms-0 opacity-70 transition-transform group-hover:rotate-180"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
            Refresh page
          </a>
        </Button>
      </motion.div>
    </div>
  );
}

// Main ErrorPage component with enhanced visuals and animations
function ErrorPage({
  title = 'Page not found',
  description = "Sorry, the page you are looking for doesn't exist or has been moved.",
  errorCode = 404,
}) {
  return (
    <div className="relative flex flex-col w-full justify-center min-h-svh bg-white p-4 md:p-8 overflow-hidden">
      {/* Root container with absolute positioned elements */}
      <div className="relative max-w-4xl mx-auto w-full h-full min-h-[600px]">
        {/* Enhanced Background Elements */}
        <EnhancedGridBackground />
        <DigitalCircuitDecoration />
        <EnhancedParticles />

        {/* Decorative elements with improved positioning and animations */}
        <Abstract3DShape
          style={{
            top: '-120px',
            left: '-100px',
            transform: 'rotate(15deg) scale(0.8)',
            zIndex: 1,
          }}
        />
        <Abstract3DShape
          style={{
            bottom: '-150px',
            right: '-120px',
            transform: 'rotate(-18deg) scale(0.85)',
            zIndex: 1,
          }}
        />
        <GeometricDecoration
          style={{
            top: '-60px',
            right: '-50px',
            transform: 'rotate(30deg) scale(0.8)',
            zIndex: 1,
          }}
        />
        <GeometricDecoration
          style={{
            bottom: '-40px',
            left: '-70px',
            transform: 'rotate(-20deg) scale(0.6)',
            zIndex: 1,
          }}
        />

        {/* Enhanced 404 Illustration with better placement and effects */}
        <div
          className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
          aria-hidden="true"
        >
          <Illustration
            style={{
              width: '90%',
              maxWidth: '800px',
              height: 'auto',
              opacity: 0.05,
              filter: 'blur(1px)',
            }}
          />
        </div>

        {/* Improved content container with better spacing */}
        <div className="relative flex flex-col items-center justify-center h-full z-10 py-16 md:py-20">
          <EnhancedNotFound
            title={title}
            description={description}
            errorNumber={errorCode}
          />
        </div>

        {/* Subtle gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-radial from-transparent to-white/50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export { ErrorPage, EnhancedNotFound, Illustration, Button, buttonVariants };
