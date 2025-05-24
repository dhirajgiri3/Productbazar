'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Zap } from 'lucide-react';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GRAVITY = 0.5;
const JUMP = -9;
const OBSTACLE_WIDTH = 70;
const BASE_OBSTACLE_GAP = 180;
const BASE_OBSTACLE_SPEED = 2.2;
const PLAYER_SIZE = 50;
const PLAYER_X = 120;

// Add a seeded random generator for SSR
function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Improved obstacle generation with better balance for error page game
function generateObstacle(score, lastObstacle = null, seed = 12345) {
  const patterns = {
    // Early game - very easy and forgiving
    easy: [
      { gapY: 120, gap: 220, spacing: 320 },
      { gapY: 140, gap: 210, spacing: 350 },
      { gapY: 100, gap: 230, spacing: 300 },
      { gapY: 160, gap: 200, spacing: 330 },
    ],
    // Mid game - moderate difficulty
    medium: [
      { gapY: 90, gap: 190, spacing: 280 },
      { gapY: 150, gap: 185, spacing: 270 },
      { gapY: 180, gap: 195, spacing: 300 },
      { gapY: 70, gap: 200, spacing: 260 },
      { gapY: 170, gap: 180, spacing: 290 },
    ],
    // Hard game - challenging but fair
    hard: [
      { gapY: 60, gap: 170, spacing: 240 },
      { gapY: 200, gap: 165, spacing: 220 },
      { gapY: 80, gap: 175, spacing: 250 },
      { gapY: 190, gap: 160, spacing: 230 },
      { gapY: 50, gap: 180, spacing: 260 },
    ],
    // Expert level - for high scores only
    expert: [
      { gapY: 40, gap: 155, spacing: 200 },
      { gapY: 220, gap: 150, spacing: 190 },
      { gapY: 70, gap: 160, spacing: 210 },
      { gapY: 210, gap: 145, spacing: 220 },
    ]
  };

  let difficulty = 'easy';
  if (score >= 25) difficulty = 'expert';
  else if (score >= 15) difficulty = 'hard';
  else if (score >= 8) difficulty = 'medium';

  const availablePatterns = patterns[difficulty];
  let randomFn = typeof window !== 'undefined' ? Math.random : seededRandom(seed);
  let selectedPattern = availablePatterns[Math.floor(randomFn() * availablePatterns.length)];

  // Intelligent variation to prevent repetitive patterns
  if (lastObstacle) {
    const heightDiff = Math.abs(selectedPattern.gapY - lastObstacle.gapY);
    
    // If too similar to last obstacle, try to pick a more varied one
    if (heightDiff < 50 && randomFn() > 0.4) {
      const variedPatterns = availablePatterns.filter(p => 
        Math.abs(p.gapY - lastObstacle.gapY) > 70
      );
      if (variedPatterns.length > 0) {
        selectedPattern = variedPatterns[Math.floor(randomFn() * variedPatterns.length)];
      }
    }
  }

  // Add gentle randomness to the selected pattern
  const gapVariation = (randomFn() - 0.5) * 20;
  const sizeVariation = (randomFn() - 0.5) * 15;
  
  return {
    gapY: Math.max(50, Math.min(GAME_HEIGHT - selectedPattern.gap - 50, 
      selectedPattern.gapY + gapVariation)),
    gap: Math.max(140, selectedPattern.gap + sizeVariation),
    spacing: selectedPattern.spacing + (randomFn() - 0.5) * 30,
    pattern: difficulty
  };
}

// More gradual speed increase
function getObstacleSpeed(score) {
  const speedIncrease = Math.floor(score / 5) * 0.2;
  return Math.min(BASE_OBSTACLE_SPEED + speedIncrease, 3.8);
}

// Enhanced Button component
function GameButton({ children, onClick, variant = 'primary', className = '', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0';
  
  const variants = {
    primary: 'bg-violet-600 text-white shadow-lg hover:bg-violet-700 hover:shadow-violet-500/25 focus:ring-violet-500/30 transform hover:scale-105',
    secondary: 'bg-violet-100 text-violet-700 border border-violet-200 shadow-sm hover:bg-violet-200 hover:border-violet-300 focus:ring-violet-500/20',
    ghost: 'hover:bg-violet-50 hover:text-violet-600 focus:ring-violet-500/20'
  };

  return (
    <motion.button
      className={`${baseClasses} ${variants[variant]} ${className} h-10 px-6`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Floating particles background
function GameParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    let randomFn = typeof window !== 'undefined' ? Math.random : seededRandom(404);
    const particleCount = 12;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: randomFn() * 100,
        y: randomFn() * 100,
        size: randomFn() * 3 + 1,
        duration: randomFn() * 8 + 12,
        delay: randomFn() * 6,
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-violet-500/10"
          style={{
            width: particle.size,
            height: particle.size,
            x: particle.x,
            y: particle.y,
          }}
          animate={{
            y: [-20, -100],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// Grid background
function GameGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 transition-colors duration-300"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.5,
        }}
      />
    </div>
  );
}

function Flappy404Game() {
  const [playerY, setPlayerY] = useState(GAME_HEIGHT / 2 - PLAYER_SIZE / 2);
  const [velocity, setVelocity] = useState(0);
  const [obstacles, setObstacles] = useState(() => {
    const firstObstacle = generateObstacle(0);
    return [{
      x: GAME_WIDTH + 250,
      gapY: firstObstacle.gapY,
      gap: firstObstacle.gap,
      passed: false,
      id: Date.now(),
      pattern: firstObstacle.pattern
    }];
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [nextObstacleDistance, setNextObstacleDistance] = useState(320);
  const requestRef = useRef();
  const gameStateRef = useRef({
    playerY: GAME_HEIGHT / 2 - PLAYER_SIZE / 2,
    velocity: 0,
    obstacles: [],
    score: 0,
    gameOver: false,
    started: false
  });

  // Initialize best score
  useEffect(() => {
    setBestScore(0);
  }, []);

  // Update ref when state changes
  useEffect(() => {
    gameStateRef.current = { playerY, velocity, obstacles, score, gameOver, started };
  }, [playerY, velocity, obstacles, score, gameOver, started]);

  // Enhanced jump function with proper event handling
  const jump = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentState = gameStateRef.current;
    
    if (!currentState.started) {
      setStarted(true);
    }
    
    if (!currentState.gameOver) {
      const currentVel = currentState.velocity;
      const jumpPower = currentVel > 0 ? JUMP * 1.1 : JUMP * 0.9;
      setVelocity(jumpPower);
    }
  }, []);

  // Fixed restart function
  const restart = useCallback(() => {
    const firstObstacle = generateObstacle(0);
    const newObstacle = {
      x: GAME_WIDTH + 250,
      gapY: firstObstacle.gapY,
      gap: firstObstacle.gap,
      passed: false,
      id: Date.now(),
      pattern: firstObstacle.pattern
    };
    
    setPlayerY(GAME_HEIGHT / 2 - PLAYER_SIZE / 2);
    setVelocity(0);
    setRotation(0);
    setObstacles([newObstacle]);
    setScore(0);
    setGameOver(false);
    setStarted(false);
    setNextObstacleDistance(320);
    
    // Cancel any existing animation frame
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  // More forgiving collision detection
  const checkCollisions = useCallback((currentPlayerY, currentObstacles) => {
    // Ground and ceiling collision
    if (currentPlayerY >= GAME_HEIGHT - PLAYER_SIZE - 5) return true;
    if (currentPlayerY <= 5) return true;

    // More forgiving collision margins
    const margin = PLAYER_SIZE * 0.2;
    const playerRect = {
      top: currentPlayerY + margin,
      bottom: currentPlayerY + PLAYER_SIZE - margin,
      left: PLAYER_X + margin,
      right: PLAYER_X + PLAYER_SIZE - margin,
    };

    for (let obs of currentObstacles) {
      const obsMargin = 8; // More forgiving obstacle collision
      const obsRectTop = {
        top: 0,
        bottom: obs.gapY - obsMargin,
        left: obs.x + obsMargin,
        right: obs.x + OBSTACLE_WIDTH - obsMargin,
      };
      const obsRectBottom = {
        top: obs.gapY + obs.gap + obsMargin,
        bottom: GAME_HEIGHT,
        left: obs.x + obsMargin,
        right: obs.x + OBSTACLE_WIDTH - obsMargin,
      };

      const collide = (r1, r2) =>
        r1.right > r2.left &&
        r1.left < r2.right &&
        r1.bottom > r2.top &&
        r1.top < r2.bottom;

      if (collide(playerRect, obsRectTop) || collide(playerRect, obsRectBottom)) {
        return true;
      }
    }

    return false;
  }, []);

  // Fixed game loop
  useEffect(() => {
    if (!started || gameOver) return;

    let lastTime = performance.now();
    let obstacleIdCounter = Date.now();

    function loop(now) {
      const dt = Math.min((now - lastTime) / 16.67, 1.5);
      lastTime = now;

      const currentState = gameStateRef.current;
      
      if (!currentState.started || currentState.gameOver) {
        return;
      }

      // Physics
      const maxFallSpeed = 12;
      let newVelocity = currentState.velocity + GRAVITY * dt;
      
      if (newVelocity > 0) {
        newVelocity = Math.min(newVelocity, maxFallSpeed);
      }

      let newPlayerY = currentState.playerY + newVelocity * dt;
      
      // Smooth rotation
      const targetRotation = Math.max(-25, Math.min(45, newVelocity * 2.5));
      const rotationSpeed = 0.15;
      const smoothRotation = rotation + (targetRotation - rotation) * rotationSpeed;
      setRotation(smoothRotation);
      
      // Boundary constraints
      if (newPlayerY < 0) {
        newPlayerY = 0;
        newVelocity = Math.max(0, newVelocity * 0.3);
      }
      if (newPlayerY > GAME_HEIGHT - PLAYER_SIZE) {
        newPlayerY = GAME_HEIGHT - PLAYER_SIZE;
        newVelocity = Math.min(0, newVelocity * 0.3);
      }

      // Obstacle movement with balanced speed
      const currentSpeed = getObstacleSpeed(currentState.score);
      let newObstacles = currentState.obstacles.map(o => ({ 
        ...o, 
        x: o.x - currentSpeed * dt 
      }));
      
      // Obstacle generation with better spacing
      const lastObstacle = newObstacles[newObstacles.length - 1];
      if (lastObstacle && lastObstacle.x < GAME_WIDTH - nextObstacleDistance) {
        obstacleIdCounter++;
        const newObstacleData = generateObstacle(currentState.score, lastObstacle);
        
        newObstacles.push({ 
          x: GAME_WIDTH + 50, 
          gapY: newObstacleData.gapY,
          gap: newObstacleData.gap,
          passed: false, 
          id: obstacleIdCounter,
          pattern: newObstacleData.pattern
        });
        
        setNextObstacleDistance(newObstacleData.spacing);
      }
      
      // Remove off-screen obstacles
      newObstacles = newObstacles.filter(o => o.x > -OBSTACLE_WIDTH);

      // Score calculation
      let newScore = currentState.score;
      newObstacles.forEach(obs => {
        if (!obs.passed && obs.x + OBSTACLE_WIDTH < PLAYER_X) {
          obs.passed = true;
          newScore++;
        }
      });

      // Collision detection
      const collision = checkCollisions(newPlayerY, newObstacles);

      // Update state
      setPlayerY(newPlayerY);
      setVelocity(newVelocity);
      setObstacles(newObstacles);
      
      if (newScore !== currentState.score) {
        setScore(newScore);
        if (newScore > bestScore) {
          setBestScore(newScore);
        }
      }
      
      if (collision) {
        setGameOver(true);
        return;
      }

      requestRef.current = requestAnimationFrame(loop);
    }
    
    requestRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [started, gameOver, checkCollisions, rotation, bestScore, nextObstacleDistance]);

  // Fixed keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.key === ' ' || e.code === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        jump(e);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Fixed mouse/touch controls
  useEffect(() => {
    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      jump(e);
    };
    
    const handleTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
      jump(e);
    };
    
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleTouch, { passive: false });
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [jump]);

  // Get difficulty color for obstacles
  const getDifficultyColor = (pattern) => {
    const colors = {
      easy: 'from-violet-400 to-violet-500',
      medium: 'from-violet-500 to-violet-600', 
      hard: 'from-violet-600 to-violet-700',
      expert: 'from-violet-700 to-violet-800'
    };
    return colors[pattern] || colors.easy;
  };

  return (
    <div className="flex flex-col items-center mb-8 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        {/* Game Container */}
        <div
          className="relative bg-gradient-to-br from-white via-violet-50/50 to-violet-100/80 rounded-2xl shadow-2xl border border-violet-200/50 overflow-hidden backdrop-blur-sm"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
          }}
          tabIndex={0}
          aria-label="Flappy 404 mini-game"
        >
          {/* Background Effects */}
          <GameGrid />
          <GameParticles />
          
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-transparent via-violet-50/20 to-violet-100/40 pointer-events-none"
            style={{ zIndex: 1 }}
          />

          {/* Decorative clouds */}
          <motion.div 
            className="absolute top-12 left-8 w-16 h-8 bg-white/60 rounded-full opacity-70"
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ zIndex: 2 }}
          />
          <motion.div 
            className="absolute top-24 right-12 w-20 h-10 bg-white/50 rounded-full opacity-60"
            animate={{ x: [0, -15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            style={{ zIndex: 2 }}
          />

          {/* Enhanced Obstacles with better visual design */}
          {obstacles.map((obs) => (
            <React.Fragment key={obs.id}>
              {/* Top obstacle */}
              <motion.div
                className={`absolute bg-gradient-to-b ${getDifficultyColor(obs.pattern)} rounded-t-xl shadow-lg`}
                style={{
                  left: obs.x,
                  top: 0,
                  width: OBSTACLE_WIDTH,
                  height: obs.gapY,
                  zIndex: 3,
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Add subtle texture */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-t-xl" />
              </motion.div>
              
              {/* Bottom obstacle */}
              <motion.div
                className={`absolute bg-gradient-to-t ${getDifficultyColor(obs.pattern)} rounded-b-xl shadow-lg`}
                style={{
                  left: obs.x,
                  top: obs.gapY + obs.gap,
                  width: OBSTACLE_WIDTH,
                  height: GAME_HEIGHT - (obs.gapY + obs.gap),
                  zIndex: 3,
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Add subtle texture */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-b-xl" />
              </motion.div>
            </React.Fragment>
          ))}
          
          {/* Player (404) */}
          <motion.div
            className="absolute flex items-center justify-center font-black text-violet-700 bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-violet-200/50"
            style={{
              left: PLAYER_X,
              top: playerY,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              fontSize: '20px',
              transform: `rotate(${rotation}deg)`,
              transition: started ? 'none' : 'all 0.3s ease',
              zIndex: 4,
              boxShadow: '0 8px 25px rgba(139, 92, 246, 0.2), inset 0 2px 4px rgba(255,255,255,0.8)',
              textShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
            animate={!started ? {
              y: [0, -5, 0],
              scale: [1, 1.05, 1]
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            aria-label="404 player"
          >
            404
          </motion.div>
          
          {/* Score display */}
          <motion.div
            className="absolute top-4 left-4 font-bold text-violet-700 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-violet-200/50 z-10"
            style={{
              padding: '8px 16px',
              fontSize: '18px',
              textShadow: '0 1px 3px rgba(139, 92, 246, 0.2)',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            aria-label="Current score"
          >
            Score: {score}
            {score >= 8 && (
              <div className="text-xs text-violet-500 mt-1">
                Speed: {getObstacleSpeed(score).toFixed(1)}x
              </div>
            )}
          </motion.div>

          {/* Best score display */}
          {bestScore > 0 && (
            <motion.div
              className="absolute top-4 right-4 font-semibold text-violet-600 bg-violet-50/90 backdrop-blur-sm rounded-xl shadow-lg border border-violet-200/50 z-10 flex items-center gap-1"
              style={{
                padding: '8px 12px',
                fontSize: '14px',
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              aria-label="Best score"
            >
              <Trophy size={14} className="text-violet-500" />
              {bestScore}
            </motion.div>
          )}
          
          {/* Game Over Overlay */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center z-20 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-3xl font-black text-violet-600 mb-3">
                    Game Over!
                  </div>
                  <div className="text-xl text-violet-700 mb-2 font-semibold">
                    Score: {score}
                  </div>
                  {score >= 10 && (
                    <div className="text-sm text-violet-500 mb-2">
                      Max Speed: {getObstacleSpeed(score).toFixed(1)}x
                    </div>
                  )}
                  {score === bestScore && score > 0 && (
                    <motion.div 
                      className="text-sm text-violet-500 mb-4 flex items-center justify-center gap-1"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <Zap size={16} className="text-amber-500" />
                      New Best Score!
                    </motion.div>
                  )}
                  <GameButton onClick={restart} className="mt-4">
                    <RotateCcw size={16} className="mr-2" />
                    Play Again
                  </GameButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Start Overlay */}
          <AnimatePresence>
            {!started && !gameOver && (
              <motion.div
                className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-center max-w-md px-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-3xl font-black text-violet-600 mb-3">
                    Flappy 404
                  </div>
                  <div className="text-sm text-violet-600 mb-4 leading-relaxed">
                    Guide the 404 through obstacles using <strong>SPACE</strong>, <strong>↑</strong> or <strong>CLICK</strong>
                  </div>
                  <div className="text-xs text-violet-500 mb-4">
                    Casual difficulty • Perfect for error pages
                  </div>
                  <GameButton onClick={() => jump()}>
                    <Play size={16} className="mr-2" />
                    Start Game
                  </GameButton>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instructions below the game */}
        <motion.div
          className="mt-4 text-center text-sm text-violet-600 max-w-md mx-auto transition-colors duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Want to play a quick game while you refresh your mind?
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Flappy404Game;