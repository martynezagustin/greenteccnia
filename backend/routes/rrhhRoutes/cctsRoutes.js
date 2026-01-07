const express = require("express")
const router = express.Router()
const cctController = require("../../controllers/rrhh/cctController")
const authMiddleware = require("../../middlewares/userMiddlewares/authMiddleware")
const verifyOwnership = require("../../middlewares/userMiddlewares/verifyOwnership")

router.post('/:enterpriseId/ccts/add-cct', authMiddleware, verifyOwnership, cctController.createCCT)
router.get('/:enterpriseId/ccts', authMiddleware, verifyOwnership, cctController.getAllCCTs)

module.exports = router