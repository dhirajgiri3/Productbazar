import cors from "cors";

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://product-bazar.vercel.app',
  'https://productbazar-frontend.onrender.com'
  // Add other production/staging domains here
];

// Main CORS configuration
export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Important for cookies/auth sessions
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-device-type', 'Cache-Control', 'Pragma', 'X-Cache-Invalidate'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours - how long preflight requests can be cached
};

// Middleware to handle OPTIONS requests
export const handleOptions = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Set CORS headers for preflight requests
    res.header('Access-Control-Allow-Origin', corsOptions.origin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', corsOptions.maxAge);
    return res.status(200).end();
  }
  next();
};

// Pre-configured cors middleware for consistent usage
export const configureCors = cors(corsOptions);

// Debug middleware to log CORS headers
export const logCorsHeaders = (req, res, next) => {
  const originalSetHeader = res.setHeader;

  res.setHeader = function(name, value) {
    if (name.toLowerCase().startsWith('access-control')) {
      // Removed console.log for production
    }
    return originalSetHeader.apply(res, arguments);
  };

  next();
};