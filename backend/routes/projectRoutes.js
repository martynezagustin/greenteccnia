const express = require("express")
const router = express.Router()
const projectController = require("../controllers/projects/projectController")
const verifyOwnership = require("../middlewares/userMiddlewares/verifyOwnership")
const authMiddleware = require("../middlewares/userMiddlewares/authMiddleware")

router.post("/:enterpriseId/projects/add-project", projectController.addProject)
router.get("/:enterpriseId/projects/:projectId", projectController.getProject)
router.get("/:enterpriseId/projects", projectController.getAllProjects)
router.put("/:enterpriseId/projects/update-project/:projectId", projectController.updateProject)
router.delete("/:enterpriseId/projects/delete-project/:projectId", projectController.deleteProject)
router.delete("/:enterpriseId/projects/delete-all", projectController.deleteAllProjects)
router.post("/:enterpriseId/projects/:projectId/add-task", projectController.addTaskToProject)
router.get("/:enterpriseId/projects/:projectId/task/:taskId", projectController.getTaskToProject)
router.get("/:enterpriseId/projects/:projectId/tasks", projectController.getAllTaskToProject)
router.put("/:enterpriseId/projects/:projectId/task/update-task/:taskId", projectController.updateTaskToProject)
router.delete("/:enterpriseId/projects/:projectId/task/delete-task/:taskId", projectController.deleteTaskToProject)

module.exports = router