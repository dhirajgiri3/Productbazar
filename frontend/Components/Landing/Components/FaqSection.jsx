"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import SectionLabel from "./Animations/SectionLabel";

export default function FaqSection({ onHover, onLeave }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: "What is Product Bazar?",
      answer:
        "Product Bazar is a platform where makers can showcase their innovative products to a community of early adopters, enthusiasts, and potential customers. It's designed to help makers get valuable feedback, build an audience, and gain traction, while allowing enthusiasts to discover the latest innovations before they go mainstream.",
    },
    {
      question: "How do I submit my product?",
      answer:
        "Submitting your product is easy! Simply create an account, click on the 'Submit Your Product' button, and follow the guided process. You'll be able to add details about your product, upload images, set pricing information, and more. Once submitted, your product will be reviewed and published to our platform.",
    },
    {
      question: "Is Product Bazar free to use?",
      answer:
        "Yes, Product Bazar is free for basic use. We offer a freemium model where basic features are available at no cost, while premium features such as enhanced analytics, featured placements, and advanced promotion tools are available through our premium plans.",
    },
    {
      question: "How does the upvoting system work?",
      answer:
        "Our upvoting system allows users to show support for products they find valuable or interesting. Each registered user can upvote a product once. Products with more upvotes gain higher visibility on our platform, appearing in trending sections and potentially featured collections.",
    },
    {
      question: "Can I update my product after submission?",
      answer:
        "Absolutely! We understand that products evolve over time. You can update your product details, add new images, update pricing, and more at any time through your dashboard. This allows you to keep your product page current and reflect any improvements or changes.",
    },
    {
      question: "How can I get more visibility for my product?",
      answer:
        "There are several ways to increase visibility for your product: complete your product profile with high-quality images and detailed descriptions, engage with the community by responding to comments and feedback, share your Product Bazar listing on social media, and consider our premium promotion options for featured placements.",
    },
    {
      question: "What types of products can be submitted?",
      answer:
        "Product Bazar welcomes a wide range of products across various categories, including digital tools, physical products, services, and more. We focus on innovative solutions that solve real problems. Products must be legitimate, functional (or in active development), and comply with our community guidelines.",
    },
    {
      question: "How do I connect with makers?",
      answer:
        "You can connect with makers by engaging with their products through comments, upvotes, and bookmarks. Many makers include their social media profiles and websites on their product pages. For direct communication, you can visit their profile page which may include contact information or links to their personal websites.",
    },
  ];

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section
      ref={ref}
      className="relative py-12 sm:py-16 bg-white"
      id="faq"
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SectionLabel
              text="Common Questions"
              size="medium"
              alignment="center"
              animate={true}
              variant="sunset"
              glowEffect={true}
              animationStyle="3d"
            />
          </motion.div>

          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-800"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Frequently Asked{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-600">
              Questions
            </span>
          </motion.h2>

          <motion.p
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Find answers to common questions about Product Bazar. If you can't find what you're looking for, feel free to contact our support team.
          </motion.p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="mb-4"
              variants={itemVariants}
            >
              <motion.button
                className={`w-full text-left p-5 rounded-xl flex justify-between items-center backdrop-blur-sm border ${
                  activeIndex === index
                    ? "bg-gradient-to-r from-violet-100/70 to-fuchsia-100/70 border-violet-300/50"
                    : "bg-white/80 hover:bg-white/90 border-gray-200/70"
                }`}
                onClick={() => toggleAccordion(index)}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
              >
                <span className="font-semibold text-lg text-gray-800">{faq.question}</span>
                <motion.div
                  animate={{ rotate: activeIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    activeIndex === index
                      ? "bg-violet-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </motion.button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-gray-100/50 border-gray-200/50 backdrop-blur-sm border rounded-b-xl border-t-0">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-xl font-medium text-gray-800 mb-4">Still have questions?</p>
          <motion.button
            className="px-6 py-3 rounded-full bg-white/90 text-gray-800 border-gray-200 backdrop-blur-sm font-medium border hover:border-violet-500 transition-all inline-flex items-center"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 5px 15px -5px rgba(138, 43, 226, 0.15)",
            }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
          >
            Contact Support
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
