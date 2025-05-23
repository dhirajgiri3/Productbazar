import React, { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

// Narrative Stat component with color schemes
const NarrativeStat = ({
  icon: Icon,
  value,
  label,
  delay = 0,
  className = "",
  color = "violet", // Default color
}) => {
  const statRef = useRef(null);
  const isInView = useInView(statRef, { once: true, margin: "-50px" });
  const [animatedValue, setAnimatedValue] = useState(0);

  // Color schemes for different stat types
  const colorSchemes = {
    sky: "bg-sky-50 text-sky-700 border-sky-100 shadow-sky-500/10",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-500/10",
    rose: "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-500/10",
    amber: "bg-amber-50 text-amber-700 border-amber-100 shadow-amber-500/10",
    slate: "bg-slate-100 text-slate-700 border-slate-200 shadow-slate-500/10",
    violet: "bg-violet-100/90 text-violet-700 border-violet-200 shadow-violet-500/15",
    lavender: "bg-purple-50 text-purple-700 border-purple-100 shadow-purple-500/10",
    teal: "bg-teal-50 text-teal-700 border-teal-100 shadow-teal-500/10",
    coral: "bg-red-50 text-red-700 border-red-100 shadow-red-500/10",
    mint: "bg-green-50 text-green-700 border-green-100 shadow-green-500/10",
    peach: "bg-orange-50 text-orange-700 border-orange-100 shadow-orange-500/10",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-500/10",
  };

  useEffect(() => {
    // Animation logic for counting up the stat value
    if (isInView && typeof value === "number") {
      let startValue = 0;
      let animationFrameId;
      const startTime = Date.now();
      const duration = 1800;
      const delayMs = (delay + 0.2) * 1000;

      const timeoutId = setTimeout(() => {
        const animate = () => {
          const elapsed = Date.now() - startTime - delayMs;
          if (elapsed < 0) {
            animationFrameId = requestAnimationFrame(animate);
            return;
          }
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = 1 - Math.sin(Math.acos(progress));
          const currentValue = Math.round(
            startValue + (value - startValue) * easedProgress
          );
          setAnimatedValue(currentValue);
          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          }
        };
        animate();
      }, delayMs);

      return () => {
        clearTimeout(timeoutId);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else if (isInView) {
      setAnimatedValue(value);
    } else {
      setAnimatedValue(0);
    }
  }, [isInView, value, delay]);

  return (
    <motion.div
      ref={statRef}
      className={`flex flex-col items-center justify-center text-center gap-2.5 p-5 bg-white rounded-xl border ${colorSchemes[color]} transition-all duration-300 hover:-translate-y-1 ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: delay, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <div
        className={`p-2.5 rounded-full ${
          colorSchemes[color].split(" ")[0]
        } transition-transform duration-300`}
      >
        <Icon size={22} className={`${colorSchemes[color].split(" ")[1]}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-800">
          {typeof value === "number" ? animatedValue : value}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
          {label}
        </div>
      </div>
    </motion.div>
  );
};

export default NarrativeStat;