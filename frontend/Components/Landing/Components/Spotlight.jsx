import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from "framer-motion";
import { ArrowUp, MessageSquare, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/contexts/theme-context";
import SectionLabel from "./Animations/SectionLabel";

// --- ProductCard Component (Mostly Unchanged - Layout is internal) ---
const ProductCard = ({
  imageUrl,
  category,
  name,
  tagline,
  upvotes,
  comments,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const { isDarkMode } = useTheme();

  // Simplified subtle hover effect with performance optimizations
  const handleMouseMove = (e) => {
    if (!cardRef.current || window.innerWidth < 768) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) / (width / 2);
    const y = (clientY - top - height / 2) / (height / 2);
    const tiltX = y * 7;
    const tiltY = -x * 7;
    cardRef.current.style.transform = `perspective(2000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.01, 1.01, 1.01)`;
    cardRef.current.style.transition = "transform 0.1s ease-out";
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(2000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    cardRef.current.style.transition = "transform 0.4s ease-out";
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`flex-shrink-0 w-full rounded-xl overflow-hidden transition-all duration-300 group border ${
        isDarkMode
          ? "bg-gray-800/90 border-gray-700/60"
          : "bg-white border-gray-100"
      } shadow-sm ${isDarkMode ? "shadow-gray-900/30" : ""}`}
      style={{
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      whileHover={{
        borderColor: isDarkMode ? "rgba(124, 58, 237, 0.3)" : "rgba(124, 58, 237, 0.2)",
        boxShadow: isDarkMode ? "0 4px 20px rgba(0, 0, 0, 0.2)" : "0 4px 20px rgba(124, 58, 237, 0.1)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative overflow-hidden">
        {/* Using padding-top hack for aspect ratio is often more reliable than aspect-* utils */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
          <motion.img
            src={imageUrl}
            alt={`${name} preview`}
            className="absolute top-0 left-0 w-full h-full object-cover"
            loading="lazy"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
          />
        </div>
        <motion.div
          className="absolute top-3 left-3 z-10" // Ensure category is above image hover scale
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <span className={`inline-block ${
            isDarkMode
              ? "bg-violet-900/60 backdrop-blur-sm text-violet-200 border-violet-700/40"
              : "bg-violet-50/80 backdrop-blur-sm text-violet-700 border-violet-100/30"
            } text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm ${
              isDarkMode ? "shadow-black/20" : ""
            }`}>
            {category}
          </span>
        </motion.div>
      </div>

      {/* Card content uses flex column for vertical arrangement */}
      <motion.div
        className={`p-5 flex flex-col flex-grow ${isDarkMode ? "text-gray-200" : ""}`} // flex-grow ensures footer sticks to bottom if needed
        style={{ transform: "translateZ(20px)" }}
      >
        <div className="flex-grow"> {/* Content area expands */}
          <h3 className={`text-lg font-medium ${
            isDarkMode
              ? "text-gray-100 group-hover:text-violet-300"
              : "text-gray-900 group-hover:text-violet-700"
            } mb-1.5 transition-colors duration-300`}>
            {name}
          </h3>
          <p className={`${
            isDarkMode ? "text-gray-400" : "text-gray-500"
            } text-sm mb-4 leading-relaxed`}>
            {tagline}
          </p>
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center text-sm pt-3 border-t ${
          isDarkMode ? "border-gray-700/50" : "border-gray-100"
          }`}>
          <div className="flex items-center space-x-4">
            <motion.div
              className={`flex items-center space-x-1 ${
                isDarkMode ? "text-violet-400" : "text-violet-600"
                } font-medium`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowUp size={15} strokeWidth={2.5} />
              <span>{upvotes}</span>
            </motion.div>
            <div className={`flex items-center space-x-1 ${
              isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}>
              <MessageSquare size={15} strokeWidth={2} />
              <span>{comments}</span>
            </div>
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ x: 10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 5, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <a
                  href="#" // Consider making this a real link or button
                  className={`${
                    isDarkMode
                      ? "text-violet-400 hover:text-violet-300"
                      : "text-violet-600 hover:text-violet-800"
                    } text-xs font-medium flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                      isDarkMode ? "focus-visible:ring-offset-gray-800" : ""
                    } rounded-sm`}
                  aria-label={`View details for ${name}`} // Accessibility
                >
                  View Details
                  <motion.div
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.5 }}
                  >
                    <ArrowRight size={14} className="ml-1" />
                  </motion.div>
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};


// --- Spotlight Component (Refactored Layout) ---
const Spotlight = () => {
  const sectionRef = useRef(null);
  const carouselRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Always call hooks in the same order
  const { isDarkMode } = useTheme();
  const isInView = useInView(sectionRef, { once: false, amount: 0.1 });
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // Define products array at the top to ensure it's always available for hooks
  const products = [
    { imageUrl: "https://images.unsplash.com/photo-1601158935942-52255782d322?q=80&w=2691&auto=format&fit=crop&ixlib=rb-4.0.3", category: "AI / Dev Tools", name: "CodePilot AI Assist", tagline: "Intelligent code completion and review powered by state-of-the-art ML models.", upvotes: 312, comments: 28, },
    { imageUrl: "https://plus.unsplash.com/premium_photo-1661962960694-0b4ed303744f?q=80&w=3135&auto=format&fit=crop&ixlib=rb-4.0.3", category: "SaaS / Productivity", name: "FlowState Task Manager", tagline: "Seamlessly manage projects with intuitive workflows and team collaboration.", upvotes: 280, comments: 19, },
    { imageUrl: "https://images.unsplash.com/photo-1639395241103-9c855f93a90c?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.0.3", category: "No-Code / Automation", name: "Connecta Bridge", tagline: "Visually integrate your favorite apps without code. 200+ integrations.", upvotes: 450, comments: 35, },
    { imageUrl: "https://images.unsplash.com/photo-1648134859177-66e35b61e106?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3", category: "AI / Analytics", name: "Insight Engine Pro", tagline: "Uncover deep customer insights with advanced AI algorithms.", upvotes: 395, comments: 41, },
    { imageUrl: "https://images.unsplash.com/photo-1639395241103-9c855f93a90c?q=80&w=2400&auto=format&fit=crop&ixlib=rb-4.0.3", category: "Design / Tools", name: "ProtoPalette", tagline: "Generate beautiful color schemes and UI components with AI suggestions.", upvotes: 275, comments: 23, },
    { imageUrl: "https://images.unsplash.com/photo-1601158935942-52255782d322?q=80&w=2691&auto=format&fit=crop&ixlib=rb-4.0.3", category: "Marketing / Automation", name: "GrowthPulse", tagline: "Automate marketing campaigns with smart triggers and personalized journeys.", upvotes: 328, comments: 31, },
  ];

  // Calculate derived values that depend on products length
  const totalScrollDistance = Math.max(0, products.length - cardsPerView);
  
  // Always call useTransform with consistent parameters
  const x = useTransform(
    smoothProgress,
    [0.1, 0.9],
    [0, -(width + 20) * totalScrollDistance]
  );

  // Always call these useTransform hooks, even if they won't be used on mobile
  const progressOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const progressWidth = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  // Define animation variants before useEffect
  const fadeInUp = {
    opacity: 0,
    y: 20,
    transition: { duration: 0.6, ease: "easeOut" },
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  useEffect(() => {
    const updateDimensions = () => {
      let newCardsPerView = 3;
      let mobile = false;
      const screenWidth = window.innerWidth;

      if (screenWidth < 640) {
        newCardsPerView = 1;
        mobile = true;
      } else if (screenWidth < 1024) {
        newCardsPerView = 2;
      } else {
        newCardsPerView = 3;
      }

      setIsMobile(mobile);
      setCardsPerView(newCardsPerView);

      if (carouselRef.current) {
        const containerWidth = carouselRef.current.offsetWidth;
        const gap = 20;
        const cardWidth = (containerWidth - (gap * (newCardsPerView - 1))) / newCardsPerView;
        setWidth(cardWidth);
      }

      // Reset index if resizing causes current index to be out of bounds
      setCurrentIndex(prev => Math.min(prev, Math.max(0, products.length - newCardsPerView)));
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []); // Remove products.length dependency to prevent hook order issues


  const handleNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, products.length - cardsPerView));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section
      ref={sectionRef}
      className={`overflow-hidden py-12 sm:py-16 bg-white dark:bg-gray-900`} // Added consistent vertical padding
      aria-labelledby="spotlight-heading" // Accessibility
    >
      {/* Use flex column for main content flow and gap for spacing */}
      <div className="container mx-auto px-4 sm:px-6 flex flex-col gap-12 lg:gap-16">

        {/* Header Section */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
          className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4 z-10" // Flex column, gap for spacing, center items
        >
          <motion.div variants={fadeInUp}>
            <SectionLabel
              text="Spotlight"
              size="small"
              alignment="center"
              variant="modern"
              glowEffect={true}
              animationStyle="fade"
            />
          </motion.div>

          <motion.h2
            id="spotlight-heading" // Link aria-labelledby
            variants={fadeInUp}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold ${
              isDarkMode ? "text-gray-50" : "text-gray-900"
              } tracking-tight transition-colors duration-300`}
          >
            <span className="relative inline-block">
              Innovation
              <motion.span
                className={`absolute -bottom-1 left-0 w-full h-1 ${
                  isDarkMode ? "bg-violet-700" : "bg-violet-200"
                  } rounded-full`}
                initial={{ width: 0, transform: "translateX(-50%)", left: "50%" }}
                animate={isInView ? { width: "100%", transform: "translateX(0%)", left: "0%" } : {}}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              />
            </span>{" "}
            <span className={isDarkMode ? "text-violet-400" : "text-violet-600"}>Taking Flight</span>
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className={`text-base ${
              isDarkMode ? "text-gray-300" : "text-gray-500"
              } leading-relaxed max-w-2xl transition-colors duration-300`} // mx-auto is inherited from parent centering
          >
            Explore curated solutions gaining traction within our community —
            from AI-powered tools to no-code platforms solving real problems.
          </motion.p>
        </motion.div>

        {/* Scroll Progress Indicator (Desktop only) */}
        {!isMobile && (
          <motion.div
            className={`max-w-4xl mx-auto relative h-0.5 ${
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
              } rounded-full overflow-hidden transition-colors duration-300`}
            style={{ opacity: progressOpacity }}
            aria-hidden="true" // Decorative element
          >
            <motion.div
              className={`absolute top-0 left-0 h-full ${
                isDarkMode ? "bg-violet-400" : "bg-violet-500"
                } rounded-full transition-colors duration-300`}
              style={{ width: progressWidth }}
            />
          </motion.div>
        )}

        {/* Carousel Section - Centered container */}
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 sm:gap-6">
          {/* Mobile Navigation */}
          {isMobile && (
            <div className="flex justify-between items-center px-1"> {/* Added px-1 to align with card padding */}
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                  isDarkMode ? "focus-visible:ring-offset-gray-900" : ""
                } ${currentIndex === 0
                    ? `opacity-30 cursor-not-allowed ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`
                    : isDarkMode
                      ? 'text-violet-400 bg-violet-900/60 hover:bg-violet-800/70 shadow-sm dark:shadow-gray-900/30'
                      : 'text-violet-600 bg-violet-50 hover:bg-violet-100 shadow-sm'
                  }`}
                aria-label="Previous product"
              >
                <ChevronLeft size={18} />
              </button>
              {/* Mobile Dots Indicator */}
              <div className="flex space-x-1.5">
                {Array.from({ length: products.length - cardsPerView + 1 }).map((_, idx) => (
                  <motion.button
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      idx === currentIndex
                        ? isDarkMode ? 'bg-violet-400' : 'bg-violet-500'
                        : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => setCurrentIndex(idx)}
                    animate={{ scale: idx === currentIndex ? 1.2 : 1 }}
                    transition={{ duration: 0.2 }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={currentIndex >= products.length - cardsPerView}
                className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                  isDarkMode ? "focus-visible:ring-offset-gray-900" : ""
                } ${currentIndex >= products.length - cardsPerView
                    ? `opacity-30 cursor-not-allowed ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`
                    : isDarkMode
                      ? 'text-violet-400 bg-violet-900/60 hover:bg-violet-800/70 shadow-sm dark:shadow-gray-900/30'
                      : 'text-violet-600 bg-violet-50 hover:bg-violet-100 shadow-sm'
                  }`}
                aria-label="Next product"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Cards Container */}
          <div className="overflow-hidden" ref={carouselRef}>
            <motion.div
              className="flex space-x-5 px-1 pb-1" // space-x-5 = 20px gap. px/pb-1 for slight overflow room/focus rings
              style={isMobile ? {
                // Use translate for smoother mobile animation if preferred over x
                transform: `translateX(-${(width + 20) * currentIndex}px)`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)" // Smoother ease
              } : { x }} // x uses the scroll-linked animation on desktop
              role="list" // Semantics for the list of products
            >
              {products.map((product, index) => (
                <motion.div
                  key={index}
                  role="listitem" // Semantics
                  custom={index} // For potential staggered animations if needed later
                  variants={fadeInUp} // Reuse fade-in variant for individual cards
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }} // Trigger when 20% is visible
                  className="flex" // Ensure items within the flex container behave correctly
                  style={{
                    // flex-basis calculation is cleaner than setting width directly
                    flex: `0 0 auto`, // Don't grow, don't shrink, base size is auto (determined by width below)
                    width: `${width}px`,
                  }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>


        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} // Slight delay after cards potentially animate in
          viewport={{ once: true, amount: 0.5 }} // Trigger when halfway visible
          className="flex justify-center" // Center the button container
        >
          <motion.a
            href="#explore" // Make sure this links somewhere meaningful
            className={`inline-flex items-center justify-center px-6 py-3 ${
              isDarkMode
                ? "bg-violet-700 hover:bg-violet-600"
                : "bg-violet-600 hover:bg-violet-700"
              } text-white rounded-full font-medium transition-all duration-300 group shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                isDarkMode ? "focus-visible:ring-offset-gray-900" : "focus-visible:ring-offset-white"
              }`}
            whileHover={{
              scale: 1.03,
              boxShadow: isDarkMode
                ? "0 10px 20px -5px rgba(124, 58, 237, 0.4)"
                : "0 10px 20px -5px rgba(124, 58, 237, 0.25)"
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 15 }}
          >
            Explore All Innovations
            <motion.span // Use span instead of div for inline flow
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
              className="ml-2 inline-block" // Ensures proper spacing and alignment
            >
              <ArrowRight size={16} />
            </motion.span>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default Spotlight;