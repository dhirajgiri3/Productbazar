"use client";

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useInView,
  useScroll,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useRef, useState, memo, useMemo } from "react";
import {
  Target,
  MessageSquare,
  Shield,
  Brain,
  Network,
  TrendingUp,
  Zap,
  MessageCircle,
  Award,
  Sparkles,
  Users,
  LineChart,
  ArrowRight,
} from "lucide-react";
import GlobalButton from "../../UI/Buttons/GlobalButton";
import SectionLabel from "./Animations/SectionLabel";

// Map icon names to imported components
const LucideIconsMap = {
  Target,
  MessageSquare,
  Shield,
  Brain,
  Network,
  TrendingUp,
  Zap,
  MessageCircle,
  Award,
  Sparkles,
  Users,
  LineChart,
  ArrowRight,
};

// Advantage Data
const advantageData = [
  {
    id: "targeted",
    title: "Targeted Tech Exposure",
    description:
      "Reach genuinely engaged early adopters, potential customers, and tech enthusiasts actively seeking new SaaS, AI, Dev Tools, and No-Code solutions.",
    gridClass: "col-span-2 row-span-1 md:col-span-2 sm:col-span-1",
    color: {
      bg: "from-indigo-50/90 to-indigo-100/90",
      text: "text-indigo-900",
      accent: "#818cf8", // Indigo-400
      border: "#c7d2fe", // Indigo-200
    },
    icon: "Target",
    badgeIcon: "Zap",
    delay: 0,
    category: "acquisition",
  },
  {
    id: "feedback",
    title: "Quality Feedback Loop",
    description:
      "Gather specific, actionable insights from a knowledgeable community to refine your product, iterate faster, and build a stronger roadmap.",
    gridClass: "col-span-1 row-span-1 md:col-span-1 sm:col-span-1",
    color: {
      bg: "from-amber-50/90 to-amber-100/90",
      text: "text-amber-900",
      accent: "#fbbf24", // Amber-400
      border: "#fde68a", // Amber-200
    },
    icon: "MessageSquare",
    badgeIcon: "MessageCircle",
    delay: 0.1,
    category: "product",
  },
  {
    id: "trust",
    title: "Enhanced Credibility",
    description:
      "Showcase your product on a professional, curated platform, building trust and signaling quality to users, stakeholders, and potential investors.",
    gridClass: "col-span-1 row-span-1 md:col-span-1 sm:col-span-1",
    color: {
      bg: "from-emerald-50/90 to-emerald-100/90",
      text: "text-emerald-900",
      accent: "#34d399", // Emerald-400
      border: "#a7f3d0", // Emerald-200
    },
    icon: "Shield",
    badgeIcon: "Award",
    delay: 0.2,
    category: "trust",
  },
  {
    id: "ai",
    title: "AI-Powered Discovery",
    description:
      "Find relevant, cutting-edge tools and software quickly through curated feeds, personalized recommendations, and smart filtering based on your interests.",
    gridClass: "col-span-2 row-span-1 md:col-span-2 sm:col-span-1",
    color: {
      bg: "from-blue-50/90 to-blue-100/90",
      text: "text-blue-900",
      accent: "#60a5fa", // Blue-400
      border: "#bfdbfe", // Blue-200
    },
    icon: "Brain",
    badgeIcon: "Sparkles",
    delay: 0.3,
    category: "technology",
  },
  {
    id: "network",
    title: "Strategic Connections",
    description:
      "Network with fellow founders, potential partners, skilled talent, and investors within a supportive, tech-focused community.",
    gridClass: "col-span-2 row-span-1 md:col-span-2 sm:col-span-1",
    color: {
      bg: "from-violet-50/90 to-violet-100/90",
      text: "text-violet-900",
      accent: "#a78bfa", // Violet-400
      border: "#ddd6fe", // Violet-200
    },
    icon: "Network",
    badgeIcon: "Users",
    delay: 0.4,
    category: "community",
  },
  {
    id: "traction",
    title: "Early Traction & Validation",
    description:
      "Gain tangible proof of interest, user engagement metrics, and valuable analytics to validate your ideas and attract further opportunities.",
    gridClass: "col-span-1 row-span-1 md:col-span-1 sm:col-span-1",
    color: {
      bg: "from-rose-50/90 to-rose-100/90",
      text: "text-rose-900",
      accent: "#fb7185", // Rose-400
      border: "#fecdd3", // Rose-200
    },
    icon: "TrendingUp",
    badgeIcon: "LineChart",
    delay: 0.5,
    category: "growth",
  },
];

const CategoryBadge = memo(
  ({ category, accentColor, badgeIcon, isHovered, borderColor }) => {
    const BadgeIcon = LucideIconsMap[badgeIcon];
    const prefersReducedMotion = useReducedMotion();

    const shadowValues = useMemo(() => {
      if (
        !accentColor ||
        typeof accentColor !== "string" ||
        !accentColor.startsWith("#")
      ) {
        return { shadowStart: "none", shadowMid: "none", shadowEnd: "none" };
      }
      const r = parseInt(accentColor.slice(1, 3), 16);
      const g = parseInt(accentColor.slice(3, 5), 16);
      const b = parseInt(accentColor.slice(5, 7), 16);
      const intensity = 0.3;

      return {
        shadowStart: `0 0 0px rgba(${r}, ${g}, ${b}, 0.05)`,
        shadowMid: `0 0 10px rgba(${r}, ${g}, ${b}, ${intensity})`,
        shadowEnd: `0 0 0px rgba(${r}, ${g}, ${b}, 0.05)`,
      };
    }, [accentColor]);

    const currentBoxShadow =
      isHovered && !prefersReducedMotion
        ? [
            shadowValues.shadowStart,
            shadowValues.shadowMid,
            shadowValues.shadowEnd,
          ]
        : shadowValues.shadowStart;

    return (
      <motion.div
        className="py-1.5 px-3 rounded-full flex items-center gap-2 text-xs font-medium uppercase tracking-wider shadow-sm transition-all duration-300"
        style={{
          backgroundColor: accentColor ? `${accentColor}1C` : "rgba(240,240,245,0.85)",
          color: accentColor || "inherit",
          border: `1px solid ${borderColor || (accentColor ? `${accentColor}4A` : "rgba(200,200,205,0.5)")}`,
        }}
        initial={{ y: 0, scale: 1, boxShadow: shadowValues.shadowStart }}
        animate={
          isHovered && !prefersReducedMotion
            ? { boxShadow: currentBoxShadow }
            : { boxShadow: shadowValues.shadowStart }
        }
        whileHover={prefersReducedMotion ? {} : { y: -2, scale: 1.05 }}
        transition={{
          y: { type: "spring", stiffness: 300, damping: 15 },
          scale: { type: "spring", stiffness: 300, damping: 15 },
          boxShadow: {
            duration: 1.8,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          },
        }}
        aria-label={`${category} category`}
      >
        <motion.span
          animate={
            isHovered && !prefersReducedMotion
              ? { rotate: [-6, 0, 6, 0, -6] }
              : { rotate: 0 }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1,
          }}
          aria-hidden="true"
        >
          {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
        </motion.span>
        <span>{category}</span>
      </motion.div>
    );
  }
);
CategoryBadge.displayName = "CategoryBadge";

const sharedAnimations = {
  card: {
    hidden: { opacity: 0, y: 25, scale: 0.98 },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        delay: delay * 0.12,
        ease: [0.25, 1, 0.5, 1],
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    }),
    hover: {
      scale: 1.025,
      transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
    },
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.98,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  },
  icon: {
    hidden: { scale: 0.7, opacity: 0, rotate: -10 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 150, damping: 15 },
    },
  },
  text: {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  },
};

const BentoCard = memo(({ item, scrollYProgress }) => {
  const cardRef = useRef(null);
  const inView = useInView(cardRef, { amount: 0.2, once: false });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 20, mass: 1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, springConfig);
  const springRotateY = useSpring(rotateY, springConfig);

  const cardOffset = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    prefersReducedMotion
      ? [0, 0, 0]
      : [
          item?.id && item.id.charCodeAt(0) % 2 === 0 ? -12 : 12,
          0,
          item?.id && item.id.charCodeAt(0) % 2 === 0 ? 12 : -12,
        ]
  );

  const Icon = item?.icon ? LucideIconsMap[item.icon] : null;
  const accentColor = item?.color?.accent;
  const titleBaseColorClass = item?.color?.text || "text-slate-900";

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered || prefersReducedMotion) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const magneticStrength = isMobile ? 3 : 5;
    x.set(((mouseX - rect.width / 2) / (rect.width / 2)) * magneticStrength);
    y.set(((mouseY - rect.height / 2) / (rect.height / 2)) * magneticStrength);
    const rotationDamping = Math.min(
      1,
      Math.max(0.4, 250 / Math.max(rect.width, rect.height))
    );
    rotateX.set(
      ((mouseY - rect.height / 2) / (rect.height / 2)) * 3.5 * rotationDamping
    );
    rotateY.set(
      ((rect.width / 2 - mouseX) / (rect.width / 2)) * 3.5 * rotationDamping
    );
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  const transform = useTransform([springRotateX, springRotateY], ([rX, rY]) =>
    prefersReducedMotion
      ? "none"
      : `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg)`
  );

  const glowEffectParams = useMemo(() => {
    if (
      !accentColor ||
      typeof accentColor !== "string" ||
      !accentColor.startsWith("#")
    ) {
      return ["none", "none", "none"];
    }
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    const glowIntensity = 0.35;
    return [
      `0 0 0px rgba(${r}, ${g}, ${b}, 0)`,
      `0 0 25px rgba(${r}, ${g}, ${b}, ${glowIntensity})`,
      `0 0 0px rgba(${r}, ${g}, ${b}, 0)`,
    ];
  }, [accentColor]);

  const cardBackground = useMemo(() => {
    const baseColor = item?.color?.bg || "from-slate-50/90 to-slate-100/90";
    return `bg-gradient-to-br ${baseColor}`;
  }, [item?.color?.bg]);

  const currentGlowEffect =
    isHovered && !prefersReducedMotion ? glowEffectParams : "none";

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl ${item?.gridClass || ""} transition-all duration-300 ease-out group border-slate-300/90 shadow-lg shadow-slate-400/25 hover:shadow-xl hover:shadow-slate-500/35`}
      variants={sharedAnimations.card}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={item?.delay}
      exit="exit"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover="hover"
      style={{ x: springX, y: springY, transform, translateY: cardOffset }}
      tabIndex={0}
      role="article"
      aria-labelledby={`card-${item?.id}-title`}
      aria-describedby={`card-${item?.id}-desc`}
    >
      <div
        className={`absolute inset-0 ${cardBackground} transition-opacity duration-300`}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 transition-opacity duration-300 opacity-[0.08]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.3' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
          maskImage:
            "radial-gradient(ellipse at center, black 50%, transparent 85%)",
        }}
        aria-hidden="true"
      />

      <motion.div
        className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
        initial={{ opacity: 0, boxShadow: "none" }}
        animate={
          isHovered && !prefersReducedMotion
            ? {
                opacity: 1,
                boxShadow: currentGlowEffect,
                borderColor: accentColor || "transparent",
              }
            : { opacity: 0, boxShadow: "none", borderColor: "transparent" }
        }
        transition={{
          boxShadow: {
            duration: 2.2,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          },
          opacity: { duration: 0.3 },
          borderColor: { duration: 0.3 },
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 p-6 sm:p-7 md:p-8 flex flex-col h-full justify-between">
        <div>
          <div className="absolute top-5 sm:top-6 right-5 sm:right-6 z-20">
            <CategoryBadge
              category={item?.category || "general"}
              accentColor={item?.color?.accent}
              borderColor={item?.color?.border}
              badgeIcon={item?.badgeIcon}
              isHovered={isHovered}
            />
          </div>

          <motion.div
            variants={sharedAnimations.icon}
            animate={
              isHovered && !prefersReducedMotion
                ? { scale: 1.1, y: [0, -3.5, 0] }
                : { scale: 1, y: 0 }
            }
            transition={{
              y: {
                duration: 2.2,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              },
              scale: { duration: 0.3 },
            }}
            className="text-2xl mb-6 sm:mb-7 w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300"
            style={{
              backgroundColor: `${item?.color?.accent}22`,
              color: accentColor,
              border: `1px solid ${item?.color?.accent}44`,
              boxShadow: `0 3px 7px ${item?.color?.accent || "#000000"}1A`,
            }}
            aria-hidden="true"
          >
            {Icon && (
              <>
                <Icon size={22} className="sm:hidden" />
                <Icon size={26} className="hidden sm:block" />
              </>
            )}
          </motion.div>

          <motion.h3
            id={`card-${item?.id}-title`}
            variants={sharedAnimations.text}
            className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 tracking-tight ${!isHovered ? titleBaseColorClass : ""}`}
            style={isHovered ? { color: accentColor } : {}}
          >
            {item?.title || "Card Title"}
          </motion.h3>

          <motion.p
            id={`card-${item?.id}-desc`}
            variants={sharedAnimations.text}
            className="text-sm sm:text-[0.92rem] leading-relaxed text-slate-600"
          >
            {item?.description || "Card description goes here."}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
});
BentoCard.displayName = "BentoCard";

const SectionHeader = memo(
  ({ title, subtitle, scrollYProgress, isInView, id }) => {
    const prefersReducedMotion = useReducedMotion();

    const titleY = useTransform(
      scrollYProgress,
      [0, 0.5, 1],
      prefersReducedMotion ? [0, 0, 0] : [20, 0, -20]
    );
    const subtitleY = useTransform(
      scrollYProgress,
      [0, 0.5, 1],
      prefersReducedMotion ? [0, 0, 0] : [12, 0, -12]
    );

    const titleVariants = {
      hidden: { opacity: 0, y: 25 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] },
      },
    };

    return (
      <div className="text-center mb-12 sm:mb-16" id={id}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <SectionLabel
            text="Why Choose Us"
            size="medium"
            alignment="center"
            animate={true}
            variant="neon"
            glowEffect={true}
            gradientText={true}
            animationStyle="typewriter"
          />
        </motion.div>

        <motion.div
          className="inline-block relative"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={titleVariants}
          style={{ y: prefersReducedMotion ? 0 : titleY }}
        >
          <h2 className="text-4xl font-extrabold mb-4 sm:mb-5 text-slate-900 tracking-tighter">
            {title}
          </h2>
          <motion.div
            className="absolute -bottom-1.5 left-1/4 right-1/4 h-1.5 rounded-full"
            style={{
              background: "linear-gradient(90deg, #a78bfa, #8b5cf6, #7c3aed)",
            }}
            initial={{ scaleX: 0, originX: 0.5 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{
              delay: 0.25,
              duration: 0.7,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            aria-hidden="true"
          />
          <motion.div
            className="absolute -bottom-1.5 left-1/4 right-1/4 h-1.5 rounded-full"
            initial={{ opacity: 0, scaleX: 0.5, originX: 0.5 }}
            animate={
              isInView ? { opacity: 0.5, scaleX: 1 } : { opacity: 0, scaleX: 0.5 }
            }
            transition={{
              delay: 0.35,
              duration: 0.8,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              background: "linear-gradient(90deg, #a78bfa, #8b5cf6, #7c3aed)",
              filter: "blur(10px)",
            }}
            aria-hidden="true"
          />
        </motion.div>

        <motion.p
          className="text-md sm:text-lg text-slate-600 mt-6 sm:mt-8 max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-0 leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
          style={{ y: prefersReducedMotion ? 0 : subtitleY }}
        >
          {subtitle}
        </motion.p>
      </div>
    );
  }
);
SectionHeader.displayName = "SectionHeader";

const Background = memo(({ scrollYProgress, prefersReducedMotion }) => {
  const gridY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? [0, 0] : [0, -40]
  );

  const createBlobTransform = (yOffset, xOffset, scaleRange) => ({
    y: useTransform(
      scrollYProgress,
      [0, 1],
      prefersReducedMotion ? [0, 0] : [0, yOffset]
    ),
    x: useTransform(
      scrollYProgress,
      [0, 1],
      prefersReducedMotion ? [0, 0] : [0, xOffset]
    ),
    scale: useTransform(
      scrollYProgress,
      [0, 0.5, 1],
      prefersReducedMotion ? [1, 1, 1] : scaleRange
    ),
  });

  const blob1 = createBlobTransform(-45, 30, [0.85, 1.15, 0.85]);
  const blob2 = createBlobTransform(45, -30, [0.9, 1.1, 0.9]);
  const blob3 = createBlobTransform(25, -15, [0.95, 1.05, 0.95]);

  const lightGridLineColor = "rgba(148, 163, 184, 0.4)"; // Slate-400 @ 40%
  const lightGridLineColorLarge = "rgba(148, 163, 184, 0.5)"; // Slate-400 @ 50%

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <motion.div
        className="absolute inset-0"
        style={{ y: gridY }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(241, 245, 249, 0.1) 0%, rgba(241, 245, 249, 1) 80%)`, // slate-100 base
          }}
        />

        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `linear-gradient(to right, ${lightGridLineColor} 1px, transparent 1px),
                             linear-gradient(to bottom, ${lightGridLineColor} 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `linear-gradient(to right, ${lightGridLineColorLarge} 1px, transparent 1px),
                             linear-gradient(to bottom, ${lightGridLineColorLarge} 1px, transparent 1px)`,
            backgroundSize: "160px 160px",
            maskImage:
              "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
      </motion.div>

      {[blob1, blob2, blob3].map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full
            ${index === 0 ? "top-5 right-[2%] w-80 h-80 sm:w-96 sm:h-96" : ""}
            ${
              index === 1
                ? "-bottom-28 left-[-2%] w-72 h-72 sm:w-80 sm:h-80"
                : ""
            }
            ${
              index === 2
                ? "top-[30%] left-[10%] w-56 h-56 sm:w-64 sm:h-64 hidden md:block"
                : ""
            }`}
          style={{
            background:
              index % 2 === 0
                ? "linear-gradient(135deg, rgba(196,181,253,0.18) 0%, rgba(139,92,246,0.18) 100%)"
                : "linear-gradient(135deg, rgba(147,197,253,0.15) 0%, rgba(59,130,246,0.15) 100%)",
            opacity: index === 2 ? 0.25 : 0.3,
            y: blob.y,
            x: blob.x,
            scale: blob.scale,
            filter: "blur(90px)",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});
Background.displayName = "Background";

function Why() {
  const sectionRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const smoothScrollYProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  const isInView = useInView(sectionRef, { amount: 0.15, once: false });
  const headingId = "why-product-bazar-heading";

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headingId}
      className="relative overflow-hidden py-12 sm:py-16 bg-white"
    >
      <Background
        scrollYProgress={smoothScrollYProgress}
        prefersReducedMotion={prefersReducedMotion}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeader
          id={headingId}
          title="Why Product Bazar?"
          subtitle="Unlock your product's full potential with our innovative platform designed for the needs of modern creators and developers."
          scrollYProgress={smoothScrollYProgress}
          isInView={isInView}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 md:gap-7 mb-14 sm:mb-16">
          <AnimatePresence>
            {advantageData.map((item) => (
              <BentoCard
                key={item.id}
                item={item}
                scrollYProgress={smoothScrollYProgress}
              />
            ))}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
          transition={{
            duration: 0.6,
            delay: 0.5 + advantageData.length * 0.05,
          }}
          className="text-center"
        >
          <motion.div
            className="inline-block"
            whileHover={{
              scale: 1.03,
              transition: { type: "spring", stiffness: 250, damping: 12 },
            }}
            whileTap={{ scale: 0.97 }}
          >
            <GlobalButton
              variant="primary"
              size="lg"
              magneticEffect={true}
              ariaLabel="Submit your product to Product Bazar"
              icon="ArrowRight"
              iconPosition="right"
            >
              Submit Your Product
            </GlobalButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Why;