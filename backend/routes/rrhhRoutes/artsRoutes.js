const express = require("express")
const router = express.Router()
const artController = require("../../controllers/rrhh/artController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/arts/add-art", authMiddleware, verifyOwnership, artController.createART)
router.get("/:enterpriseId/arts/:ARTId", authMiddleware, verifyOwnership, artController.getART)
router.get("/:enterpriseId/arts", authMiddleware, verifyOwnership, artController.getAllARTs)

module.exports = router