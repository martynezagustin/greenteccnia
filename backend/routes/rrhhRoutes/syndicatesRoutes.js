const express = require("express")
const router = express.Router()
const syndicateController = require("../../controllers/rrhh/syndicateController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/syndicates/create-syndicate", authMiddleware, verifyOwnership, syndicateController.createSyndicate)
router.get("/:enterpriseId/syndicates/:syndicateId", authMiddleware, verifyOwnership, syndicateController.getSyndicate)
router.get("/:enterpriseId/syndicates", authMiddleware, verifyOwnership, syndicateController.getAllSyndicates)

module.exports = router