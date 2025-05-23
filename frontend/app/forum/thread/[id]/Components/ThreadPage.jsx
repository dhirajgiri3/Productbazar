"use client";

import { useEffect, useState, useRef } from "react";
import { Eye, Share2, Bookmark, ChevronLeft, Calendar, Tag, ArrowUp, Clock, User, List, MessageSquare, Heart, Copy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Image from "next/image";
import { useParams } from "next/navigation";

const threads = {
  1: {
    id: 1,
    title: "Best tools for startup founders in 2025?",
    author: {
      name: "Jessica Chen",
      avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
      role: "Product Manager",
    },
    category: "Tools",
    createdAt: "May 9, 2025",
    views: 1200,
    likes: 342,
    comments: 56,
    readTime: "8 min read",
    headerImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80",
    contentImages: [
      {
        url: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Team collaboration on startup project",
        caption:
          "Effective collaboration tools can dramatically improve team productivity.",
      },
      {
        url: "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Marketing analytics dashboard",
        caption:
          "Modern analytics tools provide deep insights into customer behavior and marketing performance.",
      },
      {
        url: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Developer tools and workflow",
        caption:
          "Efficient development tools streamline coding and deployment processes.",
      },
    ],
    content: `
      <p>The startup landscape is constantly evolving, and having the right tools can make all the difference. As we head into 2025, several platforms and software solutions have emerged as game-changers for founders. This thread aims to consolidate the best tools that can help you build, manage, and scale your startup efficiently.</p>

      <h2>Understanding the Startup Tool Stack</h2>
      <p>Before diving into specific tools, it\'s crucial to understand the different categories of tools a startup needs. These typically include project management, communication, marketing, sales, development, and analytics. A well-rounded tool stack ensures all aspects of your business are covered.</p>

      <h3>Project Management & Collaboration</h3>
      <p>Effective project management is the backbone of any successful startup. Tools in this category help teams organize tasks, track progress, and collaborate seamlessly.</p>
      <ul>
        <li><strong>Tool A (e.g., Asana/Trello/Notion):</strong>
          <ul>
            <li><em>Description:</em> A versatile project management tool that allows for task assignment, progress tracking, and team collaboration.</li>
            <li><em>Pros:</em> Highly customizable, intuitive interface, great for agile methodologies.</li>
            <li><em>Cons:</em> Can be overwhelming for very small teams, premium features can be costly.</li>
            <li><em>Pricing:</em> Freemium model, paid plans start at $X/user/month.</li>
            <li><em>Personal Recommendation:</em> Excellent for teams that need a central hub for all project-related activities. I\'ve found its visual board particularly helpful for sprint planning.</li>
          </ul>
        </li>
        <li><strong>Tool B (e.g., Slack/Microsoft Teams):</strong>
          <ul>
            <li><em>Description:</em> A communication platform that facilitates real-time messaging, file sharing, and integrations with other tools.</li>
            <li><em>Pros:</em> Streamlines communication, reduces email clutter, extensive integrations.</li>
            <li><em>Cons:</em> Can lead to notification fatigue if not managed well.</li>
            <li><em>Pricing:</em> Freemium, standard plans around $Y/user/month.</li>
            <li><em>Personal Recommendation:</em> Indispensable for remote or hybrid teams. Setting up dedicated channels for projects and topics is key to staying organized.</li>
          </ul>
        </li>
      </ul>

      <h3>Marketing & Sales Automation</h3>
      <p>Reaching your target audience and converting leads efficiently is paramount. Marketing and sales automation tools can significantly boost your efforts.</p>
      <ul>
        <li><strong>Tool C (e.g., HubSpot/Mailchimp):</strong>
          <ul>
            <li><em>Description:</em> An all-in-one marketing platform offering CRM, email marketing, social media management, and analytics.</li>
            <li><em>Pros:</em> Comprehensive feature set, good for scaling marketing efforts.</li>
            <li><em>Cons:</em> Can have a steep learning curve, higher-tier plans are expensive.</li>
            <li><em>Pricing:</em> Freemium CRM, marketing hub starts at $Z/month.</li>
            <li><em>Personal Recommendation:</em> If you\'re looking for an integrated solution to manage your entire customer lifecycle, this is a strong contender. Start with the free tools and scale as you grow.</li>
          </ul>
        </li>
         <li><strong>Tool D (e.g., Buffer/Hootsuite):</strong>
          <ul>
            <li><em>Description:</em> A social media management tool for scheduling posts, analyzing performance, and engaging with your audience.</li>
            <li><em>Pros:</em> Saves time on social media tasks, provides valuable insights.</li>
            <li><em>Cons:</em> Limited features on free/basic plans.</li>
            <li><em>Pricing:</em> Starts around $W/month.</li>
            <li><em>Personal Recommendation:</em> A must-have if social media is a key part of your marketing strategy. The content calendar feature is a lifesaver.</li>
          </ul>
        </li>
      </ul>

      <h3>Development & Operations</h3>
      <p>For tech startups, efficient development workflows and reliable infrastructure are non-negotiable.</p>
      <ul>
        <li><strong>Tool E (e.g., GitHub/GitLab):</strong>
          <ul>
            <li><em>Description:</em> A platform for version control and collaboration on code.</li>
            <li><em>Pros:</em> Essential for team-based software development, robust CI/CD features.</li>
            <li><em>Cons:</em> Can be complex for beginners to version control.</li>
            <li><em>Pricing:</em> Free for public and private repositories (with limitations), team plans vary.</li>
            <li><em>Personal Recommendation:</em> Git is the standard for a reason. Invest time in learning it well; it pays off immensely.</li>
          </ul>
        </li>
        <li><strong>Tool F (e.g., AWS/Google Cloud/Azure):</strong>
          <ul>
            <li><em>Description:</em> Cloud computing platforms offering a wide range of services like hosting, databases, and machine learning tools.</li>
            <li><em>Pros:</em> Scalable, reliable, pay-as-you-go pricing.</li>
            <li><em>Cons:</em> Can become expensive if not managed carefully, complexity in choosing services.</li>
            <li><em>Pricing:</em> Varies greatly based on usage; many offer free tiers or startup credits.</li>
            <li><em>Personal Recommendation:</em> Start small and leverage free tiers. Monitor your billing dashboards closely. AWS has a very comprehensive offering, but GCP is often praised for its data analytics and ML capabilities.</li>
          </ul>
        </li>
      </ul>

      <h3>Analytics & Business Intelligence</h3>
      <p>Data-driven decision-making is key. These tools help you track key metrics and gain insights into your business performance.</p>
      <ul>
        <li><strong>Tool G (e.g., Google Analytics/Mixpanel):</strong>
          <ul>
            <li><em>Description:</em> Web analytics service that tracks and reports website traffic and user behavior.</li>
            <li><em>Pros:</em> Free, powerful, industry standard for website analytics.</li>
            <li><em>Cons:</em> Can be overwhelming due to the sheer amount of data. Privacy considerations are increasingly important.</li>
            <li><em>Pricing:</em> Free. Mixpanel offers event-based tracking with a freemium model.</li>
            <li><em>Personal Recommendation:</em> Essential for understanding how users interact with your product. Set up goals and funnels early on.</li>
          </ul>
        </li>
      </ul>

      <h2>Final Thoughts & Personal Insights</h2>
      <p>Choosing the right tools is a continuous process. What works today might need to be re-evaluated as your startup grows and its needs change. My advice is to start with tools that offer free tiers or trials, focus on simplicity and integration, and always prioritize tools that directly contribute to your core business goals. Don\'t get caught up in "shiny object syndrome" – the best tool is the one that your team actually uses effectively.</p>
      <p>I\'ve personally found that a combination of Notion for project management and documentation, Slack for communication, HubSpot for CRM and early marketing efforts, and GitHub for development provides a solid foundation for early-stage startups. For cloud infrastructure, AWS has been my go-to, largely due to its extensive services and community support, though I always keep an eye on alternatives like Vercel for frontend deployments due to its simplicity.</p>
      <p>Remember to also factor in your team\'s existing skills and preferences. A slightly less "optimal" tool that your team loves and uses consistently is often better than the "perfect" tool that gathers digital dust.</p>
    `,
  },
  2: {
    id: 2,
    title: "How do you validate your product idea?",
    author: {
      name: "Alex Martinez",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      role: "Startup Founder",
    },
    category: "Strategy",
    createdAt: "May 6, 2025",
    views: 950,
    likes: 215,
    comments: 42,
    readTime: "6 min read",
    headerImage:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80",
    contentImages: [
      {
        url: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Product validation through customer interviews",
        caption:
          "Direct customer interviews provide invaluable qualitative insights that surveys alone cannot capture.",
      },
      {
        url: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Landing page MVP for idea validation",
        caption:
          "A well-designed landing page can help validate demand before building a full product.",
      },
    ],
    content: `
      <p>Validating a product idea is arguably one of the most critical steps before investing significant time and resources. It\'s the process of testing your core assumptions about the problem you\'re solving, your target audience, and your proposed solution. This thread is for sharing effective strategies and techniques for product idea validation.</p>

      <h2>Why Idea Validation Matters</h2>
      <p>Building something nobody wants is the nightmare of every founder. Validation helps mitigate this risk by gathering evidence to support (or refute) your idea early on. It\'s about learning quickly and cheaply.</p>

      <h3>Key Validation Questions:</h3>
      <ul>
        <li>Is the problem real and significant for a specific group of people?</li>
        <li>Is your proposed solution desirable to them?</li>
        <li>Are they willing to pay for your solution (if applicable)?</li>
        <li>Is the market large enough to build a sustainable business?</li>
      </ul>

      <h2>Common Validation Techniques</h2>
      <p>There are numerous ways to validate an idea, ranging from simple conversations to more structured experiments.</p>

      <h3>1. Customer Interviews & Surveys</h3>
      <ul>
        <li><em>Description:</em> Directly talking to potential customers to understand their pain points, needs, and current solutions. Surveys can reach a broader audience but offer less depth.</li>
        <li><em>Pros:</em> Rich qualitative insights, helps build empathy, relatively low cost.</li>
        <li><em>Cons:</em> Can be time-consuming, risk of biased questions or interpretations.</li>
        <li><em>Personal Recommendation:</em> Start here. Focus on open-ended questions about their problems, not your solution. "The Mom Test" by Rob Fitzpatrick is an excellent guide for this.</li>
      </ul>

      <h3>2. Landing Page MVP (Minimum Viable Product)</h3>
      <ul>
        <li><em>Description:</em> Create a simple webpage describing your product/service and its benefits, with a call to action (e.g., sign up for a waitlist, pre-order).</li>
        <li><em>Pros:</em> Tests interest and willingness to commit (even if it\'s just an email), can collect early leads.</li>
        <li><em>Cons:</em> Requires some design/development effort, conversion rates can be misleading if traffic isn\'t targeted.</li>
        <li><em>Pricing/Tools:</em> Carrd.co, Unbounce, Leadpages, or even a simple Mailchimp landing page.</li>
        <li><em>Personal Recommendation:</em> A great way to gauge demand. Clearly articulate the value proposition. Track sign-up rates and even consider A/B testing headlines or CTAs.</li>
      </ul>

      <h3>3. Concierge MVP / Wizard of Oz MVP</h3>
      <ul>
        <li><em>Description:</em> Manually deliver the core value of your product to early users. For a "Wizard of Oz" MVP, the front-end looks automated, but the back-end processes are done manually by you.</li>
        <li><em>Pros:</em> Low development cost, high learning potential, direct interaction with early users.</li>
        <li><em>Cons:</em> Not scalable, can be labor-intensive.</li>
        <li><em>Personal Recommendation:</em> Perfect for service-based ideas or complex products where building a fully automated solution is expensive. You learn immensely by "being the product."</li>
      </ul>

      <h3>4. Pre-sales / Crowdfunding</h3>
      <ul>
        <li><em>Description:</em> Ask customers to pay for the product before it\'s fully built. Crowdfunding platforms like Kickstarter or Indiegogo can also serve this purpose.</li>
        <li><em>Pros:</em> Strongest form of validation (people voting with their wallets), provides initial capital.</li>
        <li><em>Cons:</em> Requires a compelling pitch and marketing, risk of not meeting funding goals or delivery expectations.</li>
        <li><em>Personal Recommendation:</em> If your product lends itself to this model, it\'s a powerful validator. Be transparent about development timelines and risks.</li>
      </ul>

      <h3>5. Fake Door Test</h3>
      <ul>
        <li><em>Description:</em> Add a button or link for a new feature or product on your existing website/app. When users click it, inform them it\'s "coming soon" and offer to notify them.</li>
        <li><em>Pros:</em> Measures interest in a specific feature with minimal development.</li>
        <li><em>Cons:</em> Can frustrate users if not handled carefully. Be transparent.</li>
        <li><em>Personal Recommendation:</em> Useful for existing products looking to prioritize new features. Ensure the messaging is clear that it\'s an interest gauge.</li>
      </ul>

      <h2>Interpreting Validation Results</h2>
      <p>Validation isn\'t a one-time event but an ongoing process. Be prepared to iterate or even pivot based on what you learn. Negative feedback or lack of interest is not failure; it\'s valuable information that saves you from building the wrong thing.</p>
      <p>Metrics to track during validation might include: interview insights, survey completion rates, landing page conversion rates, pre-order numbers, feature request clicks, etc.</p>

      <h2>My Experience</h2>
      <p>For my current venture, we started with dozens of customer interviews. This helped us refine the problem statement significantly. Then, we built a simple landing page with a waitlist, driving traffic via targeted LinkedIn ads. The sign-up rate gave us the confidence to proceed with building a more functional prototype, which we then tested with a small group of beta users using a concierge approach for some features.</p>
    `,
  },
  3: {
    id: 3,
    title: "Looking for feedback on my new AI app",
    author: {
      name: "Samira Khan",
      avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg",
      role: "Indie Developer",
    },
    category: "Feedback",
    createdAt: "May 10, 2025",
    views: 450,
    likes: 98,
    comments: 34,
    readTime: "5 min read",
    headerImage:
      "https://images.unsplash.com/photo-1675459236902-946eb423dcf9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600&q=80",
    contentImages: [
      {
        url: "https://images.unsplash.com/photo-1601242448863-10823b294c0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "AI mobile app interface",
        caption:
          "InsightAI focuses on a clean, intuitive interface for easier content ideation.",
      },
      {
        url: "https://images.unsplash.com/photo-1579493934830-eab45746b51b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        alt: "Social media content planning",
        caption:
          "The app helps with planning and creating engaging social media content across multiple platforms.",
      },
    ],
    content: `
      <p>Hi everyone! I\'m excited (and a bit nervous) to share a project I\'ve been passionately working on for the past few months: an AI-powered app called \'InsightAI\'. I\'m at a stage where I desperately need fresh eyes and honest feedback before a wider launch.</p>

      <h2>What is InsightAI?</h2>
      <p>InsightAI is a mobile application (currently iOS beta) designed to help content creators and marketers generate engaging social media post ideas and captions. It uses a custom-trained language model to analyze trending topics, user-provided keywords, and even the sentiment of existing content to suggest unique and relevant post concepts.</p>

      <h3>Core Features:</h3>
      <ul>
        <li><strong>Idea Generation:</strong> Input a topic or keyword, and InsightAI provides 5-10 post ideas tailored for platforms like Instagram, X (Twitter), and LinkedIn.</li>
        <li><strong>Caption Crafting:</strong> For a selected idea, it can generate a draft caption, including relevant hashtags and emojis.</li>
        <li><strong>Trend Analysis (Basic):</strong> It offers a glimpse into currently trending keywords within specific niches (this feature is still quite early).</li>
        <li><strong>Tone Adjustment:</strong> Users can select a desired tone for captions (e.g., witty, professional, empathetic).</li>
      </ul>

      <h2>Why I Built This</h2>
      <p>As a former social media manager, I know the struggle of constantly coming up with fresh, engaging content. While many AI writing tools exist, I wanted to create something specifically focused on the ideation and initial drafting phase for social media, with a strong emphasis on creativity and relevance, not just generic text generation.</p>

      <h2>Where I Need Your Feedback</h2>
      <p>I\'m looking for feedback on several aspects:</p>
      <ol>
        <li><strong>User Experience (UX) & User Interface (UI):</strong>
            <ul>
                <li>Is the app intuitive to navigate?</li>
                <li>Is the design clean and appealing?</li>
                <li>Are there any confusing elements or workflows?</li>
            </ul>
        </li>
        <li><strong>Quality of AI Suggestions:</strong>
            <ul>
                <li>Are the generated post ideas creative and relevant?</li>
                <li>Are the captions high-quality and useful as a starting point?</li>
                <li>Does the tone adjustment feature work effectively?</li>
            </ul>
        </li>
        <li><strong>Core Value Proposition:</strong>
            <ul>
                <li>Is this a tool you could see yourself (or someone you know) using?</li>
                <li>What features are most valuable? What\'s missing?</li>
                <li>How does it compare to other tools you might have used?</li>
            </ul>
        </li>
        <li><strong>Bugs & Performance:</strong>
            <ul>
                <li>Did you encounter any crashes, bugs, or slow performance? (Please specify your device and iOS version if so).</li>
            </ul>
        </li>
      </ol>

      <h2>How to Access the Beta</h2>
      <p>Currently, the beta is available via TestFlight. If you\'re interested in testing, please comment below or DM me, and I\'ll send you an invite link. I\'m looking for about 20-30 testers for this round.</p>

      <h2>A Little About the Tech Stack (for the curious)</h2>
      <p>The app is built natively with Swift for iOS. The backend uses Python (FastAPI) and the AI model is a fine-tuned version of a smaller open-source LLM, hosted on a cloud GPU instance.</p>

      <h2>My Ask</h2>
      <p>Please be as honest and detailed as possible. Constructive criticism is incredibly valuable at this stage. I\'m particularly interested in hearing about any "aha!" moments or, conversely, moments of frustration.</p>
      <p>Thank you so much in advance for your time and insights. I\'m really looking forward to hearing your thoughts and making InsightAI the best it can be!</p>
    `,
  },
};

// Animation variants for Framer Motion - Enhanced for ProductBazar's violet theme
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.4 } }
};

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.4 } }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { scale: 0.97, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

function ThreadPage() {
  // Refs for elements and animations
  const containerRef = useRef(null);
  const articleRef = useRef(null);

  // State variables
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [animateHeader, setAnimateHeader] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [readingProgress, setReadingProgress] = useState(0);
  const [showAuthorProfile, setShowAuthorProfile] = useState(false);
  const params = useParams();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scroll animation hooks
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Smooth spring animation for reading progress
  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 100 });

  // Transform values for parallax effects
  const bgBlobY1 = useTransform(smoothProgress, [0, 1], [0, -100]);
  const bgBlobY2 = useTransform(smoothProgress, [0, 1], [0, -50]);
  const bgBlobY3 = useTransform(smoothProgress, [0, 1], [0, -150]);

  // Get thread ID from URL params
  useEffect(() => {
    // Default to thread ID 1 if not specified in URL
    const threadId = params?.id ? parseInt(params.id) : 1;

    if (threads[threadId]) {
      setThread(threads[threadId]);
    } else {
      // Fallback to first thread if specified ID doesn't exist
      setThread(threads[1]);
    }

    setLoading(false);
  }, [params]);

  // Handle scroll behavior with optimized performance
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = position / totalHeight;

      // Update all scroll-related states
      setShowScrollToTop(position > 400);
      setAnimateHeader(position > 120);
      setReadingProgress(progress);
      setShowAuthorProfile(position > 300 && position < totalHeight - 300);

      // Show table of contents after scrolling past the header
      setShowToc(position > 500);

      // Update active section based on scroll position
      // This would normally use IntersectionObserver with actual section IDs
      if (position < 800) {
        setActiveSection("understanding");
      } else if (position < 1200) {
        setActiveSection("project-management");
      } else if (position < 1600) {
        setActiveSection("marketing");
      } else if (position < 2000) {
        setActiveSection("development");
      } else if (position < 2400) {
        setActiveSection("analytics");
      } else {
        setActiveSection("final-thoughts");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle scroll restoration
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-violet-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-violet-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Thread not found</h1>
        <Link href="/forum" className="text-violet-600 hover:text-violet-700 hover:underline transition-colors">
          Return to forum
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white min-h-screen font-sans flex flex-col *:items-center justify-start relative">
      {/* Enhanced decorative background elements - Violet theme */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Primary animated blob - Bottom right */}
        <motion.div
          className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-500/20 via-violet-500/15 to-violet-600/20 pointer-events-none will-change-transform backdrop-blur-3xl"
          style={{ y: bgBlobY1 }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.7, 0.6],
            filter: ["blur(70px)", "blur(80px)", "blur(70px)"],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
        />

        {/* Secondary animated blob - Top left */}
        <motion.div
          className="absolute -top-[15%] -left-[15%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-violet-400/15 via-indigo-500/10 to-indigo-500/15 pointer-events-none will-change-transform backdrop-blur-3xl"
          style={{ y: bgBlobY2 }}
          animate={{
            scale: [1, 1.07, 1],
            opacity: [0.5, 0.6, 0.5],
            filter: ["blur(65px)", "blur(75px)", "blur(65px)"],
            rotate: [0, -7, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
        />

        {/* Small accent blob - Middle right */}
        <motion.div
          className="absolute top-[30%] right-[10%] w-[250px] h-[250px] rounded-full bg-gradient-to-br from-blue-400/10 via-cyan-500/5 to-blue-500/10 pointer-events-none will-change-transform backdrop-blur-3xl hidden md:block"
          style={{ y: bgBlobY3 }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.4, 0.5, 0.4],
            filter: ["blur(60px)", "blur(70px)", "blur(60px)"],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.5, 1],
          }}
        />

        {/* Grid background */}
        <div className="absolute top-0 left-0 w-full h-full bg-grid-violet-100/[0.3] bg-[length:40px_40px] opacity-30 pointer-events-none"></div>

        {/* Subtle gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-white via-white/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
      </div>

      {/* Enhanced Top Navigation Bar with Reading Progress */}
      <motion.header
        className={`fixed top-[8rem] md:top-[4rem] left-0 right-0 bg-white/90 backdrop-blur-lg z-30 transition-all duration-300 ${
          animateHeader ? "shadow-lg shadow-violet-100/30 py-2" : "py-4"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link
              href="/forum"
              className="flex items-center text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors group"
            >
              <motion.div
                whileHover={{ x: -3 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ChevronLeft
                  size={18}
                  className="mr-1.5 group-hover:text-violet-500"
                />
              </motion.div>
              <span className="font-medium">Back to Forum</span>
            </Link>

            <div
              className={`text-gray-800 font-semibold transition-all duration-300 ${
                animateHeader ? "opacity-100" : "opacity-0"
              }`}
            >
              {thread.title.length > 40 ? `${thread.title.substring(0, 40)}...` : thread.title}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Reading time indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={`hidden md:flex items-center space-x-2 px-3 py-1.5 bg-violet-50 rounded-full transition-all duration-300 ${
                animateHeader ? "opacity-100" : "opacity-0"
              }`}
            >
              <Clock size={14} className="text-violet-600" />
              <span className="text-xs font-medium text-violet-700">{thread.readTime}</span>
            </motion.div>

            {/* Share button with tooltip */}
            <motion.div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                aria-label="Share this article"
              >
                <Share2 size={20} />
              </motion.button>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Share article
              </div>
            </motion.div>

            {/* Bookmark button with tooltip */}
            <motion.div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full text-gray-600 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                aria-label="Bookmark this article"
              >
                <Bookmark size={20} />
              </motion.button>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                Save article
              </div>
            </motion.div>
          </div>
        </div>

        {/* Reading progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-violet-600 origin-left z-50"
          style={{ scaleX: smoothProgress }}
        />
      </motion.header>

      <main className="relative w-[70vw] max-w-7xl mx-auto px-4 pt-24 pb-16 z-10">
        {/* Enhanced Thread Header Section */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mb-10"
        >
          {/* Category Badge and Read Time */}
          <motion.div
            variants={fadeIn}
            className="flex items-center justify-between mb-6"
          >
            <motion.span
              variants={scaleIn}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-md shadow-violet-200/50"
            >
              <Tag size={14} className="mr-1.5" />
              {thread.category}
            </motion.span>

            <motion.div
              variants={fadeIn}
              className="flex items-center text-sm text-gray-500 space-x-4"
            >
              <div className="flex items-center">
                <Calendar size={14} className="mr-1.5 text-violet-500" />
                <span>{thread.createdAt}</span>
              </div>

              <div className="flex items-center">
                <Eye size={14} className="mr-1.5 text-violet-500" />
                <span>{thread.views.toLocaleString()} views</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Thread Title with enhanced typography */}
          <motion.h1
            variants={slideUp}
            className="text-4xl sm:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-tight"
          >
            {thread.title}
          </motion.h1>

          {/* Enhanced Author Card */}
          <motion.div
            variants={scaleIn}
            whileHover={{ scale: 1.01, boxShadow: "0 8px 30px rgba(124, 58, 237, 0.1)" }}
            className="flex items-center justify-between p-6 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl shadow-md shadow-violet-100/50 mb-10 border border-violet-100/50 backdrop-blur-sm"
          >
            <div className="flex items-center">
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
                <Image
                  src={thread.author.avatarUrl}
                  alt={thread.author.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover border-2 border-white shadow-sm relative z-10 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900 text-lg">
                  {thread.author.name}
                </p>
                <p className="text-sm text-gray-600">{thread.author.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1.5 text-sm font-medium text-violet-600 bg-white rounded-lg shadow-sm border border-violet-100 hover:bg-violet-50 transition-colors duration-200"
              >
                Follow
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-1.5 text-violet-600 bg-white rounded-lg shadow-sm border border-violet-100 hover:bg-violet-50 transition-colors duration-200"
              >
                <MessageSquare size={16} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Floating Author Profile - Appears during scrolling */}
        <AnimatePresence>
          {showAuthorProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 left-6 z-40 flex items-center p-3 bg-white rounded-full shadow-lg border border-violet-100 max-w-[200px] overflow-hidden"
            >
              <Image
                src={thread.author.avatarUrl}
                alt={thread.author.name}
                width={36}
                height={36}
                className="rounded-full object-cover border border-violet-100"
              />
              <div className="ml-2 truncate">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {thread.author.name}
                </p>
                <p className="text-xs text-gray-500 truncate">{thread.author.role}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Featured Image with parallax effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-80 sm:h-96 md:h-[500px] mb-12 rounded-2xl overflow-hidden shadow-xl shadow-violet-100/50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 mix-blend-overlay z-10"></div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
            className="relative w-full h-full"
          >
            <Image
              src={thread.headerImage}
              alt={thread.title}
              fill
              className="object-cover will-change-transform"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20"></div>

          {/* Enhanced info overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-5 flex items-center justify-between text-white backdrop-blur-sm bg-black/20 z-30">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="hidden md:flex items-center space-x-3"
            >
              <div className="flex items-center space-x-1.5">
                <Clock size={16} />
                <span className="text-sm font-medium">{thread.readTime}</span>
              </div>

              <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>

              <div className="flex items-center space-x-1.5">
                <Heart size={16} />
                <span className="text-sm font-medium">{thread.likes} likes</span>
              </div>
            </motion.div>

            <div className="flex items-center space-x-1.5 ml-auto">
              <Eye size={18} className="mr-1" />
              <span className="text-sm font-medium">{thread.views.toLocaleString()} views</span>
            </div>
          </div>

          {/* Decorative corner accent */}
          <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-white/30 rounded-tr-lg z-20"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-white/30 rounded-bl-lg z-20"></div>
        </motion.div>

        {/* Thread Content with Table of Contents */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Floating Table of Contents - Desktop */}
          <AnimatePresence>
            {showToc && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="hidden lg:block sticky top-24 h-fit w-64 shrink-0 overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-md border border-violet-100/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <List size={16} className="mr-2 text-violet-600" />
                    Table of Contents
                  </h3>

                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {/* Generate TOC from h2 and h3 tags with active section highlighting */}
                    <div className={`flex items-center space-x-2 ${activeSection === "understanding" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-5 ${activeSection === "understanding" ? "bg-violet-600" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#understanding"
                        className={`hover:text-violet-600 transition-colors ${activeSection === "understanding" ? "font-medium" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("understanding")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Understanding the Tool Stack
                      </a>
                    </div>

                    <div className={`flex items-center space-x-2 pl-3 ${activeSection === "project-management" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-4 ${activeSection === "project-management" ? "bg-violet-500" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#project-management"
                        className="hover:text-violet-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("project-management")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Project Management
                      </a>
                    </div>

                    <div className={`flex items-center space-x-2 pl-3 ${activeSection === "marketing" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-4 ${activeSection === "marketing" ? "bg-violet-500" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#marketing"
                        className="hover:text-violet-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("marketing")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Marketing & Sales
                      </a>
                    </div>

                    <div className={`flex items-center space-x-2 pl-3 ${activeSection === "development" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-4 ${activeSection === "development" ? "bg-violet-500" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#development"
                        className="hover:text-violet-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("development")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Development & Operations
                      </a>
                    </div>

                    <div className={`flex items-center space-x-2 pl-3 ${activeSection === "analytics" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-4 ${activeSection === "analytics" ? "bg-violet-500" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#analytics"
                        className="hover:text-violet-600 transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("analytics")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Analytics & BI
                      </a>
                    </div>

                    <div className={`flex items-center space-x-2 ${activeSection === "final-thoughts" ? "text-violet-600 font-medium" : "text-gray-700"} transition-colors duration-300`}>
                      <div className={`w-1 h-5 ${activeSection === "final-thoughts" ? "bg-violet-600" : "bg-violet-300"} rounded-full transition-colors duration-300`}></div>
                      <a
                        href="#final-thoughts"
                        className={`hover:text-violet-600 transition-colors ${activeSection === "final-thoughts" ? "font-medium" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("final-thoughts")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Final Thoughts
                      </a>
                    </div>
                  </div>

                  {/* Reading time indicator */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock size={14} className="mr-1.5 text-violet-500" />
                      <span>{thread.readTime}</span>
                    </div>

                    <div className="text-sm text-gray-500">
                      {Math.round(readingProgress * 100)}% read
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content - Enhanced for better readability */}
          <motion.article
            ref={articleRef}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="prose prose-lg max-w-none mx-auto w-full lg:flex-1"
          >
            {/* Content Images - Enhanced with alternating layout */}
            {thread.contentImages && thread.contentImages.map((image, index) => (
              <motion.figure
                key={index}
                variants={scaleIn}
                custom={index}
                whileHover="hover"
                className={`my-12 ${index % 2 === 1 ? 'md:float-right md:ml-8 md:w-2/5' : 'md:float-left md:mr-8 md:w-2/5'}`}
              >
                <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg shadow-violet-100/30 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity duration-300"></div>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"></div>

                  {/* Copy button that appears on hover */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-3 right-3 p-2 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30"
                    aria-label="Copy image link"
                  >
                    <Copy size={14} className="text-violet-600" />
                  </motion.button>
                </div>
                <figcaption className="mt-3 text-center text-sm text-gray-600 italic">
                  {image.caption}
                </figcaption>
              </motion.figure>
            ))}

            {/* Render the thread content with enhanced styling and section IDs */}
            <motion.div
              variants={slideUp}
              className="mb-12 thread-content"
            >
              {/* We're manually adding section IDs since we can't modify the HTML string directly */}
              <div dangerouslySetInnerHTML={{ __html: thread.content.replace(
                '<h2>Understanding the Startup Tool Stack</h2>',
                '<h2 id="understanding">Understanding the Startup Tool Stack</h2>'
              ).replace(
                '<h3>Project Management & Collaboration</h3>',
                '<h3 id="project-management">Project Management & Collaboration</h3>'
              ).replace(
                '<h3>Marketing & Sales Automation</h3>',
                '<h3 id="marketing">Marketing & Sales Automation</h3>'
              ).replace(
                '<h3>Development & Operations</h3>',
                '<h3 id="development">Development & Operations</h3>'
              ).replace(
                '<h3>Analytics & Business Intelligence</h3>',
                '<h3 id="analytics">Analytics & Business Intelligence</h3>'
              ).replace(
                '<h2>Final Thoughts & Personal Insights</h2>',
                '<h2 id="final-thoughts">Final Thoughts & Personal Insights</h2>'
              ) }} />
            </motion.div>

            {/* Pull quote - Highlighted section */}
            <motion.blockquote
              variants={scaleIn}
              className="my-10 p-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-l-4 border-violet-500 rounded-r-xl shadow-sm not-prose"
            >
              <p className="text-lg text-gray-800 italic leading-relaxed">
                "Choosing the right tools is a continuous process. What works today might need to be re-evaluated as your startup grows and its needs change."
              </p>
              <footer className="mt-2 text-sm text-gray-600">
                — Key insight from this article
              </footer>
            </motion.blockquote>

            {/* Enhanced Tags */}
            <motion.div
              variants={fadeIn}
              className="flex flex-wrap gap-2 mt-12 mb-12"
            >
              {[
                "Design Trends",
                "UX/UI",
                "Technology",
                "Innovation",
                "Digital Products",
              ].map((tag) => (
                <motion.span
                  key={tag}
                  whileHover={{ scale: 1.05, backgroundColor: "rgb(237, 233, 254)" }}
                  whileTap={{ scale: 0.98 }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:text-violet-600 rounded-full text-sm transition-all cursor-pointer border border-transparent hover:border-violet-100"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>

            {/* Enhanced Action Bar */}
            <motion.div
              variants={fadeIn}
              className="mt-16 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-200 text-violet-600 rounded-lg transition-all shadow-sm hover:bg-violet-50"
                >
                  <Heart size={18} />
                  <span>Like ({thread.likes})</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-200 text-violet-600 rounded-lg transition-all shadow-sm hover:bg-violet-50"
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </motion.button>
              </div>

              <Link href="/forum">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all shadow-md shadow-violet-200"
                >
                  <ChevronLeft size={18} />
                  <span>Back to Forum</span>
                </motion.button>
              </Link>
            </motion.div>
          </motion.article>
        </div>
      </main>

      {/* Enhanced Scroll to top button with animation */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3.5 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-full shadow-lg shadow-violet-500/20 z-40 hover:shadow-violet-500/30 group"
            aria-label="Scroll to top"
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 0.5
              }}
            >
              <ArrowUp size={20} className="group-hover:stroke-2 transition-all duration-300" />
            </motion.div>

            {/* Ripple effect on hover */}
            <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-25 group-hover:scale-110 transition-all duration-300"></span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Enhanced custom styles for thread content */}
      <style jsx global>{`
        /* Custom scrollbar for better UX */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
        }

        /* Enhanced typography for thread content */
        .thread-content h2 {
          font-size: 1.85rem;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          color: #1f2937;
          letter-spacing: -0.01em;
          position: relative;
          padding-bottom: 0.5rem;
        }

        .thread-content h2::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 3rem;
          height: 3px;
          background: linear-gradient(to right, #8b5cf6, #c4b5fd);
          border-radius: 3px;
        }

        .thread-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2.25rem;
          margin-bottom: 1rem;
          color: #374151;
          letter-spacing: -0.01em;
        }

        .thread-content p {
          margin-bottom: 1.5rem;
          line-height: 1.85;
          color: #4b5563;
          font-size: 1.125rem;
          letter-spacing: 0.01em;
        }

        .thread-content ul, .thread-content ol {
          margin-top: 1.25rem;
          margin-bottom: 1.75rem;
          padding-left: 1.5rem;
        }

        .thread-content li {
          margin-bottom: 0.75rem;
          line-height: 1.7;
          position: relative;
        }

        .thread-content ul > li::before {
          content: '';
          position: absolute;
          left: -1.25rem;
          top: 0.6rem;
          width: 0.4rem;
          height: 0.4rem;
          background-color: #8b5cf6;
          border-radius: 50%;
        }

        .thread-content a {
          color: #7c3aed;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          font-weight: 500;
        }

        .thread-content a:hover {
          color: #6d28d9;
        }

        .thread-content a::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 1px;
          background-color: #7c3aed;
          transform: scaleX(0);
          transform-origin: bottom right;
          transition: transform 0.3s ease;
        }

        .thread-content a:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }

        .thread-content strong {
          color: #111827;
          font-weight: 600;
        }

        .thread-content blockquote {
          border-left: 4px solid #8b5cf6;
          padding: 0.75rem 0 0.75rem 1.5rem;
          font-style: italic;
          color: #4b5563;
          margin: 2rem 0;
          background-color: #f5f3ff;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        /* Highlight text selection */
        .thread-content ::selection {
          background-color: rgba(139, 92, 246, 0.2);
        }

        /* Enhance image captions */
        .thread-content figcaption {
          font-size: 0.875rem;
          color: #6b7280;
          text-align: center;
          margin-top: 0.75rem;
          font-style: italic;
        }

        /* Add subtle hover effect to code blocks */
        .thread-content code {
          background-color: #f5f3ff;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #6d28d9;
          transition: background-color 0.2s ease;
        }

        .thread-content code:hover {
          background-color: #ede9fe;
        }
      `}</style>
    </div>
  );
}

export default ThreadPage;