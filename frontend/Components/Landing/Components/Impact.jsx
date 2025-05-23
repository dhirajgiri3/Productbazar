import {
  useRef,
  useEffect,
  useState,
  memo,
  useCallback,
  createRef,
  lazy,
  Suspense,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
  useReducedMotion,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import {
  UserCircle,
  Search,
  MessageSquareShare,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Users2Icon,
  RocketIcon,
  ChartAreaIcon,
  LightbulbIcon,
  Code,
  Layers,
  Wallet,
  Compass,
  ExternalLink,
  Keyboard, // <-- Import Keyboard icon
} from "lucide-react";
import GlobalButton from "../../UI/Buttons/GlobalButton";
import Image from "next/image";
import { useTheme } from "next-themes";
import SectionLabel from "./Animations/SectionLabel";

// Lazy loaded components for better performance
const LazyImage = lazy(() => import("next/image"));

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Optimized element visibility hook
const useElementInView = (options = {}) => {
  const ref = useRef(null);
  const inView = useInView(ref, {
    // Slightly larger margin to trigger a bit earlier/later for smoother appearance
    margin: options.margin || "-10% 0px -10% 0px",
    amount: options.amount || 0.1, // Ensure at least 10% is visible
    once: options.once || false,
  });

  return [ref, inView];
};

// Memoized counter component for better performance
const Counter = memo(({ from, to, duration = 2 }) => {
  const nodeRef = useRef(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, threshold: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (inView && nodeRef.current) {
      if (prefersReducedMotion) {
        // For users who prefer reduced motion, just show the final value
        nodeRef.current.textContent = to;
        return;
      }

      let startValue = from;
      const targetValue = to;
      const durationMs = duration * 1000;
      let startTime = null;

      const step = (timestamp) => {
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
            nodeRef.current.textContent = targetValue; // Ensure final value is exact
          }
        }
      };

      requestAnimationFrame(step);

      // Cleanup function not strictly needed with requestAnimationFrame like this
      // but good practice if complex logic were involved
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
Counter.displayName = "Counter";

// Optimized progress bar component
const ProgressBar = memo(({ progress }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full progress-gradient"
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
ProgressBar.displayName = "ProgressBar";

// Memoized icon wrapper for performance
const AnimatedIcon = memo(({ icon }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="w-10 h-10 rounded-md flex items-center justify-center bg-violet-500/10 dark:bg-violet-400/20 text-violet-600 dark:text-violet-300 shrink-0"
      whileHover={{ scale: prefersReducedMotion ? 1 : 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      {icon}
    </motion.div>
  );
});
AnimatedIcon.displayName = "AnimatedIcon";

const gradientBG =
  "bg-gradient-to-r from-violet-500/20 to-indigo-500/40 dark:from-violet-600/30 dark:to-indigo-600/50";

// Skeleton loader for image placeholders
const ImageSkeleton = () => (
  <div className="w-full h-full min-h-[250px] rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
);

// New Component: Rich content box for alternating with images
const ContentBox = memo(({ index, inView }) => {
  const prefersReducedMotion = useReducedMotion();

  // Different content variations based on step index
  const contentData = [
    {}, // Placeholder for step 1 (will be an image)
    {
      title: "Seamless Discovery",
      icon: <Compass className="w-5 h-5" />,
      features: [
        "Personalized recommendations based on your interests",
        "Advanced filtering and sorting options",
        "Save favorites to curated collections",
      ],
      action: "Start exploring",
    },
    {}, // Placeholder for step 3 (will be an image)
    {
      title: "Accelerate Growth",
      icon: <ChartAreaIcon className="w-5 h-5" />,
      features: [
        "Detailed analytics and performance tracking",
        "Connect with potential investors and partners",
        "Access marketing tools and resources",
      ],
      action: "Scale your product",
    },
  ];

  const data = contentData[index];
  if (!data.title) return null; // Return null for steps that should show images

  return (
    <motion.div
      className="w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.6, delay: 0.3 }}
    >
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg group hover:border-violet-500/30 transition-all duration-300">
        {/* Top accent */}
        <div className={`h-1 w-full ${gradientBG}`} />

        <div className="p-6">
          {/* Header with icon */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-10 h-10 rounded-full bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-600 dark:text-violet-300"
              initial={{ rotate: -5 }}
              whileHover={{ rotate: 0, scale: prefersReducedMotion ? 1 : 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {data.icon}
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.title}
            </h3>
          </div>

          {/* Feature list */}
          <ul className="space-y-3 mb-5">
            {data.features.map((feature, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : 0.4,
                  delay: prefersReducedMotion ? 0 : 0.4 + i * 0.1,
                }}
              >
                <CheckCircle className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* Action button */}
          <motion.button
            className="w-full py-2.5 px-4 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-medium rounded-md text-sm flex items-center justify-center gap-2 transition-colors duration-300 group"
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
ContentBox.displayName = "ContentBox";

// New Component: Image display component
const StepImage = memo(({ index, inView }) => {
  const prefersReducedMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Different images & styles based on step index
  const imageData = [
    {
      src: "https://res.cloudinary.com/dgak25skk/image/upload/v1745652131/macbook-pb1_lswn7v.png",
      alt: "User profile creation interface",
      width: 500,
      height: 350,
      style: "shadow",
    },
    {}, // Placeholder for step 2 (will be content box)
    {
      src: "https://res.cloudinary.com/dgak25skk/image/upload/v1745653024/raw_fmkvpv.png",
      alt: "Product engagement dashboard",
      width: 500,
      height: 350,
      style: "float",
    },
    {},
  ];

  const data = imageData[index];
  if (!data.src) return null; // Return null for steps that should show content

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto flex items-center justify-center h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.7, delay: 0.2 }}
    >
      <div className={`relative`}>
        {/* Main image */}
        <div className={`relative overflow-hidden rounded-lg`}>
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

          {/* Overlay effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
            whileHover={{ opacity: 0.2 }}
          />
        </div>

        {/* Decorative elements */}
        {data.style === "float" && (
          <>
            <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-violet-500/5 rounded-full -z-10" />
            <div className="absolute -top-2 -left-2 w-16 h-16 bg-indigo-500/5 rounded-full -z-10" />
          </>
        )}
      </div>

      {/* Caption below image */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 opacity-70">
        {data.alt}
      </div>
    </motion.div>
  );
});
StepImage.displayName = "StepImage";

const Impact = () => {
  // Refs and state
  const containerRef = useRef(null);
  const timelineRef = useRef(null);
  const timelineMarkersRef = useRef([]);
  const underlineRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState(null);

  // Hook to track if the main container is in view
  const [mainContainerRef, mainContainerInView] = useElementInView({
    // Adjust margin/amount as needed for when the sidebar/tooltip should appear/disappear
    margin: "-15% 0px -15% 0px",
    amount: 0.1,
  });

  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280); // Changed breakpoint to xl for sidebar
    };

    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener("resize", checkMobile);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkMobile);
      }
    };
  }, []);

  // Data structure for steps
  const stepsData = [
    {
      number: 1,
      title: "Join & Create Profile",
      subtitle: "Free",
      description:
        "Create your free account in minutes. Define your role (Maker, Discoverer, Investor, etc.) for a tailored experience and personalized recommendations.",
      icon: <UserCircle className="w-5 h-5" />,
      stats: [
        { value: 3, label: "minutes setup" },
        { value: 100, label: "% personalized" },
      ],
    },
    {
      number: 2,
      title: "Showcase & Explore",
      subtitle: "",
      description:
        "Makers: Easily submit your product with key details. Discoverers: Browse curated feeds, categories, trending lists, or search for specific solutions.",
      icon: <Search className="w-5 h-5" />,
      stats: [
        { value: 5000, label: "products" },
        { value: 24, label: "categories" },
      ],
    },
    {
      number: 3,
      title: "Engage & Connect",
      subtitle: "",
      description:
        "Upvote products you love, provide constructive feedback via comments, bookmark favorites, and connect directly with makers and other members.",
      icon: <MessageSquareShare className="w-5 h-5" />,
      stats: [
        { value: 87, label: "% engagement" },
        { value: 12000, label: "connections made" },
      ],
    },
    {
      number: 4,
      title: "Grow & Validate",
      subtitle: "",
      description:
        "Makers: Track product traction with analytics, gain insights, find collaborators. Discoverers: Build your toolkit, influence products, stay ahead of the curve.",
      icon: <TrendingUp className="w-5 h-5" />,
      stats: [
        { value: 47, label: "% growth average" },
        { value: 92, label: "% validation" },
      ],
    },
  ];

  // Optimized scroll handler
  const scrollToStep = useCallback(
    (index) => {
      const section = document.querySelectorAll(".step-section")[index];
      if (section) {
        const yOffset = -100; // Adjusted offset for better positioning with fixed elements
        const y =
          section.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
          top: y,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    },
    [prefersReducedMotion]
  );

  // Enhanced keyboard navigation - Only active when container is in view
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only navigate if the main container is in view and not on mobile
      if (!mainContainerInView || isMobile) return;

      let newStep = activeStep;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        newStep = Math.min(activeStep + 1, stepsData.length - 1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        newStep = Math.max(activeStep - 1, 0);
      }

      if (newStep !== activeStep) {
        setActiveStep(newStep);
        scrollToStep(newStep);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeStep,
    scrollToStep,
    stepsData.length,
    mainContainerInView,
    isMobile,
  ]);

  // Setup scroll animations with GSAP
  useEffect(() => {
    if (typeof window === "undefined" || prefersReducedMotion) return;

    const sections = gsap.utils.toArray(".step-section");
    const timeline = timelineRef.current;
    const underline = underlineRef.current;

    // Initialize timeline markers ref array
    timelineMarkersRef.current = Array(stepsData.length)
      .fill()
      .map((_, i) => timelineMarkersRef.current[i] || createRef());

    const ctx = gsap.context(() => {
      // Clear any existing ScrollTriggers to prevent duplicates
      ScrollTrigger.getAll().forEach((t) => t.kill());

      // Animate title underline
      if (underline) {
        gsap.fromTo(
          underline,
          { width: "0%" },
          {
            width: "100%",
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: underline,
              start: "top 85%",
            },
          }
        );
      }

      // Reset initial states
      gsap.set(".step-card", { y: 20, opacity: 0 });
      gsap.set(".step-marker", { scale: 0.5, opacity: 0 });
      gsap.set(".stats-container", { opacity: 0, y: 10 });
      gsap.set(".timeline-marker", { scale: 0.5, opacity: 0 });
      gsap.set(".alt-content", { y: 30, opacity: 0 });

      if (sections.length > 0) {
        // Create scroll-linked animations for each step
        sections.forEach((section, i) => {
          // Step card animation
          gsap.to(section.querySelector(".step-card"), {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 75%", // Start animation slightly earlier
              toggleActions: "play none none reverse",
            },
          });

          // Step marker animation
          if (section.querySelector(".step-marker")) {
            gsap.to(section.querySelector(".step-marker"), {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              delay: 0.1,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: section,
                start: "top 75%",
                toggleActions: "play none none reverse",
              },
            });
          }

          // Stats animation
          const statsItems = section.querySelectorAll(".stat-item");
          if (statsItems.length) {
            gsap.to(statsItems, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            });
          } else {
            gsap.to(section.querySelector(".stats-container"), {
              opacity: 1,
              y: 0,
              duration: 0.4,
              delay: 0.2,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            });
          }

          // Alternate content animation
          if (section.querySelector(".alt-content")) {
            gsap.to(section.querySelector(".alt-content"), {
              y: 0,
              opacity: 1,
              duration: 0.6,
              delay: 0.3,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 70%",
                toggleActions: "play none none reverse",
              },
            });
          }

          // Set active step based on scroll position
          ScrollTrigger.create({
            trigger: section,
            start: "top center+=50", // Adjust trigger point slightly below center
            end: "bottom center+=50",
            // markers: true, // Uncomment for debugging
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
            // Removed onLeave/onLeaveBack to prevent flickering when quickly scrolling
            // Active state relies solely on enter/enterBack now
          });
        });

        // Timeline progress animation
        if (timeline) {
          gsap.fromTo(
            timeline,
            { height: "0%" },
            {
              height: "100%",
              ease: "none",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 25%", // Start when container top hits 25% viewport height
                end: "bottom 75%", // End when container bottom hits 75% viewport height
                scrub: 0.5,
              },
            }
          );

          // Timeline markers animation
          document.querySelectorAll(".timeline-marker").forEach((marker, i) => {
            gsap.fromTo(
              marker,
              { scale: 0.5, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: "back.out(2)",
                scrollTrigger: {
                  trigger: sections[i],
                  start: "top center", // Animate marker when its section hits center
                  toggleActions: "play none none reverse",
                  // We use CSS/React state for active marker styling now
                },
              }
            );
          });
        }
      }
    }, containerRef); // Scope GSAP animations to the container

    // Cleanup function
    return () => {
      ctx.revert(); // Revert GSAP animations and kill ScrollTriggers
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [stepsData.length, prefersReducedMotion]); // Rerun if steps change or motion preference changes

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        mainContainerRef.current = el; // Assign ref for visibility hook
      }}
      className="relative bg-white dark:bg-gray-900 overflow-hidden py-12 sm:py-16"
      id="impact-section"
    >
      {/* Header section */}
      <div className="flex flex-col items-center z-10 relative mb-16 md:mb-24">
        <motion.div
          className="w-full max-w-4xl flex flex-col items-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0.2 : 0.8,
            ease: "easeOut",
          }}
        >
          {/* Section Label */}
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

          {/* Heading */}
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-gray-900 dark:text-white relative inline-block text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
          >
            <span className="relative">
              Simple Steps to{" "}
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-600 dark:from-violet-300 dark:to-indigo-400">
                Maximum Impact
                <motion.svg
                  className="absolute -bottom-2 left-0 right-0 w-full h-3 text-primary dark:text-primary-light opacity-60"
                  viewBox="0 0 100 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    delay: prefersReducedMotion ? 0.2 : 1,
                    duration: prefersReducedMotion ? 0.3 : 1.5,
                    ease: "easeInOut",
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

          {/* Description paragraph */}
          <motion.p
            className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-3xl text-center leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.4,
              ease: "easeOut",
            }}
          >
            Getting started on Product Bazar is fast, intuitive, and designed
            for immediate value, whether you're showcasing your innovation or
            discovering the next big thing.
          </motion.p>

          {/* Stats counter section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 w-full max-w-4xl mt-12 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.8,
              delay: 0.6,
              ease: "easeOut",
              staggerChildren: 0.15, // Slightly increased stagger
            }}
          >
            {[
              {
                value: 10000,
                label: "Active Users",
                icon: <Users2Icon className="w-4 h-4" />,
              },
              {
                value: 5000,
                label: "Products Launched",
                icon: <RocketIcon className="w-4 h-4" />,
              },
              {
                value: 94,
                label: "% Success Rate",
                icon: <ChartAreaIcon className="w-4 h-4" />,
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className={`flex flex-col items-center gap-2 px-6 py-6 relative overflow-hidden
                  bg-white/50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-700/60
                  shadow-sm hover:shadow-lg transition-all duration-300 ease-in-out group
                  ${idx !== 2 ? "sm:border-r-0" : ""} // Removed inter-item borders for a cleaner look with individual cards
                `}
                whileHover={{
                  y: prefersReducedMotion ? 0 : -6,
                  scale: prefersReducedMotion ? 1 : 1.03,
                  boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                }}
                transition={{ type: "spring", stiffness: 350, damping: 12 }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-50 via-transparent to-indigo-50 dark:from-violet-900/10 dark:via-transparent dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-1">
                    <span className="tabular-nums">
                      <Counter from={0} to={stat.value} duration={2.5} />
                    </span>
                    {stat.label.includes("%") ? "%" : ""}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1.5">
                    {stat.icon} {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* --- Enhanced Desktop Sidebar Navigation --- */}
      <AnimatePresence>
        {mainContainerInView &&
          !isMobile && ( // Conditionally render based on main container visibility and NOT mobile
            <motion.div
              className="hidden xl:flex fixed left-8 top-1/2 transform -translate-y-1/2 z-30 p-3 rounded-2xl
                       bg-white/70 dark:bg-gray-800/70 backdrop-blur-md
                       border border-gray-200/70 dark:border-gray-700/50"
              initial={{ opacity: 0, x: -25 }} // Slightly increased x offset
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }} // Adjusted ease
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
                    aria-current={activeStep === index ? "step" : undefined}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        scrollToStep(index);
                      }
                    }}
                  >
                    {/* Vertical connecting line - enhanced appearance */}
                    {index > 0 && (
                      <div
                        className={`absolute left-[19px] -top-[23px] w-0.5 h-[24px] transition-all duration-500 ease-in-out origin-bottom // Adjusted height and top
                                ${activeStep >= index
                                  ? "scale-y-100 bg-gradient-to-t from-violet-500 to-indigo-500"
                                  : "scale-y-0 bg-gray-300 dark:bg-gray-600" // Softer inactive line
                                }`}
                        style={{
                          height: "calc(1.25rem + 2px)", // gap-5 is 1.25rem
                        }}
                      ></div>
                    )}

                    {/* Step number indicator - enhanced appearance */}
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative overflow-hidden
                                  group-hover:border-violet-400 dark:group-hover:border-violet-500 // Hover effect on parent
                                  ${activeStep === index
                                    ? "border-violet-600 bg-violet-600 text-white scale-105" // Enhanced active state
                                    : activeStep > index
                                      ? "border-violet-500 bg-violet-500 text-white"
                                      : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400" // Adjusted default
                                  }`}
                      whileHover={{ scale: prefersReducedMotion ? 1 : 1.1 }} // Consistent hover scale
                      animate={activeStep === index && !prefersReducedMotion ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.6, ease: "backInOut" }}
                    >
                      {/* Animated checkmark for completed steps */}
                      <AnimatePresence>
                        {activeStep > index && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 45 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              duration: 0.3,
                            }}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Show number only if not completed */}
                      {activeStep <= index && (
                        <span className="text-sm font-medium relative z-10">
                          {" "}
                          {/* Ensure number is above checkmark anim */}
                          {step.number}
                        </span>
                      )}
                    </motion.div>

                    {/* Tooltip - slightly refined */}
                    <AnimatePresence>
                      {hoveredStep === index && ( // Only show on hover now
                        <motion.div
                          className="absolute left-12 ml-2 bg-gray-800 dark:bg-gray-900 py-2 px-3.5 rounded-lg shadow-lg z-30" // Enhanced tooltip style
                          initial={{ opacity: 0, x: -8, scale: 0.95 }} // Added scale animation
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -8, scale: 0.95 }}
                          transition={{ duration: 0.25, ease: "easeOut" }} // Smoother transition
                        >
                          <span className="text-xs font-semibold text-white dark:text-gray-100 whitespace-nowrap">
                            {step.title}
                          </span>
                           <div className="absolute left-[-3px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-900 transform rotate-45"></div> {/* Tooltip arrow */}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
      </AnimatePresence>
      {/* --- End Enhanced Sidebar --- */}

      {/* Central timeline */}
      <div
        className="hidden md:block absolute left-1/2 transform -translate-x-1/2 z-0 timeline-container"
        style={{ top: "450px", bottom: "400px", width: "3px" }} // Slightly thicker line
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          {/* Background line */}
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700/80 rounded-full" />

          {/* Progress line */}
          <div
            ref={timelineRef}
            className="absolute top-0 left-0 w-full rounded-full bg-gradient-to-b from-violet-500 via-purple-500 to-indigo-600" // Adjusted gradient
            style={{ height: "0%" }} // Driven by GSAP
          />

          {/* Timeline markers */}
          {stepsData.map((_, index) => {
            const position =
              index === 0 ? 0 : (100 / (stepsData.length - 1)) * index;

            return (
              <div
                key={index}
                className={`timeline-marker absolute left-1/2 w-5 h-5 rounded-full border-2 transition-all duration-300 ease-in-out // Increased size
                           ${activeStep === index
                             ? "bg-violet-500 border-violet-700 dark:bg-violet-400 dark:border-violet-200 scale-110 shadow-lg" // Enhanced active marker
                             : "bg-white dark:bg-gray-800 border-violet-400 dark:border-violet-500" // Adjusted inactive marker
                           }`}
                style={{
                  top: `${position}%`,
                  transform: `translate(-50%, -50%)`,
                  opacity: 0,
                  zIndex: 1,
                }}
                ref={(el) => (timelineMarkersRef.current[index] = el)}
              >
                {/* Pulsing effect for active marker - moved to CSS */}
                {activeStep === index && !prefersReducedMotion && (
                  <span className="absolute inset-[-4px] rounded-full bg-violet-500/20 animate-timeline-ping" />
                )}
              </div>
            );
          })}

          {/* Decorative dots */}
          {!prefersReducedMotion &&
            [...Array(10)].map((_, i) => ( // Increased dot count
              <div
                key={`dot-${i}`}
                className="absolute left-1/2 w-1.5 h-1.5 rounded-full bg-violet-400/50 dark:bg-violet-500/70 transform -translate-x-1/2" // Slightly larger dots
                style={{
                  top: `${10 + i * 9}%`, // Adjusted spacing
                  opacity: 0.4 + (i % 4) * 0.1, // Adjusted opacity variance
                  zIndex: 0,
                }}
              />
            ))}
        </div>
      </div>

      {/* Steps container */}
      <div className="relative z-10 max-w-6xl mx-auto mt-12">
        {stepsData.map((step, index) => {
          const [stepSectionRef, stepSectionInView] = useElementInView({
            threshold: 0.3, // Trigger animations when 30% visible
            // once: true, // Keep once: true if you don't want re-animations on scroll back
          });

          return (
            <div
              key={index}
              ref={stepSectionRef}
              className="step-section relative mb-24 md:mb-32 last:mb-16 px-4" // Increased spacing
              id={`step-${index + 1}`}
              role="region"
              aria-labelledby={`step-title-${index + 1}`}
            >
              <div className="max-w-5xl mx-auto">
                {/* Step number badge */}
                <div className="flex justify-center mb-8">
                  <motion.div
                    className="step-marker relative w-12 h-12 flex items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500 text-white z-20 shadow-md"
                    style={{
                      opacity: 0,
                      scale: 0.5,
                      boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                    }}
                  >
                    {/* Pulsing effect for active step */}
                    {activeStep === index && !prefersReducedMotion && (
                      <span className="absolute inset-0 rounded-full bg-violet-600/20 animate-ping" />
                    )}
                    <span className="text-base font-medium">{step.number}</span>
                  </motion.div>
                </div>

                {/* Content container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                  {" "}
                  {/* Added items-center */}
                  {/* Step Card Column */}
                  <div className={`${index % 2 !== 0 ? "md:order-2" : ""}`}>
                    <div
                      className="step-card group bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:border-violet-500/20 dark:hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/5 dark:hover:shadow-violet-400/5" // Adjusted shadow
                      style={{ opacity: 0, transform: "translateY(20px)" }} // Initial state for GSAP
                    >
                      {/* Card header */}
                      <div className={`${gradientBG} h-1`} />

                      <div className="p-6 pb-3">
                        <div className="flex items-start gap-4">
                          <AnimatedIcon icon={step.icon} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3
                                id={`step-title-${index + 1}`}
                                className="text-lg font-semibold text-gray-900 dark:text-white"
                              >
                                {step.title}
                              </h3>
                              {step.subtitle && (
                                <span className="text-xs font-medium px-2 py-0.5 bg-violet-500/10 text-violet-600 dark:text-violet-300 rounded-full">
                                  {step.subtitle}
                                </span>
                              )}
                            </div>
                            {/* Progress indicator */}
                            <div className="mt-3">
                              <ProgressBar progress={25 * step.number} />
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Step {step.number} of 4
                                </span>
                                <span className="text-xs font-medium text-right text-gray-700 dark:text-gray-300">
                                  {25 * step.number}% Complete
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-4">
                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                          {step.description}
                        </p>

                        {/* Stats grid */}
                        <div
                          className="stats-container grid grid-cols-2 gap-4 mb-2"
                          style={{ opacity: 0, transform: "translateY(10px)" }} // Initial state for GSAP
                        >
                          {step.stats.map((stat, i) => (
                            <motion.div
                              key={i}
                              className="stat-item group relative bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 border border-transparent transition-all duration-300 hover:border-violet-500/20 hover:-translate-y-1"
                              style={{
                                opacity: 0,
                                transform: "translateY(10px)",
                              }} // Initial state for GSAP
                            >
                              <div className="text-lg font-semibold text-violet-600 dark:text-violet-400 transition-transform">
                                <Counter
                                  from={0}
                                  to={stat.value}
                                  duration={1.5}
                                />
                                {stat.label.includes("%") ? "%" : ""}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {stat.label}
                              </div>
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

                      {/* Action buttons */}
                      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <motion.button
                          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                            index === stepsData.length - 1
                              ? "bg-violet-600 dark:bg-violet-500 text-white shadow-sm hover:bg-violet-700 dark:hover:bg-violet-600"
                              : "text-violet-600 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20"
                          } transition-all duration-300`}
                          whileHover={{ x: prefersReducedMotion ? 0 : 3 }}
                          whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
                          onClick={
                            () =>
                              index < stepsData.length - 1
                                ? scrollToStep(index + 1)
                                : null // Or link to signup/dashboard
                          }
                          aria-label={
                            index < stepsData.length - 1
                              ? `Proceed to step ${index + 2}`
                              : "Get Started Now"
                          }
                        >
                          <span>
                            {index < stepsData.length - 1
                              ? "Next Step"
                              : "Get Started"}
                          </span>
                          <motion.div
                            animate={
                              prefersReducedMotion ? {} : { x: [0, 3, 0] }
                            }
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

                        {/* Step completion status */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={
                              activeStep > index
                                ? "completed"
                                : activeStep === index
                                ? "inprogress"
                                : "upcoming"
                            }
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs"
                          >
                            {activeStep > index ? (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                <span className="font-medium">Completed</span>
                              </div>
                            ) : activeStep === index ? (
                              <div className="flex items-center text-violet-600 dark:text-violet-400">
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 ${
                                    !prefersReducedMotion ? "animate-pulse" : ""
                                  }`}
                                ></span>
                                <span className="font-medium">In progress</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">
                                Coming up
                              </span>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  {/* ALTERNATING SECOND COLUMN */}
                  <div
                    className={
                      `${
                        index % 2 !== 0 ? "md:order-1" : ""
                      } flex items-center justify-center alt-content min-h-[300px] md:min-h-[400px]` // Added min-height
                    }
                    style={{ opacity: 0, transform: "translateY(30px)" }} // Initial state for GSAP
                  >
                    {/* Show image for steps 1 and 3, content box for steps 2 and 4 */}
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

      {/* Call to action */}
      <div className="flex justify-center w-full z-10 relative mt-16 md:mt-24">
        <div className="w-full max-w-3xl mx-auto px-4">
          <motion.div
            className="overflow-hidden" // Added background and shadow
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-8 md:p-10 flex flex-col items-center text-center">
              {" "}
              {/* Increased padding */}
              <div className="mb-4 w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-300">
                {" "}
                {/* Larger icon */}
                <LightbulbIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                {" "}
                {/* Larger text */}
                Join thousands of successful product makers today
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xl text-sm md:text-base">
                {" "}
                {/* Adjusted text size */}
                Create your account in minutes and start showcasing your
                innovation to a community of eager discoverers, investors, and
                collaborators.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md">
                {" "}
                {/* Constrained width */}
                <GlobalButton
                  variant="primary"
                  size="md"
                  ariaLabel="Submit your product to Product Bazar"
                  href="/product/new"
                  className="w-full sm:w-auto" // Full width on small screens
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
                  className="w-full sm:w-auto" // Full width on small screens
                >
                  Learn More
                </GlobalButton>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* --- Enhanced Keyboard Navigation Tooltip --- */}
      <AnimatePresence>
        {mainContainerInView &&
          !isMobile && ( // Conditionally render based on main container visibility and NOT mobile
            <motion.div
              className="hidden md:block fixed bottom-6 right-6 z-40" // Keep hidden on small screens, adjusted position/z-index
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div
                className="flex items-center gap-2 bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-sm // Darker background
                         rounded-lg py-2 px-4 text-xs text-gray-100 dark:text-gray-200
                         shadow-md border border-gray-700/50
                         "
              >
                <Keyboard className="w-3.5 h-3.5 opacity-80" />
                <span>
                  Use{" "}
                  <kbd className="font-sans font-semibold text-violet-300">
                    ←
                  </kbd>{" "}
                  /{" "}
                  <kbd className="font-sans font-semibold text-violet-300">
                    →
                  </kbd>{" "}
                  keys to navigate
                </span>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
      {/* --- End Enhanced Tooltip --- */}

      <style jsx global>{`
        /* CSS variables for theming */
        :root {
          --primary-color: #8b5cf6; /* Violet-500 */
          --primary-light: #a78bfa; /* Violet-400 */
          --primary-dark: #7c3aed; /* Violet-600 */
          --secondary-color: #6366f1; /* Indigo-500 */
        }

        .dark {
          --primary-color: #a78bfa; /* Violet-400 */
          --primary-light: #c4b5fd; /* Violet-300 */
          --primary-dark: #8b5cf6; /* Violet-500 */
          --secondary-color: #818cf8; /* Indigo-400 */
        }

        /* Primary color classes */
        .bg-primary {
          background-color: var(--primary-color);
        }
        .text-primary {
          color: var(--primary-color);
        }
        .border-primary {
          border-color: var(--primary-color);
        }

        /* Enhanced animation keyframes */
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

        /* Smooth hover transitions */
        .step-card,
        .stat-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .step-card:hover {
          transform: translateY(-5px);
        } /* Slightly more lift */
        .stat-item:hover {
          transform: translateY(-4px);
        }

        /* Progress gradient */
        .progress-gradient {
          background: linear-gradient(
            90deg,
            var(--primary-dark),
            var(--primary-color),
            var(--secondary-color)
          );
        }

        /* Focus styles */
        button:focus-visible,
        a:focus-visible,
        [tabindex="0"]:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 3px;
          border-radius: 6px; /* Ensure outline follows shape */
        }

        /* KBD styles */
        kbd {
          background-color: rgba(110, 110, 110, 0.2);
          border-radius: 3px;
          border: 1px solid rgba(150, 150, 150, 0.2);
          box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
          padding: 1px 4px;
          margin: 0 2px;
          font-size: 0.8em;
          line-height: 1;
          color: var(--primary-light); /* Use theme color */
        }

        /* Specific adjustments for timeline container on medium screens */
        @media (min-width: 768px) {
          .timeline-container {
            top: 480px; /* Adjust based on header height */
            bottom: 350px; /* Adjust based on footer/CTA height */
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
