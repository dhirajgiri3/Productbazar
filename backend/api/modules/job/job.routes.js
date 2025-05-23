import express from "express";
import * as jobController from "../../../controllers/jobs/job.controller.js";
import * as jobSearchController from "../../../controllers/search/jobSearch.controller.js";
import { protect } from "../../middlewares/user/auth.middleware.js";
import { upload } from "../../middlewares/core/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", jobSearchController.getAllJobs); // Use enhanced search controller
router.get("/:id", jobController.getJob);

// Resume download route - public but with token authentication
router.get("/applications/:applicationId/resume", jobController.downloadApplicationResume);

// Protected routes
router.use(protect);

// Job posting routes
router.post(
  "/",
  upload.fields([{ name: "logo", maxCount: 1 }]),
  jobController.createJob
);

router.patch(
  "/:id",
  upload.fields([{ name: "logo", maxCount: 1 }]),
  jobController.updateJob
);

router.delete("/:id", jobController.deleteJob);

// User-specific routes - define these first to avoid conflicts with job ID routes
router.get("/user/applications", jobController.getUserApplications);
router.get("/user/posted", jobController.getUserPostedJobs);

// Job application routes
router.post(
  "/:jobId/apply",
  upload.fields([{ name: "resume", maxCount: 1 }]),
  jobController.applyForJob
);

router.get("/:jobId/applications", jobController.getJobApplications);

router.patch(
  "/applications/:applicationId",
  jobController.updateApplicationStatus
);

// Application management routes
router.get("/applications/:applicationId", jobController.getJobApplication);
router.patch("/applications/:applicationId/withdraw", jobController.withdrawJobApplication);

export default router;
