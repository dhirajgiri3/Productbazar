export const isProduction = process.env.NODE_ENV === "production";
export const OTP_RATE_LIMIT = 15 * 60 * 1000; // 15 minutes
export const PASSWORD_RESET_RATE_LIMIT = 5 * 60 * 1000; // 5 minutes