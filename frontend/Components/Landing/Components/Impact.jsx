'use client';

import { useRef, useEffect, useState, memo, useCallback, createRef, lazy, Suspense } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import {
  UserCircle,
  Search,
  MessageSquareShare,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  Users2Icon,
  RocketIcon,
  ChartAreaIcon,
  LightbulbIcon,
  Compass,
  Keyboard,
} from 'lucide-react';
import GlobalButton from '../../UI/Buttons/GlobalButton';
import SectionLabel from './Animations/SectionLabel';

// Lazy loaded components for better performance
const LazyImage = lazy(() => import('next/image'));

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Optimized element visibility hook
const useElementInView = (options = {}) => {
  const ref = useRef(null);
  const inView = useInView(ref, {
    margin: options.margin || '-10% 0px -10% 0px',
    amount: options.amount || 0.1,
    once: options.once || false,
  });

  return [ref, inView];
};

// Memoized counter component
const Counter = memo(({ from, to, duration = 2 }) => {
  const nodeRef = useRef(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (inView && nodeRef.current) {
      if (prefersReducedMotion) {
        nodeRef.current.textContent = to;
        return;
      }

      let startValue = from;
      const targetValue = to;
      const durationMs = duration * 1000;
      let startTime = null;

      const step = timestamp => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        const currentVal = Math.floor(from + (targetValue - from) * progress);
        if (nodeRef.current) {
          nodeRef.current.textContent = currentVal;
        }
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          if (nodeRef.current) {
            nodeRef.current.textContent = targetValue;
          }
        }
      };

      requestAnimationFrame(step);

      return () => {};
    }
  }, [inView, from, to, duration, prefersReducedMotion]);

  return (
    <span ref={ref} className="inline-block">
      <span ref={nodeRef} className="font-semibold tabular-nums">
        {from}
      </span>
    </span>
  );
});
Counter.displayName = 'Counter';

// Optimized progress bar component
const ProgressBar = memo(({ progress }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-violet-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{
          duration: prefersReducedMotion ? 0.1 : 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      />
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// Memoized icon wrapper
const AnimatedIcon = memo(({ icon }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-10 h-10 rounded-md flex items-center justify-center bg-violet-500/10 text-violet-600 shrink-0"
      whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      {icon}
    </motion.div>
  );
});
AnimatedIcon.displayName = 'AnimatedIcon';

// Skeleton loader for image placeholders
const ImageSkeleton = () => (
  <div className="w-full h-full min-h-[250px] rounded-lg bg-gray-200 animate-pulse"></div>
);

// Content box for alternating with images
const ContentBox = memo(({ index, inView }) => {
  const prefersReducedMotion = useReducedMotion();

  const contentData = [
    {},
    {
      title: 'Seamless Discovery',
      icon: <Compass className="w-5 h-5" />,
      features: [
        'Personalized recommendations based on your interests',
        'Advanced filtering and sorting options',
        'Save favorites to curated collections',
      ],
      action: 'Start exploring',
    },
    {},
    {
      title: 'Accelerate Growth',
      icon: <ChartAreaIcon className="w-5 h-5" />,
      features: [
        'Detailed analytics and performance tracking',
        'Connect with potential investors and partners',
        'Access marketing tools and resources',
      ],
      action: 'Scale your product',
    },
  ];

  const data = contentData[index];
  if (!data.title) return null;

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.6, delay: 0.3 }}
    >
      <div className="relative overflow-hidden bg-white border border-gray-100 rounded-lg group hover:border-violet-500/30 transition-all duration-300">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500/20 to-indigo-500/40" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600"
              initial={{ rotate: -5 }}
              whileHover={{ rotate: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              {data.icon}
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
          </div>
          <ul className="space-y-3 mb-5">
            {data.features.map((feature, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600"
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.4,
                  delay: prefersReducedMotion ? 0 : 0.4 + i * 0.1,
                }}
              >
                <CheckCircle className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>
          <motion.button
            className="w-full py-2.5 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 font-medium rounded-md text-sm flex items-center justify-center gap-2 transition-all duration-300 group"
            whileHover={{ y: prefersReducedMotion ? 0 : -2 }}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
            aria-label={data.action}
          >
            <span>{data.action}</span>
            <motion.span
              animate={prefersReducedMotion ? {} : { x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});
ContentBox.displayName = 'ContentBox';

// Image display component
const StepImage = memo(({ index, inView }) => {
  const prefersReducedMotion = useReducedMotion();

  const imageData = [
    {
      src: 'https://res.cloudinary.com/dgak25skk/image/upload/v1745652131/macbook-pb1_lswn7v.png',
      alt: 'User profile creation interface',
      width: 500,
      height: 350,
      style: 'shadow',
    },
    {},
    {
      src: 'https://res.cloudinary.com/dgak25skk/image/upload/v1745653024/raw_fmkvpv.png',
      alt: 'Product engagement dashboard',
      width: 500,
      height: 350,
      style: 'float',
    },
    {},
  ];

  const data = imageData[index];
  if (!data.src) return null;

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto flex items-center justify-center h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.7, delay: 0.2 }}
    >
      <div className="relative">
        <div className="relative overflow-hidden rounded-lg">
          <Suspense fallback={<ImageSkeleton />}>
            <LazyImage
              src={data.src}
              alt={data.alt}
              width={data.width}
              height={data.height}
              className="w-full h-auto object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </Suspense>
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
            whileHover={{ opacity: 0.2 }}
          />
        </div>
        {data.style === 'float' && (
          <>
            <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-violet-500/5 rounded-full -z-10" />
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-indigo-500/5 rounded-full -z-10" />
          </>
        )}
      </div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-70">
        {data.alt}
      </div>
    </motion.div>
  );
});
StepImage.displayName = 'StepImage';

const Impact = () => {
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const timelineMarkersRef = useRef([]);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState(null);

  const [mainContainerRef, mainContainerInView] = useElementInView({
    margin: '-15% 0px -15% 0px',
    amount: 0.1,
  });

  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile);
      }
    };
  }, []);

  const stepsData = [
    {
      number: 1,
      title: 'Join & Create Profile',
      subtitle: 'Free',
      description:
        'Create your free account in minutes. Define your role (Maker, Discoverer, Investor, etc.) for a tailored experience and personalized recommendations.',
      icon: <UserCircle className="w-5 h-5" />,
      stats: [
        { value: 3, label: 'minutes setup' },
        { value: 100, label: '% personalized' },
      ],
    },
    {
      number: 2,
      title: 'Showcase & Explore',
      subtitle: '',
      description:
        'Makers: Easily submit your product with key details. Discoverers: Browse curated feeds, categories, trending lists, or search for specific solutions.',
      icon: <Search className="w-5 h-5" />,
      stats: [
        { value: 5000, label: 'products' },
        { value: 24, label: 'categories' },
      ],
    },
    {
      number: 3,
      title: 'Engage & Connect',
      subtitle: '',
      description:
        'Upvote products you love, provide constructive feedback via comments, bookmark favorites, and connect directly with makers and other members.',
      icon: <MessageSquareShare className="w-5 h-5" />,
      stats: [
        { value: 87, label: '% engagement' },
        { value: 12000, label: 'connections made' },
      ],
    },
    {
      number: 4,
      title: 'Grow & Validate',
      subtitle: '',
      description:
        'Makers: Track product traction with analytics, gain insights, find collaborators. Discoverers: Build your toolkit, influence products, stay ahead of the curve.',
      icon: <TrendingUp className="w-5 h-5" />,
      stats: [
        { value: 47, label: '% growth average' },
        { value: 92, label: '% validation' },
      ],
    },
  ];

  const scrollToStep = useCallback(
    index => {
      const section = document.querySelectorAll('.step-section')[index];
      if (section) {
        const yOffset = -100;
        const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
          top: y,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    const handleKeyDown = e => {
      if (!mainContainerInView || isMobile) return;

      let newStep = activeStep;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        newStep = Math.min(activeStep + 1, stepsData.length - 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        newStep = Math.max(activeStep - 1, 0);
      }

      if (newStep !== activeStep) {
        setActiveStep(newStep);
        scrollToStep(newStep);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeStep, scrollToStep, stepsData.length, mainContainerInView, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    const sections = gsap.utils.toArray('.step-section');
    const timeline = timelineRef.current;

    const ctx = gsap.context(() => {
      ScrollTrigger.getAll().forEach(t => t.kill());

      gsap.set('.step-card', { y: 20, opacity: 0 });
      gsap.set('.step-marker', { scale: 0.5, opacity: 0 });
      gsap.set('.stats-container', { opacity: 0, y: 10 });
      gsap.set('.timeline-marker', { scale: 0.5, opacity: 0 });
      gsap.set('.alt-content', { y: 30, opacity: 0 });

      if (sections.length > 0) {
        sections.forEach((section, i) => {
          gsap.to(section.querySelector('.step-card'), {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          });

          if (section.querySelector('.step-marker')) {
            gsap.to(section.querySelector('.step-marker'), {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              delay: 0.1,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            });
          }

          const statsItems = section.querySelectorAll('.stat-item');
          if (statsItems.length) {
            gsap.to(statsItems, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            });
          } else {
            gsap.to(section.querySelector('.stats-container'), {
              opacity: 1,
              y: 0,
              duration: 0.4,
              delay: 0.2,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            });
          }

          if (section.querySelector('.alt-content')) {
            gsap.to(section.querySelector('.alt-content'), {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: 0.3,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            });
          }

          ScrollTrigger.create({
            trigger: section,
            start: 'top center+=50',
            end: 'bottom center+=50',
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          });
        });

        if (timeline) {
          gsap.fromTo(
            timeline,
            { height: '0%' },
            {
              height: '100%',
              ease: 'none',
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top 25%',
                end: 'bottom 75%',
                scrub: 0.5,
              },
            }
          );

          document.querySelectorAll('.timeline-marker').forEach((marker, i) => {
            gsap.fromTo(
              marker,
              { scale: 0.5, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: 'back.out(2)',
                scrollTrigger: {
                  trigger: sections[i],
                  start: 'top center',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          });
        }
      }
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [stepsData.length, prefersReducedMotion]);

  return (
    <div
      ref={el => {
        containerRef.current = el;
        mainContainerRef.current = el;
      }}
      className="relative bg-white overflow-hidden py-16 sm:py-20"
      id="impact-section"
    >
      <div className="flex flex-col items-center z-10 relative mb-16 md:mb-24">
        <motion.div
          className="w-full max-w-4xl flex flex-col items-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.2 : 0.8,
            ease: 'easeOut',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.6,
              delay: 0.1,
            }}
          >
            <SectionLabel
              text="Simple • Intuitive • Powerful"
              size="medium"
              alignment="center"
              variant="modern"
              animationStyle="fade"
              pulseEffect={true}
            />
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900 relative inline-block text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.2,
              ease: 'easeOut',
            }}
          >
            <span className="relative">
              Simple Steps to{' '}
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600">
                Maximum Impact
                <motion.svg
                  className="absolute -bottom-2 left-0 right-0 w-full h-3 text-violet-500 opacity-60"
                  viewBox="0 0 100 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    delay: prefersReducedMotion ? 0.2 : 1,
                    duration: prefersReducedMotion ? 0.3 : 1.5,
                    ease: 'easeInOut',
                  }}
                >
                  <path
                    d="M0,5 Q20,10 35,5 Q50,0 65,5 Q80,10 100,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </motion.svg>
              </span>
            </span>
          </motion.h2>
          <motion.p
            className="text-base md:text-lg text-gray-600 max-w-3xl text-center leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.4,
              ease: 'easeOut',
            }}
          >
            Getting started on Product Bazar is fast, intuitive, and designed for immediate value,
            whether you're showcasing your innovation or discovering the next big thing.
          </motion.p>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl mt-12 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.6,
              ease: 'easeOut',
              staggerChildren: 0.15,
            }}
          >
            {[
              {
                value: 10000,
                label: 'Active Users',
                icon: <Users2Icon className="w-4 h-4" />,
              },
              {
                value: 5000,
                label: 'Products Launched',
                icon: <RocketIcon className="w-4 h-4" />,
              },
              {
                value: 94,
                label: '% Success Rate',
                icon: <ChartAreaIcon className="w-4 h-4" />,
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="flex flex-col items-center gap-2 px-6 py-6 relative overflow-hidden bg-white/50 rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out group"
                whileHover={{
                  y: prefersReducedMotion ? 0 : -6,
                  scale: prefersReducedMotion ? 1 : 1.03,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 12 }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-50 via-transparent to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">
                    <span className="tabular-nums">
                      <Counter from={0} to={stat.value} duration={2.5} />
                    </span>
                    {stat.label.includes('%') ? '%' : ''}
                  </h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1.5">
                    {stat.icon} {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {mainContainerInView && !isMobile && (
          <motion.div
            className="hidden xl:flex fixed left-8 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-2xl bg-white/70 backdrop-blur-md border border-gray-200/70"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            role="navigation"
            aria-label="Timeline navigation"
          >
            <div className="flex flex-col gap-5">
              {stepsData.map((step, index) => (
                <motion.div
                  key={index}
                  className="group relative flex items-center cursor-pointer"
                  onClick={() => scrollToStep(index)}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to step ${index + 1}: ${step.title}`}
                  aria-current={activeStep === index ? 'step' : undefined}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      scrollToStep(index);
                    }
                  }}
                >
                  {index > 0 && (
                    <div
                      className={`absolute left-[19px] -top-[23px] w-0.5 h-[24px] transition-all duration-500 ease-in-out origin-bottom ${
                        activeStep >= index
                          ? 'scale-y-100 bg-gradient-to-t from-violet-500 to-indigo-500'
                          : 'scale-y-0 bg-gray-300'
                      }`}
                      style={{ height: 'calc(1.25rem + 2px)' }}
                    ></div>
                  )}
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden group-hover:border-violet-400 ${
                      activeStep === index
                        ? 'border-violet-600 bg-violet-600 text-white scale-105'
                        : activeStep > index
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                    whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }}
                    animate={
                      activeStep === index && !prefersReducedMotion ? { scale: [1, 1.15, 1] } : {}
                    }
                    transition={{ duration: 0.6, ease: 'backInOut' }}
                  >
                    <AnimatePresence>
                      {activeStep > index && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 45 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 15,
                            duration: 0.3,
                          }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {activeStep <= index && (
                      <span className="text-sm font-medium relative z-10">{step.number}</span>
                    )}
                  </motion.div>
                  <AnimatePresence>
                    {hoveredStep === index && (
                      <motion.div
                        className="absolute left-12 ml-2 bg-gray-800 py-2 px-3.5 rounded-lg shadow-lg z-30"
                        initial={{ opacity: 0, x: -8, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -8, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                      >
                        <span className="text-xs font-semibold text-white whitespace-nowrap">
                          {step.title}
                        </span>
                        <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-0 timeline-container"
        style={{ top: '480px', bottom: '380px', width: '3px' }}
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          <div className="absolute inset-0 bg-gray-200 rounded-full" />
          <div
            ref={timelineRef}
            className="absolute top-0 left-0 w-full rounded-full bg-gradient-to-b from-violet-500 to-indigo-600"
            style={{ height: '0%' }}
          />
          {stepsData.map((_, index) => {
            const position = index === 0 ? 0 : (100 / (stepsData.length - 1)) * index;

            return (
              <div
                key={index}
                className={`timeline-marker absolute left-1/2 w-6 h-6 rounded-full border-2 transition-all duration-300 ease-in-out ${
                  activeStep === index
                    ? 'bg-violet-500 border-violet-700 scale-125 shadow-lg'
                    : 'bg-white border-violet-400'
                }`}
                style={{
                  top: `${position}%`,
                  transform: `translate(-50%, -50%)`,
                  opacity: 0,
                  zIndex: 1,
                }}
                ref={el => (timelineMarkersRef.current[index] = el)}
              >
                {activeStep === index && !prefersReducedMotion && (
                  <span className="absolute inset-[-4px] rounded-full bg-violet-500/20 animate-timeline-ping" />
                )}
              </div>
            );
          })}
          {!prefersReducedMotion &&
            [...Array(10)].map((_, i) => (
              <div
                key={`dot-${i}`}
                className="absolute left-1/2 w-1.5 h-1.5 rounded-full bg-violet-400/50 transform -translate-x-1/2"
                style={{
                  top: `${10 + i * 9}%`,
                  opacity: 0.4 + (i % 4) * 0.1,
                  zIndex: 0,
                }}
              />
            ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto mt-12">
        {stepsData.map((step, index) => {
          const [stepSectionRef, stepSectionInView] = useElementInView({
            threshold: 0.3,
          });

          return (
            <div
              key={index}
              ref={stepSectionRef}
              className="step-section relative mb-28 md:mb-36 last:mb-16 px-4"
              id={`step-${index + 1}`}
              role="region"
              aria-labelledby={`step-title-${index + 1}`}
              aria-describedby={`step-desc-${index + 1}`}
            >
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-center mb-8">
                  <motion.div
                    className="step-marker relative w-12 h-12 flex items-center justify-center rounded-full bg-violet-600 text-white z-20 shadow-md"
                    style={{
                      opacity: 0,
                      scale: 0.5,
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    {activeStep === index && !prefersReducedMotion && (
                      <span className="absolute inset-0 rounded-full bg-violet-600/20 animate-ping" />
                    )}
                    <span className="text-base font-medium">{step.number}</span>
                  </motion.div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                  <div className={`${index % 2 !== 0 ? 'md:order-2' : ''}`}>
                    <div
                      className="step-card group bg-white rounded-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5"
                      style={{ opacity: 0, transform: 'translateY(20px)' }}
                    >
                      <div className="h-1 bg-gradient-to-r from-violet-500/20 to-indigo-500/40" />
                      <div className="p-6 pb-3">
                        <div className="flex items-start gap-4">
                          <AnimatedIcon icon={step.icon} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3
                                id={`step-title-${index + 1}`}
                                className="text-lg font-semibold text-gray-900"
                              >
                                {step.title}
                              </h3>
                              {step.subtitle && (
                                <span className="text-xs font-medium px-2 py-0.5 bg-violet-500/10 text-violet-600 rounded-full">
                                  {step.subtitle}
                                </span>
                              )}
                            </div>
                            <div className="mt-3">
                              <ProgressBar progress={25 * step.number} />
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs text-gray-500">
                                  Step {step.number} of 4
                                </span>
                                <span className="text-xs font-medium text-right text-gray-700">
                                  {25 * step.number}% Complete
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 pb-4">
                        <p
                          id={`step-desc-${index + 1}`}
                          className="text-gray-600 text-sm leading-relaxed mb-6"
                        >
                          {step.description}
                        </p>
                        <div
                          className="stats-container grid grid-cols-2 gap-4 mb-2"
                          style={{ opacity: 0, transform: 'translateY(10px)' }}
                        >
                          {step.stats.map((stat, i) => (
                            <motion.div
                              key={i}
                              className="stat-item group relative bg-gray-50 rounded-lg p-4 border border-transparent transition-all duration-300 hover:border-violet-500/20 hover:-translate-y-1"
                              style={{
                                opacity: 0,
                                transform: 'translateY(10px)',
                              }}
                            >
                              <div className="text-lg font-semibold text-violet-600 transition-transform">
                                <Counter from={0} to={stat.value} duration={1.5} />
                                {stat.label.includes('%') ? '%' : ''}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                              {!prefersReducedMotion && (
                                <motion.div
                                  className="absolute inset-0 bg-violet-500/5 rounded-lg opacity-0 z-0"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
                        <motion.button
                          className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center ${
                            index === stepsData.length - 1
                              ? 'bg-violet-600 text-white shadow-sm hover:bg-violet-700'
                              : 'text-violet-600 bg-violet-500/10 hover:bg-violet-500/20'
                          } transition-all duration-300`}
                          whileHover={{ x: prefersReducedMotion ? 0 : 3 }}
                          whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                          onClick={() =>
                            index < stepsData.length - 1 ? scrollToStep(index + 1) : null
                          }
                          aria-label={
                            index < stepsData.length - 1
                              ? `Proceed to step ${index + 2}`
                              : 'Get Started Now'
                          }
                        >
                          <span>{index < stepsData.length - 1 ? 'Next Step' : 'Get Started'}</span>
                          <motion.div
                            animate={prefersReducedMotion ? {} : { x: [0, 3, 0] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatDelay: 2,
                            }}
                            className="inline-flex ml-1.5"
                          >
                            {index < stepsData.length - 1 ? (
                              <ArrowRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </motion.div>
                        </motion.button>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={
                              activeStep > index
                                ? 'completed'
                                : activeStep === index
                                ? 'inprogress'
                                : 'upcoming'
                            }
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs"
                          >
                            {activeStep > index ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                <span className="font-medium">Completed</span>
                              </div>
                            ) : activeStep === index ? (
                              <div className="flex items-center text-violet-600">
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 ${
                                    !prefersReducedMotion ? 'animate-pulse' : ''
                                  }`}
                                ></span>
                                <span className="font-medium">In progress</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">Coming up</span>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`${
                      index % 2 !== 0 ? 'md:order-1' : ''
                    } flex items-center justify-center alt-content min-h-[300px] md:min-h-[400px]`}
                    style={{ opacity: 0, transform: 'translateY(30px)' }}
                  >
                    {index % 2 === 0 ? (
                      <StepImage index={index} inView={stepSectionInView} />
                    ) : (
                      <ContentBox index={index} inView={stepSectionInView} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center w-full z-10 relative mt-16 md:mt-24">
        <div className="w-full max-w-3xl mx-auto px-4">
          <motion.div
            className="overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-8 md:p-10 flex flex-col items-center text-center">
              <div className="mb-4 w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600">
                <LightbulbIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
                Join thousands of successful product makers today
              </h3>
              <p className="text-gray-500 mb-6 max-w-xl text-sm md:text-base">
                Create your account in minutes and start showcasing your innovation to a community
                of eager discoverers, investors, and collaborators.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
                <GlobalButton
                  variant="primary"
                  size="md"
                  ariaLabel="Submit your product to Product Bazar"
                  href="/product/new"
                  className="w-full sm:w-auto"
                >
                  <span>Submit Your Product</span>
                  <motion.span
                    className="ml-1.5 inline-block"
                    animate={!prefersReducedMotion ? { x: [0, 3, 0] } : {}}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </GlobalButton>
                <GlobalButton
                  variant="outline"
                  size="md"
                  ariaLabel="Learn more about Product Bazar"
                  href="/about"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </GlobalButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {mainContainerInView && !isMobile && (
          <motion.div
            className="hidden md:block fixed bottom-6 right-6 z-40"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 bg-gray-800/95 backdrop-blur-sm rounded-lg py-2 px-4 text-xs text-gray-100 shadow-md border border-gray-700/50">
              <Keyboard className="w-3.5 h-3.5 opacity-80" />
              <span>
                Use <kbd className="font-sans font-semibold text-violet-300">←</kbd> /{' '}
                <kbd className="font-sans font-semibold text-violet-300">→</kbd> keys to navigate
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        :root {
          --primary-color: #8b5cf6; /* Violet-500 */
        }

        .bg-primary {
          background-color: var(--primary-color);
        }
        .text-primary {
          color: var(--primary-color);
        }
        .border-primary {
          border-color: var(--primary-color);
        }

        @keyframes ping {
          75%,
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes timeline-ping {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          75%,
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .animate-timeline-ping {
          animation: timeline-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .step-card,
        .stat-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-card:hover {
          transform: translateY(-5px);
        }
        .stat-item:hover {
          transform: translateY(-4px);
        }

        button:focus-visible,
        a:focus-visible,
        [tabindex='0']:focus-visible {
          outline: 3px solid var(--primary-color);
          outline-offset: 3px;
          border-radius: 6px;
        }

        kbd {
          background-color: rgba(110, 110, 110, 0.2);
          border-radius: 3px;
          border: 1px solid rgba(150, 150, 150, 0.2);
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
          padding: 1px 4px;
          margin: 0 2px;
          font-size: 0.8em;
          line-height: 1;
          color: var(--primary-color);
        }

        @media (min-width: 768px) {
          .timeline-container {
            top: 480px;
            bottom: 380px;
          }
        }
        @media (min-width: 1024px) {
          .timeline-container {
            top: 500px;
            bottom: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default Impact;
