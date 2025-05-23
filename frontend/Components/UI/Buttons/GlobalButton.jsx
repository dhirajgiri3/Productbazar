import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import * as LucideIcons from "lucide-react";
import clsx from "clsx";

/**
 * GlobalButton - A minimalistic yet elegant button component with subtle animations.
 * Features continuous shimmer effect, gentle magnetic hover, and clean transitions.
 */
const GlobalButton = ({
  children,
  icon,
  iconPosition = "right",
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  magneticEffect = true,
  shimmerEffect = true,
  onClick,
  className = "",
  ariaLabel,
  href,
  style = {},
  ...props
}) => {
  const buttonRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMagneticActive, setIsMagneticActive] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const handleChange = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Effects Configuration
  const enableMagneticEffect = magneticEffect && !prefersReducedMotion && !disabled;
  const enableShimmerEffect = shimmerEffect && !prefersReducedMotion && !disabled;
  const enableHoverScale = !prefersReducedMotion && !disabled;
  const enableTapScale = !prefersReducedMotion && !disabled;
  const enableIconAnimation = !prefersReducedMotion && !disabled && isHovered;

  // Magnetic Effect Configuration - more subtle by default
  const magneticX = useMotionValue(0);
  const magneticY = useMotionValue(0);
  // Softer spring for smoother movement
  const springConfig = { stiffness: 90, damping: 20, mass: 1 };
  const springX = useSpring(magneticX, springConfig);
  const springY = useSpring(magneticY, springConfig);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (enableMagneticEffect) setIsMagneticActive(true);
  };

  const handleMouseMove = (e) => {
    if (!buttonRef.current || !isMagneticActive) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const centerDistX = mouseX - rect.width / 2;
    const centerDistY = mouseY - rect.height / 2;
    // Reduced strength for more subtle effect
    const magneticStrength = size === "sm" ? 0.14 : size === "md" ? 0.18 : 0.22;
    magneticX.set(centerDistX * magneticStrength);
    magneticY.set(centerDistY * magneticStrength);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsMagneticActive(false);
    magneticX.set(0);
    magneticY.set(0);
  };

  const handleClick = (event) => {
    onClick?.(event);
  };

  // Icon Component
  const IconComponent = icon ? LucideIcons[icon] : null;

  // Dynamic Styling
  const sizeClasses = {
    sm: "py-1.5 px-3.5 text-sm rounded-full",
    md: "py-2 px-5 text-base rounded-full",
    lg: "py-2.5 px-7 text-lg rounded-full",
  };

  // More subtle design variants
  const variants = {
    primary: {
      base: "bg-violet-600 text-white border-transparent",
      hover: "hover:bg-violet-700",
      focusRing: "focus-visible:ring-indigo-500",
      shimmer: "from-transparent via-white/10 to-transparent",
    },
    secondary: {
      base: "bg-gray-100 text-gray-900 border-transparent",
      hover: "hover:bg-gray-200",
      focusRing: "focus-visible:ring-gray-400",
      shimmer: "from-transparent via-gray-300/10 to-transparent",
    },
    outline: {
      base: "bg-transparent text-indigo-600 border border-indigo-500",
      hover: "hover:bg-indigo-50",
      focusRing: "focus-visible:ring-indigo-500",
      shimmer: "from-transparent via-indigo-300/15 to-transparent",
    },
    ghost: {
      base: "bg-transparent text-gray-700 border-transparent",
      hover: "hover:bg-gray-100",
      focusRing: "focus-visible:ring-gray-400",
      shimmer: "from-transparent via-gray-300/10 to-transparent",
    },
    danger: {
      base: "bg-red-600 text-white border-transparent",
      hover: "hover:bg-red-700",
      focusRing: "focus-visible:ring-red-500",
      shimmer: "from-transparent via-white/10 to-transparent",
    },
    success: {
      base: "bg-emerald-600 text-white border-transparent",
      hover: "hover:bg-emerald-700",
      focusRing: "focus-visible:ring-emerald-500",
      shimmer: "from-transparent via-white/10 to-transparent",
    },
  };

  const variantStyle = variants[variant] || variants.primary;
  const Element = href ? motion.a : motion.button;

  const elementProps = {
    ref: buttonRef,
    className: clsx(
      "relative inline-flex items-center justify-center font-medium",
      "overflow-hidden",
      "select-none align-middle",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "transition-colors duration-150 ease-in-out",
      sizeClasses[size],
      variantStyle.base,
      variantStyle.focusRing,
      { [variantStyle.hover]: !disabled },
      { "opacity-60 cursor-not-allowed": disabled },
      { "w-full": fullWidth },
      className
    ),
    style: {
      ...style,
      ...(enableMagneticEffect && isMagneticActive
        ? { x: springX, y: springY }
        : {}),
      borderWidth: variant === "outline" ? "1px" : "0px",
      borderStyle: "solid",
    },
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: enableMagneticEffect ? handleMouseMove : undefined,
    onFocus: () => setIsHovered(true),
    onBlur: () => setIsHovered(false),
    onClick: handleClick,
    disabled: disabled,
    "aria-label":
      ariaLabel || (typeof children === "string" ? children : undefined),
    whileHover: enableHoverScale ? { scale: 1.02 } : {}, // More subtle scale
    whileTap: enableTapScale ? { scale: 0.98 } : {}, // More subtle scale
    transition: { type: "spring", stiffness: 300, damping: 25 },
    ...(href ? { href } : {}),
    ...props,
  };

  return (
    <Element {...elementProps}>
      {/* Always-active shimmer effect with variant-specific styling */}
      {enableShimmerEffect && (
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ borderRadius: "inherit" }}
          aria-hidden="true"
        >
          <motion.div
            className={`absolute -inset-2 bg-gradient-to-r ${variantStyle.shimmer}`}
            style={{ transform: "skewX(-15deg)" }}
            initial={{ x: "-150%" }}
            animate={{ x: "150%" }}
            transition={{
              duration: 3.5, // Slower, more elegant sweep
              ease: "linear",
              repeat: Infinity,
              repeatDelay: 5, // Longer pause between animations
            }}
          />
        </motion.div>
      )}

      {/* Content Layer */}
      <span
        className={clsx(
          "relative z-10 flex items-center justify-center gap-2",
          iconPosition === "left" ? "flex-row" : "flex-row-reverse"
        )}
      >
        {children}
        {IconComponent && (
          <motion.span
            className="inline-flex items-center justify-center"
            aria-hidden="true"
            animate={
              enableIconAnimation
                ? {
                    x: iconPosition === "right" ? [0, 2, 0] : [0, -2, 0],
                  }
                : { x: 0 }
            }
            transition={
              enableIconAnimation
                ? {
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.5,
                  }
                : { duration: 0.2, ease: "easeOut" }
            }
          >
            <IconComponent
              className={clsx(
                "flex-shrink-0",
                size === "sm"
                  ? "h-3.5 w-3.5"
                  : size === "md"
                  ? "h-4 w-4"
                  : "h-5 w-5"
              )}
            />
          </motion.span>
        )}
      </span>
    </Element>
  );
};

export default GlobalButton;