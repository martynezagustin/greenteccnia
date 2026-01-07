const express = require("express")
const router = express.Router()
const bankController = require("../../controllers/rrhh/bankController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post("/:enterpriseId/banks/create-bank", authMiddleware, verifyOwnership, bankController.createBank)
router.get("/:enterpriseId/banks/:bankId", authMiddleware, verifyOwnership, bankController.getBank)
router.get("/:enterpriseId/banks", authMiddleware, verifyOwnership, bankController.getAllBanks)

module.exports = router