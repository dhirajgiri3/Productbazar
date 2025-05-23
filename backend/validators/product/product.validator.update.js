// This is an update to the product validator to handle contact pricing fields
// Update the validateCreateProduct and validateUpdateProduct functions

// Add these validation rules to the validateCreateProduct and validateUpdateProduct arrays

body("pricing.type")
  .optional()
  .isIn(["free", "paid", "freemium", "subscription", "contact"])
  .withMessage("Invalid pricing type"),

body("pricing.contactEmail")
  .optional()
  .custom((value, { req }) => {
    const pricingType = req.body.pricing?.type;
    if (pricingType === "contact" && !value) {
      throw new Error("Contact email is required for contact pricing");
    }
    if (value && !value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error("Contact email must be a valid email address");
    }
    return true;
  }),

body("pricing.contactPhone")
  .optional(),

body("pricing.contactInstructions")
  .optional()
  .isLength({ max: 500 })
  .withMessage("Contact instructions cannot exceed 500 characters"),

body("pricing.interval")
  .optional()
  .custom((value, { req }) => {
    const pricingType = req.body.pricing?.type;
    if (pricingType === "subscription" && !value) {
      throw new Error("Interval is required for subscription pricing");
    }
    if (value && !["week", "month", "year"].includes(value)) {
      throw new Error("Interval must be week, month, or year");
    }
    return true;
  }),
