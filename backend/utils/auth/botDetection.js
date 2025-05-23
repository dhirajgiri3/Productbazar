// Common bot user agent patterns
const BOT_PATTERNS = [
  // General bot identifiers
  /bot/i, /crawler/i, /spider/i, /slurp/i, /search/i, /archive/i, /monitoring/i,
  /analyzer/i, /scraper/i, /probe/i, /phantom/i, /headless/i, /selenium/i,

  // Specific bots and tools
  /chrome-lighthouse/i, /pingdom/i, /gtmetrix/i, /pagespeed/i, /lighthouse/i,
  /sitecheck/i, /sitechecker/i, /uptimerobot/i, /statuspage/i, /statuscake/i,
  /checkly/i, /screaming frog/i, /xenu/i, /ahrefs/i, /semrush/i, /majestic/i,

  // Social media bots
  /facebook/i, /whatsapp/i, /telegram/i, /discord/i, /twitter/i, /slack/i,
  /linkedin/i, /pinterest/i, /tiktok/i, /instagram/i, /snapchat/i,

  // SEO and analytics tools
  /seo/i, /analytics/i, /optimizer/i, /yandex/i, /baidu/i, /bingbot/i,
  /googlebot/i, /duckduckbot/i, /yahoo/i, /baiduspider/i, /exabot/i,
  /facebookexternalhit/i,

  // Email-related bots
  /litmus/i, /mail/i, /mailchimp/i, /sendgrid/i, /mailgun/i, /postmark/i,

  // Security scanners
  /nessus/i, /qualys/i, /acunetix/i, /netsparker/i, /burpsuite/i, /zap/i,
  /nikto/i, /securityheaders/i, /observatory/i, /hardenize/i,

  // Performance tools
  /newrelic/i, /dynatrace/i, /appdynamics/i, /datadog/i, /instana/i,
  /blazemeter/i, /jmeter/i, /loadrunner/i,
];

// Expanded list of known bot IP ranges - significantly enhanced
const BOT_IP_RANGES = [
  // Google bot ranges
  { start: "66.249.64.0", end: "66.249.95.255" },   // Googlebot
  { start: "64.233.160.0", end: "64.233.191.255" }, // Google
  { start: "216.239.32.0", end: "216.239.63.255" }, // Google
  { start: "209.85.128.0", end: "209.85.255.255" }, // Google
  { start: "66.102.0.0", end: "66.102.15.255" },    // Google

  // Bing bot ranges
  { start: "157.55.39.0", end: "157.55.39.255" },   // Bingbot
  { start: "207.46.13.0", end: "207.46.13.255" },   // Bingbot
  { start: "40.77.167.0", end: "40.77.167.255" },   // Bingbot
  { start: "13.66.139.0", end: "13.66.139.255" },   // Bingbot
  { start: "13.67.143.0", end: "13.67.143.255" },   // Bingbot
  { start: "40.77.167.0", end: "40.77.167.255" },   // Bingbot
  { start: "52.167.144.0", end: "52.167.144.255" }, // Bingbot

  // Yahoo bot ranges
  { start: "72.30.196.0", end: "72.30.196.255" },   // Yahoo! Slurp
  { start: "98.137.11.0", end: "98.137.11.255" },   // Yahoo
  { start: "98.139.183.0", end: "98.139.183.255" }, // Yahoo

  // Baidu bot ranges
  { start: "180.76.15.0", end: "180.76.15.255" },   // Baiduspider
  { start: "123.125.71.0", end: "123.125.71.255" }, // Baidu

  // Yandex bot ranges
  { start: "100.43.64.0", end: "100.43.127.255" },  // Yandex
  { start: "141.8.142.0", end: "141.8.142.255" },   // Yandex
  { start: "178.154.165.0", end: "178.154.165.255" }, // Yandex

  // Twitter bot ranges
  { start: "199.59.148.0", end: "199.59.151.255" }, // Twitter
  { start: "104.244.40.0", end: "104.244.47.255" }, // Twitter

  // Facebook bot ranges
  { start: "69.63.176.0", end: "69.63.183.255" },   // Facebook
  { start: "173.252.64.0", end: "173.252.127.255" }, // Facebook
  { start: "31.13.24.0", end: "31.13.31.255" },     // Facebook

  // LinkedIn bot ranges
  { start: "108.174.0.0", end: "108.174.15.255" },  // LinkedIn

  // Common crawler ranges
  { start: "54.36.148.0", end: "54.36.149.255" },   // OVH crawler
  { start: "50.116.0.0", end: "50.116.63.255" },    // Linode
  { start: "167.114.0.0", end: "167.114.255.255" }, // OVH

  // Monitoring service ranges
  { start: "184.72.0.0", end: "184.72.255.255" },   // AWS
  { start: "184.73.0.0", end: "184.73.255.255" },   // AWS
  { start: "13.32.0.0", end: "13.33.255.255" },     // AWS CloudFront
  { start: "52.0.0.0", end: "52.15.255.255" },      // AWS
  { start: "54.0.0.0", end: "54.255.255.255" },     // AWS

  // SEO tool ranges
  { start: "185.181.102.0", end: "185.181.102.255" }, // SEMrush
  { start: "208.115.111.0", end: "208.115.111.255" }, // Moz
  { start: "104.193.88.0", end: "104.193.88.255" },   // Ahrefs
];

/**
 * Convert an IP address string to a long integer for range comparison
 * @param {string} ip - IP address in dotted-decimal notation
 * @returns {number} Long integer representation
 */
const ipToLong = (ip) => {
  return (
    ip.split(".").reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0
  );
};

/**
 * Check if an IP address is within a given range
 * @param {string} ip - IP address to check
 * @param {Object} range - Range object with start and end IPs
 * @returns {boolean} True if IP is within range
 */
const isInRange = (ip, range) => {
  const ipLong = ipToLong(ip);
  const startLong = ipToLong(range.start);
  const endLong = ipToLong(range.end);
  return ipLong >= startLong && ipLong <= endLong;
};

/**
 * Enhanced bot detection using multiple signals
 * @param {Object} req - Express request object with headers and IP
 * @returns {boolean} - True if request is likely from a bot
 */
export const detectBot = (req) => {
  // Safely access headers - ensure they exist
  const headers = req.headers || {};

  // Safely get user agent
  const userAgent = headers["user-agent"] || "";
  const ip = req.ip || req.connection?.remoteAddress || "0.0.0.0";

  // 1. Check for headless browser fingerprints - only if userAgent exists
  const isHeadless = userAgent ? [
    "HeadlessChrome", "PhantomJS", "Puppeteer", "Headless", "Electron",
    "Nightmare", "Selenium", "webdriver", "phantomjs", "slimerjs",
    "jsdom", "zombie.js"
  ].some(pattern => userAgent.includes(pattern)) : false;

  // 2. Check for missing common headers (all browsers typically send these)
  const missingCommonHeaders =
    [
      !headers["accept"],
      !headers["accept-language"],
      !headers["accept-encoding"],
      !headers["user-agent"],
    ].filter(Boolean).length >= 2;

  // 3. Check for automation tool headers
  const automationHeaders = [
    headers["x-puppeteer"],
    headers["x-puppeteer-version"],
    headers["x-automated-browser"],
    headers["x-testing-request"],
    headers["x-lighthouse"],
    headers["x-datadog"],
    headers["x-newrelic"],
    headers["x-crawler"],
    headers["x-bot"],
    headers["x-proxy"],
    headers["x-scraper"],
  ].some(Boolean);

  // 4. Check for server timing information
  const tooFast = req.timing && req.timing < 100; // < 100ms is suspicious

  // 5. Check for unnatural behavior patterns
  const suspiciousBehavior = req.session && (
    req.session.pageViews > 100 || // Too many page views
    (req.session.lastRequestTime &&
     Date.now() - req.session.lastRequestTime < 50) // Requests too close together
  );

  // Only check user agent patterns if we have a user agent
  const matchesBotPattern = userAgent
    ? BOT_PATTERNS.some((pattern) => pattern.test(userAgent))
    : false;

  // Only check IP ranges if we have a valid IP
  const matchesBotIpRange = ip && ip !== "0.0.0.0" && ip !== "::1" && ip !== "127.0.0.1"
    ? BOT_IP_RANGES.some((range) => isInRange(ip, range))
    : false;

  // 6. Check for bot declaration in user-agent
  const declaredBot = userAgent && (
    userAgent.includes("bot") ||
    userAgent.includes("crawler") ||
    userAgent.includes("spider")
  );

  // Log suspicious requests in development
  if (process.env.NODE_ENV === "development" &&
      (matchesBotPattern || matchesBotIpRange || isHeadless ||
       missingCommonHeaders || automationHeaders || declaredBot)) {
    // Removed console.log for production
    // Debug information about bot detection would be here
  }

  return (
    matchesBotPattern ||
    matchesBotIpRange ||
    isHeadless ||
    missingCommonHeaders ||
    automationHeaders ||
    tooFast ||
    suspiciousBehavior ||
    declaredBot
  );
};

/**
 * Check for suspicious view patterns indicating bot behavior
 * @param {Object} viewData - View data including timing and user behavior
 * @returns {boolean} - True if view pattern seems suspicious
 */
export const detectSuspiciousViewPattern = (viewData) => {
  const {
    viewDuration,
    pageScrolls,
    mouseMovements,
    keyboardEvents,
    timeOnPage,
  } = viewData;

  // Very short view duration
  if (viewDuration < 2) return true;

  // No interaction signals
  if (!pageScrolls && !mouseMovements && !keyboardEvents) return true;

  // Unrealistic viewing speed
  if (timeOnPage && timeOnPage < 0.5) return true;

  return false;
};

/**
 * Create middleware to identify bots early in request lifecycle
 * @returns {Function} Express middleware function
 */
export const botDetectionMiddleware = () => {
  return (req, res, next) => {
    // Start timing the request for speed analysis
    req.requestStartTime = Date.now();

    // Detect bot status and attach to request object
    req.isBot = detectBot(req);

    // Optionally add headers for debugging
    if (process.env.NODE_ENV === 'development') {
      res.set('X-Bot-Detection', req.isBot ? 'bot' : 'human');
    }

    // Continue to next middleware
    next();
  };
};

/**
 * Calculate request timing and add to request object
 * @returns {Function} Express middleware function
 */
export const requestTimingMiddleware = () => {
  return (req, res, next) => {
    // Calculate time since request start if available
    if (req.requestStartTime) {
      req.timing = Date.now() - req.requestStartTime;
    }
    next();
  };
};

export default {
  detectBot,
  detectSuspiciousViewPattern,
  botDetectionMiddleware,
  requestTimingMiddleware
};
