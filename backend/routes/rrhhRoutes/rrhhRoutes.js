const express = require("express")
const router = express.Router()
const rrhhController = require("../../controllers/rrhh/rrhhController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")

router.get("/:enterpriseId/rrhh/dashboard"/*authMiddleware*/, rrhhController.printDashboardSummaryRRHH)

module.exports = router