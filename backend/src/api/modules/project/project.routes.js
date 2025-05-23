import express from "express";
import * as projectController from "../../../controllers/projects/project.controller.js";
import { protect, optionalAuth } from "../../middlewares/user/auth.middleware.js";
import { upload } from "../../middlewares/core/upload.middleware.js";

const router = express.Router();

// === Public Routes ===

// Project listing and discovery routes
router.get("/", projectController.getAllProjects);
router.get("/featured", projectController.getFeaturedProjects);
router.get("/trending", projectController.getTrendingProjects);
router.get("/category/:category", projectController.getProjectsByCategory);
router.get("/technology/:technology", projectController.getProjectsByTechnology);

// Single project routes with optional auth
router.get("/:id", optionalAuth, projectController.getProject);

// Project interaction routes
router.post("/:id/like", projectController.likeProject);
router.post("/:id/unlike", projectController.unlikeProject);
router.post("/:id/share", projectController.trackShare);
router.post("/:id/click", projectController.trackClick);

// === Protected Routes ===
router.use(protect);

// Project CRUD operations
router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "clientLogo", maxCount: 1 }
  ]),
  projectController.createProject
);

router.patch(
  "/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "clientLogo", maxCount: 1 }
  ]),
  projectController.updateProject
);

router.delete("/:id", projectController.deleteProject);

// User-specific routes
router.get("/user/me", projectController.getUserProjects);
router.get("/user/:userId", projectController.getUserProjects);

// Comment routes
router.post("/:id/comments", projectController.addComment);
router.get("/:id/comments", projectController.getComments);
router.patch("/:id/comments/:commentId", projectController.updateComment);
router.delete("/:id/comments/:commentId", projectController.deleteComment);
router.post("/:id/comments/:commentId/like", projectController.likeComment);

// Collaborator routes
router.post("/:id/collaborators", projectController.addCollaborator);
router.get("/:id/collaborators", projectController.getCollaborators);
router.patch("/:id/collaborators/:collaboratorId", projectController.updateCollaborator);
router.delete("/:id/collaborators/:collaboratorId", projectController.removeCollaborator);

// Gallery management routes
router.post(
  "/:id/gallery",
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  projectController.addGalleryItems
);
router.patch("/:id/gallery/:itemId", projectController.updateGalleryItem);
router.delete("/:id/gallery/:itemId", projectController.removeGalleryItem);
router.post("/:id/gallery/reorder", projectController.reorderGalleryItems);

// Analytics routes
router.get("/:id/analytics", projectController.getProjectAnalytics);

export default router;
