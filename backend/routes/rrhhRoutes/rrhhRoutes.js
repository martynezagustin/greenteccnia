const express = require("express")
const router = express.Router()
const rrhhController = require("../../controllers/rrhh/rrhhController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.get("/:enterpriseId/rrhh/dashboard", authMiddleware, verifyOwnership, rrhhController.printDashboardSummaryRRHH)

module.exports = router