const express = require("express")
const router = express.Router()
const enterpriseController = require("../controllers/enterprise/enterpriseController")
const authMiddleware = require("../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../middlewares/userMiddlewares/verifyOwnership")

router.post("/add-enterprise", authMiddleware, enterpriseController.addEnterprise)
router.post("/enterprise/add-sustainability-options", authMiddleware, enterpriseController.addSustainabilityOptionsToEnterprise)
router.post("/enterprise/add-certifications-accomplished", authMiddleware, enterpriseController.addCertificationsAccomplished)
router.post("/enterprise/add-initials-sustainable-objectives", authMiddleware, enterpriseController.addInitialsSustainableObjective)
router.get("/get-enterprise/:enterpriseId", enterpriseController.getEnterprise)
router.get("/get-enterprise-id/:userId", authMiddleware, enterpriseController.getEnterpriseId)
router.delete("/delete-enterprise/:enterpriseId", enterpriseController.deleteEnterprise)
router.put("/update-enterprise/:enterpriseId", enterpriseController.updateEnterprise)
router.get("/:enterpriseId/print-dashboard", authMiddleware, verifyOwnership, enterpriseController.getDashboard)

module.exports = router