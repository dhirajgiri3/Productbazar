import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
import slugify from "slugify";
import path from "path";
import { fileURLToPath } from "url";

// Import Models
import User from "./models/user/user.model.js";
import Category from "./models/category/category.model.js";
import Tag from "./models/product/tag.model.js";
import Product from "./models/product/product.model.js";
import Job from "./models/job/job.model.js";
import Project from "./models/project/project.model.js";
import Startup from "./models/user/startup.model.js";
import Investor from "./models/user/investor.model.js";
import Freelancer from "./models/user/freelancer.model.js";
import Agency from "./models/user/agency.model.js";
import Jobseeker from "./models/user/jobseeker.model.js";
import View from "./models/view/view.model.js";
import Upvote from "./models/product/upvote.model.js";
import Comment from "./models/product/comment.model.js";
import Bookmark from "./models/product/bookmark.model.js";
import Recommendation from "./models/recommendation/recommendation.model.js";
import RecommendationInteraction from "./models/recommendation/recommendationInteraction.model.js";
import SearchHistory from "./models/search/searchHistory.model.js";

// Import Utils
import logger from "./utils/logging/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") }); // Load .env from the same directory as seedData.js (backend/src/)

// --- Constants ---
const NUM_USERS_TOTAL = 250;
const NUM_ADMINS = 3; // Note: Only 1 admin is created/ensured by default
const NUM_MAKERS = 40;
const NUM_STARTUPS = 25;
const NUM_INVESTORS = 15;
const NUM_AGENCIES = 10;
const NUM_FREELANCERS = 30;
const NUM_JOBSEEKERS = 50;
const COMMON_TAGS = [
  "ai",
  "machine learning",
  "saas",
  "web app",
  "mobile app",
  "productivity",
  "javascript",
  "python",
  "react",
  "node.js",
  "analytics",
  "design",
  "database",
  "blockchain",
  "api",
  "automation",
  "tool",
  "developer tool",
  "social",
  "education",
  "business",
  "finance",
  "marketing",
  "health",
  "fitness",
  "gaming",
  "entertainment",
  "collaboration",
  "communication",
  "workflow",
  "remote work",
  "dashboard",
  "platform",
  "low-code",
  "nocode",
  "subscription",
  "freemium",
  "b2b",
  "b2c",
  "security",
  "cloud",
  "aws",
  "google cloud",
  "azure",
  "data privacy",
  "nosql",
  "sql",
  "mobile first",
  "responsive",
  "ecommerce",
  "payments",
  "landing page",
  "mvp",
  "beta",
  "launch",
  "marketplace",
  "community",
  "devops",
  "testing",
  "ui-kit",
  "framework",
  "library",
  "open-source",
  "data visualization",
  "crm",
  "project management",
  "recruiting",
  "hr tech",
];
const NUM_TAGS = COMMON_TAGS.length;
const NUM_CATEGORIES_TOP = 15;
const NUM_SUBCATEGORIES_MAX_PER_CAT = 5;
const NUM_PRODUCTS_MIN = 350;
const NUM_PRODUCTS_MAX = 450;
const NUM_JOBS = 60;
const NUM_PROJECTS_MIN = 80;
const NUM_PROJECTS_MAX = 120;
const MAX_TAGS_PER_PRODUCT = 7;
const MAX_GALLERY_IMAGES_PER_PRODUCT = 5;
const MAX_COMMENTS_PER_PRODUCT = 15;
const MAX_REPLIES_PER_COMMENT = 4;
const MAX_INTERACTIONS_PER_USER = 200;
const MAX_PROJECTS_PER_USER = 5;
const MAX_JOBS_PER_POSTER = 4;
const MAX_SEARCHES_PER_USER = 15;
const TEST_USERS_DATA = [
  {
    email: "test@user.com",
    password: "password123",
    role: "user",
    firstName: "Test",
    lastName: "User",
  },
  {
    email: "test@maker.com",
    password: "password123",
    role: "maker",
    firstName: "Test",
    lastName: "Maker",
  },
  {
    email: "test@admin.com",
    password: "password123",
    role: "admin",
    firstName: "Test",
    lastName: "Admin",
  },
  {
    email: "test@jobseeker.com",
    password: "password123",
    role: "jobseeker",
    firstName: "Test",
    lastName: "Jobseeker",
  },
  {
    email: "test@freelancer.com",
    password: "password123",
    role: "freelancer",
    firstName: "Test",
    lastName: "Freelancer",
  },
  {
    email: "test@investor.com",
    password: "password123",
    role: "investor",
    firstName: "Test",
    lastName: "Investor",
  },
  {
    email: "test@agency.com",
    password: "password123",
    role: "agency",
    firstName: "Test",
    lastName: "Agency",
  },
  {
    email: "test@startup.com",
    password: "password123",
    role: "startupOwner",
    firstName: "Test",
    lastName: "Startup",
  },
];
const FUNDING_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Bootstrapped",
  "Other",
];
const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];
const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "E-commerce",
  "Education",
  "Marketing",
  "Entertainment",
  "SaaS",
  "AI",
  "Gaming",
  "Services",
];
const JOB_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
];
const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Junior",
  "Mid-Level",
  "Senior",
  "Executive",
];
const PRICING_TYPES = ["free", "paid", "subscription", "freemium", "contact"];
const CURRENCIES = ["USD", "EUR", "GBP", "INR"];
const USER_ROLES = [
  "user",
  "maker",
  "startupOwner",
  "investor",
  "agency",
  "freelancer",
  "jobseeker",
];
const VALID_SECONDARY_ROLES = [
  "startupOwner",
  "investor",
  "agency",
  "freelancer",
  "jobseeker",
  "maker",
];
const VALID_INVESTOR_PORTFOLIO_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth",
  "Mature",
  "Exit",
];
const VALID_INVESTOR_PREFERRED_STAGES = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+",
  "Growth",
  "Mature",
];

// --- Helper Functions ---
// generateUniqueSlug definition (assuming it's correct as provided before)
async function generateUniqueSlug(name, Model, excludeId = null) {
  if (!name) {
    name = Model.modelName.toLowerCase() + "-" + faker.string.alphanumeric(6);
  }
  let baseSlug = slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
  if (baseSlug.length > 80) {
    baseSlug = baseSlug.substring(0, 80);
  }
  if (!baseSlug) {
    baseSlug =
      Model.modelName.toLowerCase().substring(0, 10) +
      faker.string.alphanumeric(4);
  }
  let slug = baseSlug;
  let counter = 0;
  let slugExists = true;
  while (slugExists) {
    if (counter > 0) {
      slug = `${baseSlug}-${counter}`;
    }
    const query = { slug: slug };
    if (excludeId) {
      if (mongoose.Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
      } else {
        logger.warn(
          `Invalid excludeId passed to generateUniqueSlug: ${excludeId}`
        );
      }
    }
    try {
      const existingDoc = await Model.findOne(query).select("_id").lean();
      slugExists = !!existingDoc;
      if (slugExists) {
        counter++;
        if (counter > 100) {
          logger.warn(
            `Slug generation loop exceeded 100 attempts for base: ${baseSlug}. Adding random suffix.`
          );
          slug = `${baseSlug}-${faker.string.alphanumeric(8)}`;
          slugExists = false;
        }
      }
    } catch (dbError) {
      logger.error(
        `Database error during slug generation for ${name}: ${dbError.message}`
      );
      slug = `${baseSlug}-${faker.string.alphanumeric(10)}`;
      slugExists = false;
    }
  }
  return slug;
}

// generate Username (Corrected and Robust)
async function generateUniqueUsername(firstName, lastName, User) {
  // Use the static method from the User model to get the base username
  // Ensure User model has the static method generateUsername defined
  if (typeof User.generateUsername !== "function") {
    logger.error(
      "User.generateUsername static method is not defined on the User model."
    );
    // Fallback to a simple random generation if method is missing
    return `user_${faker.string.alphanumeric(10)}`.toLowerCase();
  }

  let baseUsername = User.generateUsername(firstName, lastName);

  // Fallback if base generation somehow fails or names are empty/invalid
  if (!baseUsername || baseUsername.length < 3) {
    baseUsername = `user_${faker.string.alphanumeric(6)}`.substring(0, 30);
    baseUsername = baseUsername.toLowerCase(); // Ensure lowercase
  }

  let username = baseUsername;
  let counter = 0;
  let usernameExists = true;

  while (usernameExists) {
    let currentUsernameToCheck = username;
    // If counter > 0, append it to the base username
    if (counter > 0) {
      const suffix = counter.toString();
      // Recalculate username, ensuring it doesn't exceed max length (30)
      currentUsernameToCheck = `${baseUsername}${suffix}`;
      if (currentUsernameToCheck.length > 30) {
        const baseMaxLength = 30 - suffix.length;
        if (baseMaxLength < 1) {
          // Should be extremely rare
          currentUsernameToCheck = faker.string.alphanumeric(30).toLowerCase(); // Complete random fallback
        } else {
          currentUsernameToCheck = `${baseUsername.substring(
            0,
            baseMaxLength
          )}${suffix}`;
        }
      }
      username = currentUsernameToCheck; // Update the username for the next iteration or return
    } else {
      // For the first check (counter === 0), use the original baseUsername
      currentUsernameToCheck = baseUsername;
    }

    // Check if this username already exists in the DB
    try {
      const existingUser = await User.findOne({
        username: currentUsernameToCheck,
      })
        .select("_id")
        .lean();
      usernameExists = !!existingUser; // True if a user was found, false otherwise

      if (usernameExists) {
        counter++;
        // Safety break to prevent infinite loops in edge cases
        if (counter > 100) {
          logger.warn(
            `Username generation loop exceeded 100 attempts for base: ${baseUsername}. Using random suffix.`
          );
          // Generate a more random username as a final fallback
          const randomSuffix = faker.string.alphanumeric(8);
          const baseMaxLength = 30 - (randomSuffix.length + 1); // +1 for potential separator if needed
          username = `${baseUsername.substring(
            0,
            Math.max(1, baseMaxLength)
          )}-${randomSuffix}`.toLowerCase(); // Ensure base is at least 1 char
          username = username.substring(0, 30); // Ensure max length
          usernameExists = false; // Assume this is unique enough and break loop
        }
        // No need to set username here, it's potentially updated at the start of the next loop iteration
      } else {
        username = currentUsernameToCheck; // Confirm the valid username if no existing user found
      }
    } catch (dbError) {
      logger.error(
        `Database error during username generation check for ${baseUsername}: ${dbError.message}`
      );
      // Fallback in case of DB error during check - generate a random one
      username = `user_${faker.string.alphanumeric(15)}`.toLowerCase();
      username = username.substring(0, 30); // Ensure max length
      usernameExists = false; // Exit loop after error
    }
  }
  return username; // Return the unique username
}

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}
function getRandomSubset(arr, min, max) {
  if (!arr || arr.length === 0) return [];
  const count =
    Math.floor(Math.random() * (Math.min(max, arr.length) - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
function maybe(probability) {
  return Math.random() < probability;
}
const pickRandom = (arr) => {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
};

// --- Database Clearing ---
async function clearDatabase() {
  logger.info("Clearing existing data...");
  const models = [
    User,
    Product,
    Category,
    Tag,
    View,
    Upvote,
    Bookmark,
    Comment,
    Recommendation,
    RecommendationInteraction,
    Job,
    Project,
    Startup,
    Investor,
    Freelancer,
    Agency,
    Jobseeker,
    SearchHistory,
  ];
  const promises = models.map((model) =>
    model
      .deleteMany({})
      .catch((err) =>
        logger.error(`Error clearing ${model.modelName}: ${err.message}`)
      )
  );
  await Promise.all(promises);
  logger.info("Database cleared.");
}

// --- Seeding Functions ---

// seedUsers (Corrected Username Generation)
async function seedUsers(count, rolesToAssign) {
  logger.info(`Creating ${count} users...`);
  const users = [];
  const usedEmails = new Set();

  // --- Ensure Admin User ---
  // Attempt to find the admin user specified in TEST_USERS_DATA
  const adminDataFromTest = TEST_USERS_DATA.find((u) => u.role === "admin");
  if (!adminDataFromTest) {
    logger.error(
      "Admin user configuration missing in TEST_USERS_DATA. Cannot ensure admin exists."
    );
    // Decide whether to proceed or throw an error
    // throw new Error("Admin user configuration missing.");
  } else {
    let adminUser = await User.findOne({
      email: adminDataFromTest.email,
    }).lean(); // Use lean initially
    if (adminUser) {
      logger.info(`Found existing admin user: ${adminUser.email}`);
      // Check if existing admin needs a username
      if (!adminUser.username) {
        try {
          const adminUsername = await generateUniqueUsername(
            adminUser.firstName,
            adminUser.lastName,
            User
          );
          await User.updateOne(
            { _id: adminUser._id },
            { $set: { username: adminUsername } }
          );
          logger.info(
            `--> Added missing username to existing admin user ${adminUser.email}: ${adminUsername}`
          );
          adminUser.username = adminUsername; // Update lean object for consistency if needed later
        } catch (updateError) {
          logger.error(
            `--> Failed to add missing username to existing admin user ${adminUser.email}: ${updateError.message}`
          );
        }
      }
      usedEmails.add(adminUser.email.toLowerCase());
      users.push(adminUser); // Add the lean object
    }
    // Note: Admin creation is handled in seedDatabase to ensure it happens first if missing
  }

  // --- Process TEST_USERS_DATA (excluding admin if already handled) ---
  for (const data of TEST_USERS_DATA) {
    // Skip if email is already processed (e.g., the admin user)
    if (usedEmails.has(data.email.toLowerCase())) continue;

    let user = await User.findOne({ email: data.email.toLowerCase() }); // Find full document this time if needed
    if (!user) {
      logger.info(`Creating test user: ${data.email} (${data.role})`);

      // *** Generate username BEFORE creating the user object ***
      const username = await generateUniqueUsername(
        data.firstName, // Pass actual first name
        data.lastName, // Pass actual last name
        User // Pass the User model
      );
      // ********************************************************

      user = new User({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        password: data.password, // Will be hashed by pre-save hook
        role: data.role,
        username: username, // Assign the generated username
        isEmailVerified: true,
        isPhoneVerified: maybe(0.7),
        profilePicture: { url: faker.image.avatarGitHub() },
        bio: faker.person.bio(),
        createdAt: getRandomDate(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date()
        ),
        lastLogin: getRandomDate(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          new Date()
        ),
        interests: [],
      });
      try {
        await user.save();
        logger.info(`--> Created test user with username: ${username}`);
      } catch (error) {
        logger.error(
          `Failed to create test user ${data.email}: ${error.message}`
        );
        continue; // Skip to next test user on failure
      }
    } else {
      logger.info(`Found existing test user: ${user.email}`);
      // Optional: Check if existing test user lacks a username and add one
      if (!user.username) {
        try {
          const existingUsername = await generateUniqueUsername(
            user.firstName,
            user.lastName,
            User
          );
          await User.updateOne(
            { _id: user._id },
            { $set: { username: existingUsername } }
          );
          logger.info(
            `--> Added missing username to existing test user ${user.email}: ${existingUsername}`
          );
          user.username = existingUsername; // Update the Mongoose document
        } catch (updateError) {
          logger.error(
            `--> Failed to add missing username to existing test user ${user.email}: ${updateError.message}`
          );
        }
      }
    }
    users.push(user); // Add the Mongoose document or lean object
    usedEmails.add(user.email.toLowerCase());
  }
  logger.info(
    `Processed ${TEST_USERS_DATA.length} test users (found or created).`
  );

  // --- Process Randomly Generated Users ---
  const neededRegularUsers = count - users.length;
  let createdRegularUsers = 0;
  let assignedRoles = { ...rolesToAssign };

  while (createdRegularUsers < neededRegularUsers && users.length < count) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet
      .email({ firstName, lastName, provider: "example.net" })
      .toLowerCase();

    if (usedEmails.has(email)) continue;

    // *** Generate username BEFORE creating the user object ***
    const username = await generateUniqueUsername(
      firstName, // Pass actual first name
      lastName, // Pass actual last name
      User // Pass the User model
    );
    // ********************************************************

    let role = "user";
    const availableRoles = Object.keys(assignedRoles).filter(
      (r) => assignedRoles[r] > 0
    );
    if (availableRoles.length > 0) {
      const assignedRole = pickRandom(availableRoles);
      role = assignedRole;
      assignedRoles[assignedRole]--;
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password: "password123", // Will be hashed by pre-save hook
      role,
      username: username, // Assign the generated username
      isEmailVerified: maybe(0.8),
      isPhoneVerified: maybe(0.4),
      profilePicture: { url: faker.image.avatarGitHub() },
      bio: maybe(0.7) ? faker.person.bio() : "",
      address: maybe(0.5)
        ? { country: faker.location.country(), city: faker.location.city() }
        : {},
      skills: maybe(0.6) ? getRandomSubset(COMMON_TAGS, 3, 8) : [],
      socialLinks: maybe(0.5)
        ? {
            twitter: `https://twitter.com/${faker.internet.username()}`,
            linkedin: maybe(0.7)
              ? `https://linkedin.com/in/${faker.internet.username()}`
              : null,
            github: maybe(0.4)
              ? `https://github.com/${faker.internet.username()}`
              : null,
            website: maybe(0.3) ? faker.internet.url() : null,
          }
        : {},
      createdAt: getRandomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      lastLogin: getRandomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      interests: [],
    });

    try {
      await user.save();
      users.push(user); // Add the saved user document
      usedEmails.add(email);
      createdRegularUsers++;
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.username) {
        logger.warn(
          `Username collision during save for base ${firstName}.${lastName} (Username: ${username}). Skipping user.`,
          error
        );
      } else if (error.code === 11000 && error.keyPattern?.email) {
        logger.warn(
          `Duplicate email encountered during save: ${email}. Skipping user.`,
          error
        );
      } else {
        // Log other errors
        logger.error(
          `Failed to create user ${email} (Username: ${username}): ${error.message}`,
          error
        );
      }
    }
  }
  logger.info(`Created ${createdRegularUsers} random users.`);
  logger.info(`Found/created ${users.length} total users in this phase.`);
  // Return the array of Mongoose documents/lean objects collected
  // Note: Depending on subsequent usage, might need to ensure all are full documents.
  // Fetching all users again before returning might be safest if full docs are needed.
  // For now, returning the mixed array.
  return users;
}

// --- Profile Creation Functions --- (Assumed correct, no changes)
async function createStartupProfile(user) {
  return {
    companyName: faker.company.name(),
    tagline: faker.company.catchPhrase(),
    industry: pickRandom(INDUSTRIES),
    categories: [{ name: pickRandom(INDUSTRIES), primary: true }],
    fundingStage: pickRandom(FUNDING_STAGES),
    companySize: pickRandom(COMPANY_SIZES),
    yearFounded: faker.number.int({ min: 2010, max: new Date().getFullYear() }),
    website: faker.internet.url({ appendSlash: false }),
    description: faker.lorem.paragraphs(2),
    location: {
      country: faker.location.country(),
      city: faker.location.city(),
      remote: maybe(0.3),
    },
    funding: { stage: pickRandom(FUNDING_STAGES), seeking: maybe(0.6) },
    team: { size: faker.number.int({ min: 1, max: 50 }), hiring: maybe(0.5) },
  };
}
async function createInvestorProfile(user) {
  return {
    investorType: pickRandom([
      "Angel Investor",
      "Venture Capitalist",
      "Seed Fund",
    ]),
    investmentFocus: getRandomSubset(INDUSTRIES, 1, 3).map((cat) => ({
      category: cat,
      strength: faker.number.int({ min: 5, max: 10 }),
    })),
    investmentRange: {
      min: faker.number.int({ min: 10000, max: 100000 }),
      max: faker.number.int({ min: 100000, max: 1000000 }),
    },
    companyName: maybe(0.7)
      ? faker.company.name() + " Ventures"
      : "Individual Investor",
    industry: "Finance",
    investmentPortfolio: Array.from({
      length: faker.number.int({ min: 2, max: 8 }),
    }).map(() => ({
      companyName: faker.company.name(),
      industry: pickRandom(INDUSTRIES),
      stage: pickRandom(VALID_INVESTOR_PORTFOLIO_STAGES),
      investmentDate: getRandomDate(
        new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      active: maybe(0.8),
    })),
    location: {
      country: faker.location.country(),
      city: faker.location.city(),
    },
    website: maybe(0.8) ? faker.internet.url() : undefined,
    preferredStages: getRandomSubset(VALID_INVESTOR_PREFERRED_STAGES, 1, 4),
    investmentThesis: maybe(0.6) ? faker.lorem.paragraph() : undefined,
  };
}
async function createAgencyProfile(user) {
  const companyName = faker.company.name() + " Agency";
  return {
    companyName: companyName,
    industry: pickRandom(["Marketing", "Design", "Development", "Consulting"]),
    services: getRandomSubset(
      [
        "Web Development",
        "UI/UX Design",
        "Branding",
        "SEO",
        "Content Marketing",
        "Mobile App Development",
      ],
      2,
      5
    ).map((s) => ({ name: s, category: pickRandom(INDUSTRIES) })),
    companySize: pickRandom(COMPANY_SIZES.slice(0, 4)),
    yearFounded: faker.number.int({ min: 2005, max: new Date().getFullYear() }),
    website: faker.internet.url({ appendSlash: false }),
    description: faker.lorem.paragraphs(2),
    location: {
      country: faker.location.country(),
      city: faker.location.city(),
    },
    portfolio: Array.from({
      length: faker.number.int({ min: 3, max: 10 }),
    }).map(() => ({
      title: faker.commerce.productName() + " Project",
      clientName: faker.company.name(),
      description: faker.lorem.sentence(),
      technologies: getRandomSubset(COMMON_TAGS, 3, 6),
    })),
  };
}
async function createFreelancerProfile(user) {
  const skills = getRandomSubset(COMMON_TAGS, 3, 10);
  return {
    skills: skills,
    specializations: getRandomSubset(skills, 1, 3),
    experience: pickRandom(["Intermediate", "Advanced", "Expert"]),
    yearsOfExperience: faker.number.int({ min: 2, max: 15 }),
    hourlyRate: maybe(0.8)
      ? { amount: faker.number.int({ min: 40, max: 250 }), currency: "USD" }
      : undefined,
    availability: pickRandom(["Full-time", "Part-time", "Flexible"]),
    portfolio: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }).map(
      () => ({
        title: faker.commerce.productName() + " Work",
        description: faker.lorem.sentence(),
        technologies: getRandomSubset(skills, 2, 5),
        url: maybe(0.5) ? faker.internet.url() : undefined,
      })
    ),
  };
}
async function createJobseekerProfile(user) {
  const skills = getRandomSubset(COMMON_TAGS, 4, 12);
  return {
    jobTitle: faker.person.jobTitle(),
    experience: pickRandom(EXPERIENCE_LEVELS),
    skills: skills,
    education: maybe(0.9)
      ? [
          {
            institution: faker.company.name() + " University",
            degree: faker.person.jobDescriptor() + " Degree",
            fieldOfStudy: faker.person.jobArea(),
            startYear: faker.number.int({ min: 2005, max: 2018 }),
            endYear: faker.number.int({ min: 2019, max: 2023 }),
          },
        ]
      : [],
    workExperience: maybe(0.8)
      ? [
          {
            company: faker.company.name(),
            position: faker.person.jobTitle(),
            description: faker.lorem.sentence(),
            startDate: getRandomDate(
              new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
              new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000)
            ),
            endDate: maybe(0.7)
              ? getRandomDate(
                  new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000),
                  new Date()
                )
              : undefined,
            current: maybe(0.3),
          },
        ]
      : [],
    preferredJobTypes: getRandomSubset(JOB_TYPES, 1, 3),
    preferredLocations: maybe(0.4)
      ? [faker.location.city(), "Remote"]
      : ["Remote"],
    resumeUrl: maybe(0.6) ? faker.internet.url() : undefined,
  };
}

// seedRoleSpecificData (Assumed correct, no changes)
async function seedRoleSpecificData(users) {
  logger.info("Creating/linking role-specific profiles...");
  const roleModels = {
    startupOwner: Startup,
    investor: Investor,
    agency: Agency,
    freelancer: Freelancer,
    jobseeker: Jobseeker,
    maker: Freelancer,
  };
  const roleCreationFunctions = {
    startupOwner: createStartupProfile,
    investor: createInvestorProfile,
    agency: createAgencyProfile,
    freelancer: createFreelancerProfile,
    jobseeker: createJobseekerProfile,
    maker: createFreelancerProfile,
  };
  let profilesLinked = 0;
  const userDocs = users.filter((u) => u?._id); // Ensure we only process valid user objects/docs

  const promises = userDocs.map(async (user) => {
    // Ensure user is a full Mongoose document for potential updates
    let userDoc =
      user instanceof mongoose.Model ? user : await User.findById(user._id);
    if (!userDoc) {
      logger.warn(
        `User ${user._id || user.email} not found in DB for role specific data.`
      );
      return;
    }

    const role = userDoc.role;
    if (roleModels[role] && roleCreationFunctions[role]) {
      try {
        const ProfileModel = roleModels[role];
        const existingProfile = await ProfileModel.findOne({
          user: userDoc._id,
        })
          .select("_id")
          .lean();
        let profileId = existingProfile?._id;
        let isNewProfile = false;

        if (!existingProfile) {
          const profileData = await roleCreationFunctions[role](userDoc); // Pass userDoc
          const profile = new ProfileModel({
            ...profileData,
            user: userDoc._id,
          });
          await profile.save();
          profileId = profile._id;
          isNewProfile = true;
        }

        if (profileId) {
          let userNeedsUpdate = false;
          if (!userDoc.roleDetails) userDoc.roleDetails = {}; // Initialize if missing

          if (
            !userDoc.roleDetails[role] ||
            !userDoc.roleDetails[role].equals(profileId)
          ) {
            userDoc.roleDetails[role] = profileId;
            userDoc.markModified("roleDetails"); // Mark nested object as modified
            userNeedsUpdate = true;
          }

          // Add secondary roles
          if (maybe(0.1) && role !== "admin" && role !== "user") {
            const potentialSecondary = VALID_SECONDARY_ROLES.filter(
              (r) => r !== role
            );
            if (potentialSecondary.length > 0) {
              const secondaryRole = pickRandom(potentialSecondary);
              if (!userDoc.secondaryRoles) userDoc.secondaryRoles = []; // Initialize if missing

              if (!userDoc.secondaryRoles.includes(secondaryRole)) {
                userDoc.secondaryRoles.push(secondaryRole);
                // Mongoose should detect change in array of primitives
                userNeedsUpdate = true;
              }
            }
          }

          if (userNeedsUpdate) {
            await userDoc.save();
            profilesLinked++;
            // if (isNewProfile) logger.debug(`Created and linked ${role} profile for ${userDoc.email}`);
            // else logger.debug(`Linked existing ${role} profile for ${userDoc.email}`);
          }
        }
      } catch (error) {
        logger.error(
          `Failed process for ${role} profile for ${userDoc.email}: ${error.message}\n${error.stack}`
        );
      }
    }
  });
  await Promise.all(promises);
  logger.info(
    `Finished creating/linking role profiles (${profilesLinked} links updated/created).`
  );
}

// seedCategoriesAndTags (Assumed correct, no changes)
async function seedCategoriesAndTags(adminUser) {
  logger.info("Creating categories and tags...");
  if (!adminUser || !adminUser._id) {
    logger.error(
      "Cannot seed categories/tags without a valid admin user reference."
    );
    return { categories: [], subcategories: [], tags: [] };
  }
  const categories = [];
  const tags = [];

  // Seed Tags
  for (const tagName of COMMON_TAGS) {
    try {
      let tag = await Tag.findOne({ name: tagName });
      if (!tag) {
        tag = new Tag({ name: tagName, createdBy: adminUser._id });
        await tag.save();
      }
      if (!tags.find((t) => t._id.equals(tag._id))) tags.push(tag);
    } catch (error) {
      if (error.code !== 11000)
        logger.error(`Failed to create tag "${tagName}": ${error.message}`);
      else {
        const existingTag = await Tag.findOne({ name: tagName });
        if (existingTag && !tags.find((t) => t._id.equals(existingTag._id)))
          tags.push(existingTag);
      }
    }
  }
  logger.info(`Created/Found ${tags.length} tags.`);

  // Seed Top-Level Categories
  const categoryNamesData = [
    {
      name: "Analytics",
      color: "#6366F1",
      iconName: "heroicons-outline:chart-bar",
    },
    { name: "AI/ML", color: "#8B5CF6", iconName: "heroicons-outline:chip" },
    {
      name: "Design",
      color: "#EC4899",
      iconName: "heroicons-outline:color-swatch",
    },
    {
      name: "Developer Tools",
      color: "#F59E0B",
      iconName: "heroicons-outline:code",
    },
    {
      name: "Finance",
      color: "#10B981",
      iconName: "heroicons-outline:currency-dollar",
    },
    {
      name: "Marketing",
      color: "#3B82F6",
      iconName: "heroicons-outline:speakerphone",
    },
    {
      name: "Productivity",
      color: "#EF4444",
      iconName: "heroicons-outline:lightning-bolt",
    },
    {
      name: "Collaboration",
      color: "#06B6D4",
      iconName: "heroicons-outline:user-group",
    },
    {
      name: "E-commerce",
      color: "#F97316",
      iconName: "heroicons-outline:shopping-cart",
    },
    {
      name: "Education",
      color: "#14B8A6",
      iconName: "heroicons-outline:academic-cap",
    },
    { name: "Health", color: "#22C55E", iconName: "heroicons-outline:heart" },
    {
      name: "Entertainment",
      color: "#A855F7",
      iconName: "heroicons-outline:film",
    },
    { name: "Social", color: "#D946EF", iconName: "heroicons-outline:share" },
    {
      name: "Customer Support",
      color: "#84CC16",
      iconName: "heroicons-outline:support",
    },
    { name: "Other", color: "#6B7280", iconName: "heroicons-outline:sparkles" },
  ].slice(0, NUM_CATEGORIES_TOP);
  for (let i = 0; i < categoryNamesData.length; i++) {
    try {
      const catData = categoryNamesData[i];
      let category = await Category.findOne({
        name: catData.name,
        parentCategory: null,
      });
      if (!category) {
        const iconUrl = `https://api.iconify.design/${catData.iconName.replace(
          ":",
          "/"
        )}.svg?color=${catData.color.substring(1)}`;
        category = new Category({
          name: catData.name,
          description: `Explore ${catData.name} products`,
          color: catData.color,
          icon: iconUrl,
          order: i + 1,
          featured: i < 8,
          createdBy: adminUser._id,
          parentCategory: null,
        });
        await category.save();
      }
      if (!categories.find((c) => c._id.equals(category._id)))
        categories.push(category);
    } catch (error) {
      if (error.code !== 11000)
        logger.error(
          `Failed to create category "${categoryNamesData[i].name}": ${error.message}`
        );
      else {
        const existingCategory = await Category.findOne({
          name: categoryNamesData[i].name,
          parentCategory: null,
        });
        if (
          existingCategory &&
          !categories.find((c) => c._id.equals(existingCategory._id))
        )
          categories.push(existingCategory);
      }
    }
  }
  logger.info(`Created/Found ${categories.length} top-level categories.`);

  // Seed Subcategories
  const subcategories = [];
  const subcategoryPotentialNames = [
    "Generative AI",
    "AI Assistants",
    "NLP",
    "Computer Vision",
    "Data Science Platforms",
    "Code Editors",
    "Version Control",
    "Testing Tools",
    "CI/CD",
    "API Tools",
    "Debugging",
    "PaaS",
    "UI Design",
    "UX Design",
    "Prototyping",
    "Wireframing",
    "Design Systems",
    "3D Modeling",
    "Task Management",
    "Note Taking",
    "Time Tracking",
    "Calendar Apps",
    "Focus Tools",
    "Team Chat",
    "Video Conferencing",
    "Project Management",
    "Document Collaboration",
    "Whiteboards",
    "Email Marketing",
    "SEO Tools",
    "Social Media Management",
    "Content Creation",
    "Ad Platforms",
    "Web Analytics",
    "BI Tools",
    "Data Visualization",
    "A/B Testing",
    "Accounting",
    "Invoicing",
    "Expense Tracking",
    "Payments",
    "Crypto",
    "Online Marketplaces",
    "POS Systems",
    "Inventory Management",
    "Shipping Solutions",
  ];
  for (const parentCat of categories) {
    const numSubcats = Math.floor(
      Math.random() * (NUM_SUBCATEGORIES_MAX_PER_CAT + 1)
    );
    const potentialNamesForThisCat = getRandomSubset(
      subcategoryPotentialNames,
      numSubcats,
      numSubcats
    );
    for (const subcatName of potentialNamesForThisCat) {
      try {
        let subcategory = await Category.findOne({
          name: subcatName,
          parentCategory: parentCat._id,
        });
        if (!subcategory) {
          subcategory = new Category({
            name: subcatName,
            description: `${subcatName} tools under ${parentCat.name}`,
            parentCategory: parentCat._id,
            createdBy: adminUser._id,
            color: parentCat.color,
            icon: parentCat.icon,
            order: subcategories.length + 1,
          });
          await subcategory.save();
        }
        if (!subcategories.find((s) => s._id.equals(subcategory._id)))
          subcategories.push(subcategory);
      } catch (error) {
        if (error.code !== 11000)
          logger.error(
            `Failed to create subcategory "${subcatName}" under "${parentCat.name}": ${error.message}`
          );
        else {
          const existingSubcat = await Category.findOne({
            name: subcatName,
            parentCategory: parentCat._id,
          });
          if (
            existingSubcat &&
            !subcategories.find((s) => s._id.equals(existingSubcat._id))
          )
            subcategories.push(existingSubcat);
        }
      }
    }
  }
  logger.info(`Created/Found ${subcategories.length} subcategories.`);

  return { categories, subcategories, tags };
}

// seedProducts (Assumed correct, no changes)
async function seedProducts(users, categoriesAndSubcategories, tags) {
  logger.info(`Creating ${NUM_PRODUCTS_MIN}-${NUM_PRODUCTS_MAX} products...`);
  if (!categoriesAndSubcategories || categoriesAndSubcategories.length === 0) {
    logger.error(
      "Cannot create products: No categories or subcategories found/created."
    );
    return [];
  }
  const products = [];
  const totalProducts = faker.number.int({
    min: NUM_PRODUCTS_MIN,
    max: NUM_PRODUCTS_MAX,
  });
  const makers = users.filter(
    (u) =>
      u &&
      (u.role === "maker" || u.role === "startupOwner" || u.role === "admin")
  );
  if (makers.length === 0) {
    logger.error("No users with eligible roles found to create products.");
    return [];
  }

  for (let i = 0; i < totalProducts; i++) {
    const maker = pickRandom(makers);
    const category = pickRandom(categoriesAndSubcategories);
    if (!category || !maker?._id) {
      logger.warn(
        `Skipping product creation - category or maker selection failed (Iteration ${i})`
      );
      continue;
    }
    const productTags = getRandomSubset(
      tags.map((t) => t.name),
      2,
      MAX_TAGS_PER_PRODUCT
    );
    const productName = faker.commerce.productName();
    const createdAt = getRandomDate(
      new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      new Date()
    );
    const launchedAt = maybe(0.8)
      ? createdAt
      : getRandomDate(createdAt, new Date());
    const pricingType = pickRandom(PRICING_TYPES);
    let pricing = { type: pricingType };
    if (
      pricingType === "paid" ||
      pricingType === "subscription" ||
      pricingType === "freemium"
    ) {
      pricing.amount = faker.number.int({ min: 5, max: 100 });
      pricing.currency = pickRandom(CURRENCIES);
      if (pricingType === "subscription")
        pricing.interval = pickRandom(["month", "year"]);
      if (maybe(0.2)) {
        pricing.discounted = true;
        pricing.originalAmount =
          pricing.amount + faker.number.int({ min: 5, max: 50 });
      }
    } else if (pricingType === "contact") {
      pricing.contactInstructions = "Please reach out for custom pricing.";
      pricing.contactEmail = maybe(0.6) ? faker.internet.email() : undefined;
    }

    const gallery = Array.from({
      length: faker.number.int({ min: 1, max: MAX_GALLERY_IMAGES_PER_PRODUCT }),
    }).map((_, idx) => ({
      url: faker.image.urlPicsumPhotos({
        width: 1280,
        height: 720,
        random: true,
      }),
      caption: maybe(0.5) ? faker.lorem.sentence(5) : undefined,
      order: idx,
    }));

    const links = {
      website: faker.internet.url(),
      demo: maybe(0.4) ? faker.internet.url() : undefined,
      github: maybe(0.3)
        ? `https://github.com/${faker.internet.username()}/${slugify(
            productName,
            { lower: true, strict: true }
          )}`
        : undefined,
      appStore: maybe(0.1)
        ? `https://apps.apple.com/us/app/${slugify(productName, {
            lower: true,
            strict: true,
          })}/id${faker.string.numeric(10)}`
        : undefined,
      playStore: maybe(0.1)
        ? `https://play.google.com/store/apps/details?id=com.${faker.lorem.word()}.${slugify(
            productName,
            { lower: true, strict: true }
          )}`
        : undefined,
    };
    const seoDesc = faker.lorem.sentence(
      faker.number.int({ min: 15, max: 25 })
    );
    const metadata = {
      seo: {
        title:
          `${productName} - ${faker.company.catchPhraseDescriptor()}`.substring(
            0,
            60
          ),
        description: seoDesc.substring(0, 160),
      },
    };

    const productData = {
      name: productName,
      tagline: faker.company.catchPhrase(),
      description: faker.lorem.paragraphs(faker.number.int({ min: 2, max: 4 })),
      maker: maker._id,
      thumbnail:
        gallery[0]?.url ||
        faker.image.urlPicsumPhotos({ width: 600, height: 400 }),
      gallery: gallery,
      category: category._id,
      categoryName: category.name,
      parentCategory: category.parentCategory,
      pricing: pricing,
      links: links,
      status: pickRandom([
        "Published",
        "Published",
        "Published",
        "Draft",
        "Archived",
      ]),
      featured: maybe(0.15),
      tags: productTags,
      views: { count: 0, unique: 0, history: [] },
      launchedAt: launchedAt,
      createdAt: createdAt,
      metadata: metadata,
      moderation: { status: "approved" },
    };

    try {
      const product = new Product(productData);
      await product.save(); // Relies on pre-save for slug
      products.push(product);
    } catch (error) {
      logger.error(
        `Failed to create product "${productName}": ${error.message} ${error.stack}`
      );
    }
  }
  logger.info(`Created ${products.length} products.`);
  return products;
}

// seedJobs, seedProjects (Assumed correct, no changes)
async function seedJobs(users) {
  logger.info(`Creating ${NUM_JOBS} jobs...`);
  const jobs = [];
  const posters = users.filter(
    (u) =>
      u &&
      (u.role === "startupOwner" || u.role === "agency" || u.role === "admin")
  );
  if (posters.length === 0) {
    logger.warn("No eligible users found to create jobs.");
    return [];
  }
  let createdJobsCount = 0;
  while (createdJobsCount < NUM_JOBS && posters.length > 0) {
    // Added posters.length check
    const poster = pickRandom(posters);
    if (!poster?._id) continue; // Skip if poster is invalid
    const jobTitle = faker.person.jobTitle();
    let companyDetails = {
      name: faker.company.name(),
      logo: faker.image.avatarGitHub(),
      website: faker.internet.url(),
      size: pickRandom(COMPANY_SIZES),
      industry: pickRandom(INDUSTRIES),
    };
    if (poster.role === "startupOwner" || poster.role === "agency") {
      try {
        const ProfileModel = poster.role === "startupOwner" ? Startup : Agency;
        const profile = await ProfileModel.findOne({ user: poster._id }).lean();
        if (profile) {
          companyDetails.name = profile.companyName || companyDetails.name;
          companyDetails.website = profile.website || companyDetails.website;
          companyDetails.size = profile.companySize || companyDetails.size;
          companyDetails.industry = profile.industry || companyDetails.industry;
          // companyDetails.logo = profile.logo?.url || companyDetails.logo; // If logo exists on profile
        }
      } catch (profileError) {
        logger.warn(
          `Could not fetch profile for poster ${poster.email} for job seeding: ${profileError.message}`
        );
      }
    }
    const jobData = {
      title: jobTitle,
      company: companyDetails,
      location: maybe(0.4) ? faker.location.city() : "Remote",
      locationType: pickRandom(["Remote", "On-site", "Hybrid"]),
      jobType: pickRandom(JOB_TYPES),
      description: faker.lorem.paragraphs(3),
      requirements: Array.from({
        length: faker.number.int({ min: 3, max: 6 }),
      }).map(() => faker.lorem.sentence(5)),
      responsibilities: Array.from({
        length: faker.number.int({ min: 3, max: 6 }),
      }).map(() => faker.lorem.sentence(5)),
      skills: getRandomSubset(COMMON_TAGS, 4, 8),
      experienceLevel: pickRandom(EXPERIENCE_LEVELS),
      salary: maybe(0.6)
        ? {
            min: faker.number.int({ min: 40000, max: 80000 }),
            max: faker.number.int({ min: 80000, max: 150000 }),
            currency: "USD",
            period: "Yearly",
            isVisible: maybe(0.8),
          }
        : undefined,
      applicationUrl: maybe(0.7) ? faker.internet.url() : undefined,
      applicationEmail: maybe(0.3) ? faker.internet.email() : undefined,
      status: pickRandom(["Published", "Published", "Draft"]),
      featured: maybe(0.1),
      poster: poster._id,
      expiresAt: maybe(0.8)
        ? getRandomDate(
            new Date(),
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          )
        : undefined,
      createdAt: getRandomDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    };
    try {
      const job = new Job(jobData);
      await job.save();
      jobs.push(job);
      createdJobsCount++;
    } catch (error) {
      logger.error(`Failed to create job "${jobTitle}": ${error.message}`);
    }
  }
  logger.info(`Created ${jobs.length} jobs.`);
  return jobs;
}
async function seedProjects(users) {
  const numProjects = faker.number.int({
    min: NUM_PROJECTS_MIN,
    max: NUM_PROJECTS_MAX,
  });
  logger.info(`Creating ${numProjects} projects...`);
  const projects = [];
  const owners = users.filter(
    (u) =>
      u &&
      ["freelancer", "agency", "jobseeker", "startupOwner", "maker"].includes(
        u.role
      )
  );
  if (owners.length === 0) {
    logger.warn("No eligible users found to create projects.");
    return [];
  }
  let createdProjectsCount = 0;
  while (createdProjectsCount < numProjects && owners.length > 0) {
    // Added owners.length check
    const owner = pickRandom(owners);
    if (!owner?._id) continue; // Skip if owner is invalid
    const projectTitle = faker.commerce.productName() + " Showcase";
    const projectData = {
      title: projectTitle,
      description: faker.lorem.paragraphs(2),
      owner: owner._id,
      ownerType: owner.role === "maker" ? "freelancer" : owner.role, // Simplify maker role
      role: faker.person.jobTitle(),
      client: maybe(0.6)
        ? { name: faker.company.name(), industry: pickRandom(INDUSTRIES) }
        : undefined,
      technologies: getRandomSubset(COMMON_TAGS, 3, 7),
      skills: getRandomSubset(COMMON_TAGS, 3, 7),
      startDate: getRandomDate(
        new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
        new Date()
      ),
      endDate: maybe(0.7)
        ? getRandomDate(
            new Date(Date.now() - 1 * 365 * 24 * 60 * 60 * 1000),
            new Date()
          )
        : undefined,
      current: maybe(0.15),
      thumbnail: faker.image.urlPicsumPhotos({ width: 600, height: 400 }),
      gallery: Array.from({ length: faker.number.int({ min: 0, max: 4 }) }).map(
        () => ({
          url: faker.image.urlPicsumPhotos({ width: 1024, height: 768 }),
          caption: maybe(0.4) ? faker.lorem.sentence(4) : undefined,
        })
      ),
      challenge: maybe(0.5) ? faker.lorem.paragraph() : undefined,
      solution: maybe(0.5) ? faker.lorem.paragraph() : undefined,
      results: maybe(0.5) ? faker.lorem.paragraph() : undefined,
      projectUrl: maybe(0.4) ? faker.internet.url() : undefined,
      featured: maybe(0.1),
      visibility: pickRandom(["public", "public", "unlisted"]),
      createdAt: getRandomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date()
      ),
    };
    try {
      const project = new Project(projectData);
      await project.save();
      projects.push(project);
      createdProjectsCount++;
    } catch (error) {
      logger.error(
        `Failed to create project "${projectTitle}": ${error.message}`
      );
    }
  }
  logger.info(`Created ${projects.length} projects.`);
  return projects;
}

// seedInteractions (Assumed correct, no changes)
async function seedInteractions(users, products) {
  logger.info(
    "Creating interactions (views, upvotes, bookmarks, comments, rec interactions)..."
  );
  if (!users || users.length === 0 || !products || products.length === 0) {
    logger.warn(
      "Cannot seed interactions without valid users and products arrays."
    );
    return {
      viewsList: [],
      upvotesList: [],
      bookmarksList: [],
      commentsList: [],
      recInteractionsList: [],
    };
  }

  const viewsList = [];
  const upvotesList = [];
  const bookmarksList = [];
  const commentsList = [];
  const recInteractionsList = [];
  const productInteractionTargets = new Map();
  const now = new Date();

  // Prepare product targets
  products.forEach((p) => {
    if (!p?._id) return; // Skip invalid products
    const ageInDays = Math.max(
      1,
      (now.getTime() - (p.createdAt || now).getTime()) / (1000 * 60 * 60 * 24)
    );
    const popularityFactor = p.featured ? 1.5 : 1.0;
    const recencyFactor = 1 / Math.log10(ageInDays + 10);
    const targetViews = Math.floor(
      faker.number.int({ min: 5, max: 1000 }) *
        popularityFactor *
        recencyFactor *
        0.8
    );
    const targetUpvotes = Math.floor(
      targetViews * faker.number.float({ min: 0.05, max: 0.3 })
    );
    const targetBookmarks = Math.floor(
      targetUpvotes * faker.number.float({ min: 0.1, max: 0.5 })
    );
    const targetComments = Math.floor(
      targetUpvotes * faker.number.float({ min: 0.02, max: 0.15 })
    );
    productInteractionTargets.set(p._id.toString(), {
      targetViews: Math.max(1, targetViews),
      targetUpvotes: Math.max(0, targetUpvotes),
      targetBookmarks: Math.max(0, targetBookmarks),
      targetComments: Math.max(0, targetComments),
      currentViews: 0,
      currentUpvotes: 0,
      currentBookmarks: 0,
      currentComments: 0,
      usersWhoViewed: new Set(),
      usersWhoUpvoted: new Set(),
      usersWhoBookmarked: new Set(),
      usersWhoCommented: new Set(),
      productCreatedAt: p.createdAt || now,
    });
  });

  const interactionSources = [
    "direct",
    "search",
    "social",
    "email",
    "referral",
    "recommendation_feed",
    "recommendation_similar",
    "internal_navigation",
    "unknown",
  ];
  const recommendationTypes = [
    "personalized",
    "trending",
    "new",
    "category",
    "tag",
    "history",
    "collaborative",
    "maker",
    "similar",
    "discovery",
    "unknown",
    "feed",
    "popular",
  ];

  // Generate interactions per user
  for (const user of users) {
    if (!user?._id) continue; // Skip invalid users
    const userIdStr = user._id.toString();
    const numInteractions = faker.number.int({
      min: 10,
      max: MAX_INTERACTIONS_PER_USER,
    });
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random()); // Shuffle products per user
    let userInteractionCount = 0;

    for (let i = 0; i < numInteractions && i < shuffledProducts.length; i++) {
      if (userInteractionCount >= MAX_INTERACTIONS_PER_USER) break;
      const product = shuffledProducts[i];
      if (!product?._id) continue; // Skip invalid product from shuffle
      const productIdStr = product._id.toString();
      const targets = productInteractionTargets.get(productIdStr);
      if (!targets) continue; // Skip if product targets weren't set up
      // Skip if user is the maker (high probability)
      if (product.maker?.toString() === userIdStr && maybe(0.8)) continue;
      // Skip if product is already "saturated" with interactions (reduces loops)
      if (
        targets.currentViews > targets.targetViews * 1.5 &&
        targets.currentUpvotes > targets.targetUpvotes * 1.5 &&
        maybe(0.95)
      )
        continue;

      const interactionDate = getRandomDate(targets.productCreatedAt, now);
      const source = pickRandom(interactionSources);
      const recType = source.startsWith("recommendation")
        ? pickRandom(recommendationTypes)
        : "direct";

      // --- Create View ---
      if (targets.currentViews < targets.targetViews * 1.5 && maybe(0.85)) {
        const view = new View({
          product: product._id,
          user: user._id,
          sessionId: faker.string.alphanumeric(12),
          source: source,
          referrer: source === "referral" ? faker.internet.url() : undefined,
          userAgent: faker.internet.userAgent(),
          isBot: maybe(0.02),
          country: faker.location.countryCode(),
          device: pickRandom(["desktop", "mobile", "tablet", "other"]),
          os: pickRandom(["Windows", "MacOS", "Linux", "iOS", "Android"]),
          browser: pickRandom(["Chrome", "Firefox", "Safari", "Edge", "Other"]),
          viewDuration: maybe(0.8)
            ? faker.number.int({ min: 5, max: 300 })
            : undefined,
          engagement: {
            scrollDepth: maybe(0.6)
              ? faker.number.int({ min: 10, max: 100 })
              : undefined,
            timeToFirstInteraction: maybe(0.5)
              ? faker.number.int({ min: 100, max: 5000 })
              : undefined,
          },
          createdAt: interactionDate,
        });
        viewsList.push(view);
        targets.currentViews++;
        targets.usersWhoViewed.add(userIdStr);
        userInteractionCount++;
        recInteractionsList.push(
          new RecommendationInteraction({
            user: user._id,
            product: product._id,
            recommendationType: recType,
            interactionType: "view",
            position: source.startsWith("recommendation")
              ? faker.number.int({ min: 0, max: 20 })
              : undefined,
            timestamp: interactionDate,
            metadata: { score: Math.random(), source: source },
          })
        );

        const interestMatch = Math.random(); // Simulate user interest level

        // --- Create Upvote (based on view) ---
        if (
          targets.currentUpvotes < targets.targetUpvotes * 1.2 &&
          maybe(0.1 + interestMatch * 0.4) &&
          !targets.usersWhoUpvoted.has(userIdStr)
        ) {
          const upvoteDate = getRandomDate(interactionDate, now);
          upvotesList.push(
            new Upvote({
              user: user._id,
              product: product._id,
              createdAt: upvoteDate,
            })
          );
          targets.currentUpvotes++;
          targets.usersWhoUpvoted.add(userIdStr);
          userInteractionCount++;
          recInteractionsList.push(
            new RecommendationInteraction({
              user: user._id,
              product: product._id,
              recommendationType: recType,
              interactionType: "upvote",
              timestamp: upvoteDate,
            })
          );

          // --- Create Comment (based on upvote) ---
          if (
            targets.currentComments < targets.targetComments * 1.2 &&
            maybe(0.2 + interestMatch * 0.3) &&
            !targets.usersWhoCommented.has(userIdStr)
          ) {
            const commentDate = getRandomDate(upvoteDate, now);
            const existingProductComments = commentsList.filter(
              (c) => c.product.toString() === productIdStr && !c.parent
            );
            const parentComment =
              maybe(0.3) && existingProductComments.length > 0
                ? pickRandom(existingProductComments)
                : null;
            const comment = new Comment({
              content: faker.lorem.sentence(
                faker.number.int({ min: 5, max: 25 })
              ),
              user: user._id,
              product: product._id,
              parent: parentComment?._id,
              rootParent: parentComment
                ? parentComment.rootParent || parentComment._id
                : null,
              depth: parentComment ? parentComment.depth + 1 : 0,
              replyingTo: parentComment?.user,
              likes: { count: 0, users: [] },
              createdAt: commentDate,
            });
            commentsList.push(comment);
            targets.currentComments++;
            targets.usersWhoCommented.add(userIdStr);
            userInteractionCount++;
            recInteractionsList.push(
              new RecommendationInteraction({
                user: user._id,
                product: product._id,
                recommendationType: recType,
                interactionType: "comment",
                timestamp: commentDate,
              })
            );
          }
        }

        // --- Create Bookmark (based on view) ---
        if (
          targets.currentBookmarks < targets.targetBookmarks * 1.2 &&
          maybe(0.05 + interestMatch * 0.3) &&
          !targets.usersWhoBookmarked.has(userIdStr)
        ) {
          const bookmarkDate = getRandomDate(interactionDate, now);
          bookmarksList.push(
            new Bookmark({
              user: user._id,
              product: product._id,
              createdAt: bookmarkDate,
            })
          );
          targets.currentBookmarks++;
          targets.usersWhoBookmarked.add(userIdStr);
          userInteractionCount++;
          recInteractionsList.push(
            new RecommendationInteraction({
              user: user._id,
              product: product._id,
              recommendationType: recType,
              interactionType: "bookmark",
              timestamp: bookmarkDate,
            })
          );
        }
      }
    }
  }

  // Add likes to comments
  commentsList.forEach((comment) => {
    const likers = getRandomSubset(
      users.filter(
        (u) => u?._id && u._id.toString() !== comment.user.toString()
      ),
      0,
      Math.min(15, users.length - 1)
    ); // Exclude commenter
    if (likers.length > 0) {
      comment.likes.users = likers.map((u) => u._id);
      comment.likes.count = likers.length;
    }
  });

  logger.info(
    `Generated ${viewsList.length} views, ${upvotesList.length} upvotes, ${bookmarksList.length} bookmarks, ${commentsList.length} comments, ${recInteractionsList.length} rec interactions.`
  );

  // Batch insert interactions
  const BATCH_SIZE = 2000;
  logger.info("Batch inserting interactions...");
  const insertInBatches = async (Model, data, modelName) => {
    if (data.length === 0) return;
    logger.info(`Inserting ${data.length} ${modelName}...`);
    let promises = [];
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE);
      promises.push(
        Model.insertMany(batch, { ordered: false }).catch((err) => {
          // Log non-duplicate errors, or specific duplicate errors if needed
          if (err.code !== 11000) {
            // 11000 is duplicate key error
            logger.error(
              `${modelName} batch insert error (Batch ${
                Math.floor(i / BATCH_SIZE) + 1
              }): ${err.message}`
            );
          } else if (
            Model.modelName !== "Upvote" &&
            Model.modelName !== "Bookmark"
          ) {
            // Log duplicate errors for models other than Upvote/Bookmark if they are unexpected
            logger.warn(
              `${modelName} batch insert contained unexpected duplicates (Batch ${
                Math.floor(i / BATCH_SIZE) + 1
              }).`
            );
          }
          // For Upvote/Bookmark duplicates are expected due to random generation, so might not log them unless debugging
        })
      );
      // Process promises in smaller chunks to avoid overwhelming memory/network
      if (promises.length >= 5) {
        // Adjust batch processing size as needed
        await Promise.all(promises);
        promises = [];
        await new Promise((resolve) => setTimeout(resolve, 20)); // Short pause
      }
    }
    await Promise.all(promises); // Process any remaining promises
    logger.info(`Finished inserting ${modelName}.`);
    await new Promise((resolve) => setTimeout(resolve, 50)); // Short pause between models
  };

  await insertInBatches(View, viewsList, "views");
  await insertInBatches(Upvote, upvotesList, "upvotes");
  await insertInBatches(Bookmark, bookmarksList, "bookmarks");
  // Update comment likes before inserting comments (if not already done)
  // This is slightly less efficient than updating in memory before insertMany, but safer if likes depend on other users
  // await Comment.bulkWrite(commentsList.map(c => ({ updateOne: { filter: { _id: c._id }, update: { $set: { 'likes.count': c.likes.count, 'likes.users': c.likes.users }} } })));
  await insertInBatches(Comment, commentsList, "comments"); // Insert comments (likes might be 0 initially if not updated before)
  await insertInBatches(
    RecommendationInteraction,
    recInteractionsList,
    "recommendation interactions"
  );

  logger.info("Finished inserting interactions.");
  return {
    viewsList,
    upvotesList,
    bookmarksList,
    commentsList,
    recInteractionsList,
  };
}

// updateProductCounts (Assumed correct, no changes)
async function updateProductCounts(products) {
  logger.info("Updating product interaction counts from DB...");
  if (!products || products.length === 0) {
    logger.warn("No products provided to update counts.");
    return;
  }
  let updatedCount = 0;
  const productIds = products.map((p) => p?._id).filter(Boolean); // Get valid IDs

  // Use Promise.allSettled for better error handling across products
  const results = await Promise.allSettled(
    productIds.map(async (productId) => {
      try {
        const [upvoteCount, bookmarkCount, viewCountsAgg, commentCount] =
          await Promise.all([
            Upvote.countDocuments({ product: productId }),
            Bookmark.countDocuments({ product: productId }),
            View.aggregate([
              { $match: { product: productId, isBot: { $ne: true } } },
              {
                $group: {
                  _id: null,
                  totalViews: { $sum: 1 },
                  uniqueViewers: { $addToSet: "$user" },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalViews: 1,
                  uniqueViews: {
                    $size: {
                      $filter: {
                        input: "$uniqueViewers",
                        cond: { $ne: ["$$this", null] },
                      },
                    },
                  },
                },
              }, // Simplified unique count
            ]),
            Comment.countDocuments({ product: productId }),
          ]);

        const viewCounts = viewCountsAgg[0] || {
          totalViews: 0,
          uniqueViews: 0,
        };
        // Add unique count for anonymous users if needed (requires session tracking logic)
        // const uniqueUserViews = viewCounts.uniqueViews;
        // Example: Add 1 if total > unique and some are anonymous
        // const uniqueTotalViews = uniqueUserViews + (viewCounts.totalViews > uniqueUserViews ? 1 : 0);

        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const dailyViewHistory = await View.aggregate([
          {
            $match: {
              product: productId,
              isBot: { $ne: true },
              createdAt: { $gte: sixtyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: { $toDate: "$_id" }, count: 1 } },
        ]);

        await Product.updateOne(
          { _id: productId },
          {
            $set: {
              upvoteCount: upvoteCount || 0,
              bookmarkCount: bookmarkCount || 0,
              commentCount: commentCount || 0,
              "views.count": viewCounts.totalViews || 0,
              "views.unique": viewCounts.uniqueViews || 0, // Use calculated unique user views
              "views.history": dailyViewHistory,
            },
          }
        );
        return { status: "fulfilled", productId }; // Indicate success
      } catch (error) {
        logger.error(
          `Error updating counts for product ${productId}: ${error.message}`
        );
        return { status: "rejected", productId, reason: error.message }; // Indicate failure
      }
    })
  );

  updatedCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.filter((r) => r.status === "rejected").length;

  logger.info(`Updated counts for ${updatedCount} products.`);
  if (failedCount > 0) {
    logger.warn(`Failed to update counts for ${failedCount} products.`);
  }
}

// seedSearchHistory (Assumed correct, no changes)
async function seedSearchHistory(users) {
  logger.info("Creating search history...");
  if (!users || users.length === 0) {
    logger.warn("No users provided for search history seeding.");
    return;
  }
  const searchOperations = [];
  const searchTerms = [
    ...COMMON_TAGS,
    ...INDUSTRIES,
    "best ai tools",
    "project management software",
    "free design assets",
    "remote developer jobs",
  ];
  let generatedCount = 0;

  for (const user of users) {
    if (!user?._id || !user.createdAt) continue; // Need user ID and creation date
    if (maybe(0.7)) {
      const numSearches = faker.number.int({
        min: 1,
        max: MAX_SEARCHES_PER_USER,
      });
      const userSearchesMap = new Map();

      for (let i = 0; i < numSearches; i++) {
        const query = pickRandom(searchTerms);
        const searchType = pickRandom([
          "all",
          "products",
          "jobs",
          "projects",
          "users",
        ]);
        const key = `${user._id.toString()}-${query}-${searchType}`;
        const searchDate = getRandomDate(user.createdAt, new Date()); // Use user's createdAt as start
        const incrementCount = faker.number.int({ min: 1, max: 5 });

        if (!userSearchesMap.has(key)) {
          userSearchesMap.set(key, {
            updateOne: {
              filter: { user: user._id, query: query, type: searchType },
              update: {
                $set: { lastSearchedAt: searchDate },
                $inc: { count: incrementCount },
                $setOnInsert: {
                  user: user._id,
                  query: query,
                  type: searchType,
                  createdAt: searchDate,
                },
              },
              upsert: true,
            },
          });
        } else {
          const existingOp = userSearchesMap.get(key);
          if (searchDate > existingOp.updateOne.update.$set.lastSearchedAt) {
            existingOp.updateOne.update.$set.lastSearchedAt = searchDate;
          }
          existingOp.updateOne.update.$inc.count += faker.number.int({
            min: 1,
            max: 3,
          });
        }
      }
      searchOperations.push(...Array.from(userSearchesMap.values()));
      generatedCount += userSearchesMap.size;
    }
  }

  if (searchOperations.length >  0) {
    logger.info(
      `Attempting to upsert ${searchOperations.length} search history entries...`
    );
    try {
      const result = await SearchHistory.bulkWrite(searchOperations, {
        ordered: false,
      });
      logger.info(
        `SearchHistory bulkWrite result: ${result.insertedCount} inserted, ${result.matchedCount} matched, ${result.modifiedCount} modified, ${result.upsertedCount} upserted.`
      );
      if (result.hasWriteErrors()) {
        logger.error(
          `SearchHistory bulkWrite finished with ${result.getWriteErrorCount()} write errors.`
        );
        // result.getWriteErrors().forEach(e => logger.error(` - Error code ${e.code}: ${e.errmsg.substring(0, 100)}...`)); // Log details if needed
      }
    } catch (error) {
      logger.error(`Error during SearchHistory bulkWrite: ${error.message}`);
    }
  }
  const finalCount = await SearchHistory.countDocuments();
  logger.info(
    `Finished search history seeding. Total entries now: ${finalCount}.`
  );
}

// seedRecommendations (Assumed correct, no changes)
async function seedRecommendations(users, products) {
  logger.info("Creating/Updating recommendation profiles...");
  if (!users || users.length === 0 || !products || products.length === 0) {
    logger.warn("Cannot seed recommendations without users and products.");
    return;
  }

  const recommendationPromises = [];
  const BATCH_SIZE = 100;
  let processedUsers = 0;

  // Pre-fetch all interactions (consider memory for very large datasets)
  const [allViews, allUpvotes, allBookmarks] = await Promise.all([
    View.find({}, "user product createdAt").lean(),
    Upvote.find({}, "user product createdAt").lean(),
    Bookmark.find({}, "user product createdAt").lean(),
  ]);

  // Build interaction map and product metadata map
  const userInteractionsMap = new Map();
  const addInteraction = (userId, productId, type, date) => {
    if (!userId || !productId) return;
    const userIdStr = userId.toString();
    if (!userInteractionsMap.has(userIdStr))
      userInteractionsMap.set(userIdStr, []);
    userInteractionsMap
      .get(userIdStr)
      .push({ productId: productId.toString(), type, date });
  };
  allViews.forEach((v) =>
    addInteraction(v.user, v.product, "view", v.createdAt)
  );
  allUpvotes.forEach((u) =>
    addInteraction(u.user, u.product, "upvote", u.createdAt)
  );
  allBookmarks.forEach((b) =>
    addInteraction(b.user, b.product, "bookmark", b.createdAt)
  );

  const productMetaMap = new Map(
    products
      .filter((p) => p?._id)
      .map((p) => [
        p._id.toString(),
        { category: p.category?.toString(), tags: p.tags || [] },
      ])
  );

  // Process each user
  for (const user of users) {
    if (!user?._id || !user.createdAt) continue; // Skip invalid users
    const userId = user._id;
    const userIdStr = userId.toString();
    const interactions = userInteractionsMap.get(userIdStr) || [];
    const declaredInterests = user.interests || [];

    // Skip users with no interactions or declared interests to build profile from
    if (interactions.length === 0 && declaredInterests.length === 0) continue;

    const categoryScores = new Map();
    const tagScores = new Map();
    const interactedProductIds = new Set();
    let lastInteractionDate = user.createdAt;

    // Score based on interactions
    interactions.forEach((interaction) => {
      interactedProductIds.add(interaction.productId);
      if (interaction.date > lastInteractionDate)
        lastInteractionDate = interaction.date;
      const productMeta = productMetaMap.get(interaction.productId);
      if (!productMeta) return;
      const weight =
        interaction.type === "upvote"
          ? 1.0
          : interaction.type === "bookmark"
          ? 0.8
          : 0.2;
      if (productMeta.category)
        categoryScores.set(
          productMeta.category,
          (categoryScores.get(productMeta.category) || 0) + weight
        );
      productMeta.tags.forEach((tag) =>
        tagScores.set(tag, (tagScores.get(tag) || 0) + weight * 0.8)
      );
    });

    // Score based on declared interests
    declaredInterests.forEach((interest) => {
      if (!interest || !interest.name) return;
      const weight = ((interest.strength || 5) / 10) * 2.0; // Give declared interests higher weight
      if (COMMON_TAGS.includes(interest.name)) {
        tagScores.set(
          interest.name,
          (tagScores.get(interest.name) || 0) + weight
        );
      } else if (mongoose.Types.ObjectId.isValid(interest.name)) {
        // Assume it's a category ID
        categoryScores.set(
          interest.name,
          (categoryScores.get(interest.name) || 0) + weight
        );
      }
    });

    // Format preferences
    const categoryPrefs = Array.from(categoryScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 20)
      .map(([categoryId, score]) => ({
        category: categoryId,
        score: Math.min(1.0, score / 5.0),
        interactionCount: Math.round(score),
        lastInteraction: lastInteractionDate,
      }));
    const tagPrefs = Array.from(tagScores.entries())
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .slice(0, 50)
      .map(([tag, score]) => ({
        tag,
        score: Math.min(1.0, score / 4.0),
        interactionCount: Math.round(score),
        lastInteraction: lastInteractionDate,
      }));

    // Generate simple recommendations (e.g., based on top category/tag)
    const potentialRecs = products.filter(
      (p) => p?._id && !interactedProductIds.has(p._id.toString())
    ); // Exclude interacted
    const recommendedProductsData = getRandomSubset(potentialRecs, 0, 30).map(
      (p) => ({
        product: p._id,
        score: faker.number.float({ min: 0.5, max: 0.95 }),
        reason: pickRandom(["category", "tag", "similar", "personalized"]),
        lastCalculated: new Date(),
      })
    );

    // Upsert recommendation profile
    recommendationPromises.push(
      Recommendation.updateOne(
        { user: userId },
        {
          $set: {
            user: userId,
            categories: categoryPrefs,
            tags: tagPrefs,
            recommendedProducts: recommendedProductsData,
            dismissedProducts: [],
            lastUpdated: new Date(),
          },
        },
        { upsert: true }
      ).catch((err) =>
        logger.error(
          `Error upserting recommendation for ${userIdStr}: ${err.message}`
        )
      )
    );

    processedUsers++;
    // Process promises in batches
    if (processedUsers % BATCH_SIZE === 0) {
      await Promise.allSettled(
        recommendationPromises.splice(0, recommendationPromises.length)
      ); // Use allSettled
      logger.info(`Processed ${processedUsers} recommendation profiles...`);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  // Process remaining promises
  await Promise.allSettled(recommendationPromises);
  logger.info(
    `Finished creating/updating ${processedUsers} recommendation profiles.`
  );
}

// --- Main Seeding Orchestration ---
async function seedDatabase() {
  try {
    await clearDatabase();
    const startTime = Date.now();

    // --- Ensure Admin User ---
    let effectiveAdminUser = null; // Will hold the admin user document/object
    const adminData = TEST_USERS_DATA.find((u) => u.role === "admin");
    if (!adminData) {
      throw new Error("Admin configuration missing in TEST_USERS_DATA.");
    }

    let existingAdmin = await User.findOne({ email: adminData.email }); // Find full doc
    if (!existingAdmin) {
      logger.info("Admin user not found, creating...");
      const adminUsername = await generateUniqueUsername(
        adminData.firstName,
        adminData.lastName,
        User
      );
      const adminToSave = new User({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        password: adminData.password, // Hashed on save
        role: adminData.role,
        username: adminUsername,
        isEmailVerified: true,
        profilePicture: { url: faker.image.avatarGitHub() },
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      await adminToSave.save();
      logger.info(
        `Created initial admin user: ${adminToSave.email} (Username: ${adminUsername})`
      );
      effectiveAdminUser = adminToSave; // Use the saved document
    } else {
      logger.info(`Found existing admin user: ${existingAdmin.email}`);
      effectiveAdminUser = existingAdmin; // Use the existing document
      // Check and add username if missing
      if (!effectiveAdminUser.username) {
        try {
          const adminUsername = await generateUniqueUsername(
            effectiveAdminUser.firstName,
            effectiveAdminUser.lastName,
            User
          );
          effectiveAdminUser.username = adminUsername;
          await effectiveAdminUser.save(); // Save the updated document
          logger.info(
            `--> Added missing username to existing admin user ${effectiveAdminUser.email}: ${adminUsername}`
          );
        } catch (updateError) {
          logger.error(
            `--> Failed to add missing username to existing admin user ${effectiveAdminUser.email}: ${updateError.message}`
          );
        }
      }
    }

    if (!effectiveAdminUser || !effectiveAdminUser._id) {
      throw new Error("Failed to find or create the essential admin user.");
    }
    // --- End Ensure Admin User ---

    // 1. Seed Categories & Tags (Pass the admin document/object)
    const { categories, subcategories, tags } = await seedCategoriesAndTags(
      effectiveAdminUser
    );
    const allCategories = [...categories, ...subcategories];

    // 2. Seed Users (Handles Test users including admin if found, and random users)
    const rolesToAssign = {
      startupOwner: NUM_STARTUPS,
      investor: NUM_INVESTORS,
      agency: NUM_AGENCIES,
      freelancer: NUM_FREELANCERS,
      jobseeker: NUM_JOBSEEKERS,
      maker: NUM_MAKERS,
    };
    // The users array might contain lean objects (from admin check) and full docs
    const seededUsersMixed = await seedUsers(NUM_USERS_TOTAL, rolesToAssign);

    // Fetch all users *from the database* now to ensure we have consistent Mongoose documents
    // for subsequent steps that might modify them (like seedRoleSpecificData).
    logger.info("Fetching all users from DB for subsequent steps...");
    const allUsersForSeeding = await User.find({});
    logger.info(`Fetched ${allUsersForSeeding.length} users.`);

    // 3. Seed Role Specific Data (Pass Mongoose documents)
    await seedRoleSpecificData(allUsersForSeeding);

    // 4. Seed Products
    const products = await seedProducts(
      allUsersForSeeding,
      allCategories,
      tags
    );

    // 5. Seed Jobs & Projects
    const jobs = await seedJobs(allUsersForSeeding);
    const projects = await seedProjects(allUsersForSeeding);

    // 6. Seed Interactions
    await seedInteractions(allUsersForSeeding, products);

    // 7. Update Product Counts
    // const finalProducts = await Product.find({}); // Fetch products again if needed, or use the 'products' array if it's accurate
    await updateProductCounts(products); // Use the products array created earlier

    // 8. Seed Search History
    await seedSearchHistory(allUsersForSeeding);

    // 9. Seed Recommendations
    await seedRecommendations(allUsersForSeeding, products); // Use the products array created earlier

    // --- Final Summary ---
    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.info(`\nDatabase seeding completed in ${duration} seconds.`);
    logger.info("--- Final Summary ---");
    logger.info(`- Users: ${await User.countDocuments()}`);
    logger.info(`- Categories: ${await Category.countDocuments()}`);
    logger.info(`- Tags: ${await Tag.countDocuments()}`);
    logger.info(`- Products: ${await Product.countDocuments()}`);
    logger.info(`- Jobs: ${await Job.countDocuments()}`);
    logger.info(`- Projects: ${await Project.countDocuments()}`);
    logger.info(`- Startups: ${await Startup.countDocuments()}`);
    logger.info(`- Investors: ${await Investor.countDocuments()}`);
    logger.info(`- Agencies: ${await Agency.countDocuments()}`);
    logger.info(`- Freelancers: ${await Freelancer.countDocuments()}`);
    logger.info(`- Jobseekers: ${await Jobseeker.countDocuments()}`);
    logger.info(`- Views: ${await View.countDocuments()}`);
    logger.info(`- Upvotes: ${await Upvote.countDocuments()}`);
    logger.info(`- Bookmarks: ${await Bookmark.countDocuments()}`);
    logger.info(`- Comments: ${await Comment.countDocuments()}`);
    logger.info(`- Search History: ${await SearchHistory.countDocuments()}`);
    logger.info(
      `- Recommendation Profiles: ${await Recommendation.countDocuments()}`
    );
    logger.info(
      `- Recommendation Interactions: ${await RecommendationInteraction.countDocuments()}`
    );
    logger.info("--------------------");
    logger.info("Test user credentials:");
    // Display credentials and potentially generated usernames
    const finalTestUsers = await User.find({
      email: { $in: TEST_USERS_DATA.map((u) => u.email) },
    }).lean();
    const testUserMap = new Map(finalTestUsers.map((u) => [u.email, u]));
    TEST_USERS_DATA.forEach((uData) => {
      const finalUser = testUserMap.get(uData.email);
      const usernameInfo = finalUser?.username
        ? ` (Username: ${finalUser.username})`
        : "";
      logger.info(
        `- ${uData.role.padEnd(12)}: ${uData.email} / ${
          uData.password
        }${usernameInfo}`
      );
    });

    logger.info("Seeding finished successfully.");
    process.exit(0);
  } catch (error) {
    logger.error("Fatal error during database seeding:", error);
    logger.error(error.stack);
    process.exit(1);
  }
}

// --- Connect and Run ---
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("Connected to MongoDB. Starting seed process...");
    return seedDatabase();
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  });
