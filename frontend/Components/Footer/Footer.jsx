"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  IconBrandLinkedin,
  IconBrandTwitter,
  IconBrandFacebook,
  IconBrandInstagram,
  IconMail,
  IconArrowRight,
  IconCode,
  IconDeviceDesktop,
  IconBrandGithub,
  IconRocket,
  IconBulb,
  IconExternalLink,
} from "@tabler/icons-react";

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// Social media brand colors
const socialColors = {
  linkedin: "#0077B5",
  twitter: "#1DA1F2",
  facebook: "#1877F2",
  instagram: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
};

const Footer = () => {
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: false, amount: 0.1 });
  const controls = useAnimation();

  // Add shine animation effect
  React.useEffect(() => {
    if (!document.querySelector("#shine-keyframes")) {
      const style = document.createElement("style");
      style.id = "shine-keyframes";
      style.innerHTML = `
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    if (isInView) {
      controls.start("show");
    }
  }, [isInView, controls]);

  return (
    <footer
      ref={footerRef}
      className="bg-gray-900 text-white py-16 px-4 md:px-8 lg:px-16 w-full relative z-10 overflow-hidden font-['clash',sans-serif]"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900">
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={controls}
        className="relative z-10"
      >
        {/* Main Headline */}
        <motion.div variants={fadeInUp} className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-4 px-4 py-1 rounded-full bg-violet-900/30 border border-violet-700/50"
          >
            <span className="text-violet-300 font-medium">Join Our Network</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl font-bold mb-2"
          >
            Elevate your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
              professional
            </span>{" "}
            connections
          </motion.h2>
        </motion.div>

        <div className="max-w-[1400px] mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* About Us Section */}
          <motion.div variants={fadeInUp}>
            <div className="border-b border-violet-500/20 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-center sm:text-left bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                About Us
              </h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="text-sm leading-relaxed text-center sm:text-left text-white/80"
              >
                Product Bazaar connects innovators, freelancers, startups, and clients on a professional platform designed to streamline collaboration and foster business growth.
              </motion.p>
            </div>
          </motion.div>

          {/* Quick Links Section */}
          <motion.div variants={fadeInUp}>
            <div className="border-b border-violet-500/20 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-center sm:text-left bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                Quick Links
              </h3>
              <ul className="flex flex-col items-center sm:items-start" role="navigation" aria-label="Quick links">
                {[
                  { href: "/jobs", label: "Career Opportunities" },
                  { href: "/freelance-projects", label: "Freelance Projects" },
                  { href: "/startups", label: "Startup Initiatives" },
                  { href: "/community", label: "Professional Community" },
                  { href: "/resources", label: "Resources" },
                ].map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="mb-2 hover:translate-x-1 transition-transform duration-300"
                  >
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-white text-sm relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-2px] after:left-0 after:bg-gradient-to-r after:from-violet-400 after:to-fuchsia-500 after:transition-[width] after:duration-300 hover:after:w-full"
                      aria-label={link.label}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Legal Section */}
          <motion.div variants={fadeInUp}>
            <div className="border-b border-violet-500/20 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-center sm:text-left bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                Legal Information
              </h3>
              <ul className="flex flex-col items-center sm:items-start" role="navigation" aria-label="Legal information">
                {[
                  { href: "/terms", label: "Terms of Service" },
                  { href: "/privacy", label: "Privacy Policy" },
                  { href: "/cookies", label: "Cookie Policy" },
                  { href: "/licensing", label: "Licensing" },
                  { href: "/compliance", label: "Compliance" },
                ].map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="mb-2 hover:translate-x-1 transition-transform duration-300"
                  >
                    <Link
                      href={link.href}
                      className="text-white/70 hover:text-white text-sm relative after:content-[''] after:absolute after:w-0 after:h-[2px] after:bottom-[-2px] after:left-0 after:bg-gradient-to-r after:from-violet-400 after:to-fuchsia-500 after:transition-[width] after:duration-300 hover:after:w-full"
                      aria-label={link.label}
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Follow Us & Newsletter Section */}
          <motion.div variants={fadeInUp}>
            <div className="border-b border-violet-500/20 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-center sm:text-left bg-gradient-to-r from-violet-400 to-fuchsia-500 bg-clip-text text-transparent">
                Connect With Us
              </h3>
              <div className="flex gap-6 my-6 justify-center sm:justify-start">
                {[
                  { href: "#", label: "LinkedIn", icon: IconBrandLinkedin, color: socialColors.linkedin },
                  { href: "#", label: "Twitter", icon: IconBrandTwitter, color: socialColors.twitter },
                  { href: "#", label: "Facebook", icon: IconBrandFacebook, color: socialColors.facebook },
                  { href: "#", label: "Instagram", icon: IconBrandInstagram, color: socialColors.instagram },
                ].map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={`Follow us on ${social.label}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-white flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-violet-500/30 relative overflow-hidden transition-all duration-300"
                  >
                    <social.icon size={18} className="relative z-10" />
                    <motion.div
                      className="absolute inset-0 opacity-0"
                      initial={false}
                      animate={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{ background: social.color }}
                    />
                  </motion.a>
                ))}
              </div>

              {/* Newsletter Subscription Section */}
              <motion.div
                className="mt-8 w-full sm:max-w-[360px] mx-auto sm:mx-0"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  className="flex items-center gap-2 mb-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={isInView ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                    <IconMail size={16} className="text-violet-300" />
                  </div>
                  <span className="text-sm font-medium text-violet-300">Industry Insights</span>
                </motion.div>

                <motion.h4
                  className="text-xl font-bold mb-2 bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent"
                  initial={{ y: 10, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  Stay at the forefront of innovation
                </motion.h4>

                <motion.p
                  className="text-sm text-white/70 mb-5 leading-relaxed"
                  initial={{ y: 10, opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  Receive curated industry insights, exclusive opportunities, and strategic resources directly to your inbox.
                </motion.p>

                <form className="relative" role="form" aria-label="Newsletter subscription">
                  <motion.div
                    className="relative group"
                    initial={{ y: 10, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg opacity-0 group-hover:opacity-70 blur-md transition-all duration-300"></div>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="Your email address"
                        aria-label="Email for newsletter"
                        className="w-full py-3 px-4 pr-12 border border-violet-500/40 rounded-lg bg-white/5 text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500 transition-all duration-300 relative z-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 z-10">
                        <IconMail size={18} className="opacity-70" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.button
                    type="submit"
                    className="w-full mt-3 py-3 px-4 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium flex items-center justify-center transition-all duration-300 relative overflow-hidden group shadow-md hover:shadow-lg"
                    initial={{ y: 10, opacity: 0 }}
                    animate={isInView ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Subscribe to newsletter"
                  >
                    <div className="absolute top-0 -left-full w-4/5 h-full bg-white/20 skew-x-12 group-hover:animate-shine"></div>
                    <span className="mr-2">Subscribe</span>
                    <IconArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </motion.button>

                  <motion.p
                    className="text-xs text-white/50 mt-3 text-center sm:text-left"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                  >
                    We value your privacy. You may unsubscribe at any time.
                  </motion.p>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Copyright and Cyper Studio Section */}
        <motion.div variants={fadeInUp}>
          <div className="text-center mt-12 pt-8 border-t border-white/10">
            <motion.div
              className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <motion.p
                className="text-sm text-white/80 hover:text-white transition-colors duration-300"
                whileHover={{ color: "#ffffff" }}
              >
                © 2025 Product Bazaar. All rights reserved.
              </motion.p>
              <motion.div
                className="hidden md:block w-1.5 h-1.5 rounded-full bg-violet-500/70"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.p
                className="text-sm text-white/80 hover:text-white transition-colors duration-300"
                whileHover={{ color: "#ffffff" }}
              >
                All trademarks and brand names are the property of their respective owners.
              </motion.p>
            </motion.div>

            {/* Cyper Studio Professional Services Section */}
            <motion.div
              className="mt-8 mb-6 pt-6 border-t border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30 border border-violet-500/20 p-6 md:p-8 max-w-4xl mx-auto">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-violet-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-fuchsia-600/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  <motion.div
                    className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <IconCode size={32} className="text-violet-300" />
                  </motion.div>

                  <div className="flex-1 text-center md:text-left">
                    <motion.div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40 mb-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <IconRocket size={14} className="text-violet-300" />
                      <span className="text-xs font-medium text-violet-300">Enterprise Solutions</span>
                    </motion.div>

                    <motion.h3
                      className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent"
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.5, delay: 0.7 }}
                    >
                      Transform Business Concepts into Digital Solutions with Cyper Studio
                    </motion.h3>

                    <motion.p
                      className="text-sm text-white/80 mb-4 max-w-2xl leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      Specializing in enterprise-grade web and mobile applications built with cutting-edge technologies.
                      Our experienced development team delivers scalable software solutions designed to enhance operational efficiency and drive business growth.
                    </motion.p>

                    <motion.div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                      {[
                        { icon: IconDeviceDesktop, text: "Enterprise Web Applications" },
                        { icon: IconBulb, text: "Strategic UI/UX Architecture" },
                        { icon: IconBrandGithub, text: "Enterprise Development Stack" },
                        { icon: IconRocket, text: "Performance Optimization" },
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <feature.icon size={16} className="text-violet-400" />
                          <span className="text-sm text-white/70">{feature.text}</span>
                        </div>
                      ))}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      <a
                        href="https://cyperstudio.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium transition-all duration-300 group relative overflow-hidden shadow-md hover:shadow-lg"
                        aria-label="Explore Cyper Studio"
                      >
                        <div className="absolute top-0 -left-full w-4/5 h-full bg-white/20 skew-x-12 group-hover:animate-shine"></div>
                        <span>Explore Cyper Studio</span>
                        <IconExternalLink size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </a>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <motion.p
                className="text-center text-xs text-white/60 hover:text-white/80 transition-colors duration-300"
                whileHover={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                Designed and developed by{" "}
                <a
                  href="https://cyperstudio.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors duration-300 relative after:content-[''] after:absolute after:w-0 after:h-[1px] after:bottom-[-1px] after:left-0 after:bg-gradient-to-r after:from-violet-400 after:to-fuchsia-500 after:transition-[width] after:duration-300 hover:after:w-full"
                  aria-label="Visit Cyper Studio"
                >
                  Cyper Studio
                </a>
                . Contact us for enterprise application and website development solutions.
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;