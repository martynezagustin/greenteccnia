const express = require('express')
const router = express.Router()
const authMiddleware = require('../../../middlewares/userMiddlewares/authMiddleware')
const verifyOwnership = require('../../../middlewares/userMiddlewares/verifyOwnership')
const weightController = require('../../../controllers/rrhh/satisfaction/weightController')

router.put('/:enterpriseId/weights-satisfaction/put', authMiddleware, verifyOwnership, weightController.saveWeight)
router.get('/:enterpriseId/weights-satisfaction', authMiddleware, verifyOwnership, weightController.getWeights)

module.exports = router