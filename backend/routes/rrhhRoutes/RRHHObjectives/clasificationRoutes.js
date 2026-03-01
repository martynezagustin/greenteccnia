const express = require('express')
const router = express.Router()
const clasificationController = require('../../../controllers/rrhh/objective/clasificationController')
const authMiddleware = require('../../../middlewares/userMiddlewares/authMiddleware')
const verifyOwnership = require('../../../middlewares/userMiddlewares/verifyOwnership')

router.post('/:enterpriseId/rrhh/clasifications/create', authMiddleware, verifyOwnership, clasificationController.addClasificationObjective)
router.get('/:enterpriseId/rrhh/clasifications', authMiddleware, verifyOwnership, clasificationController.getClasifications)
router.get('/:enterprise/rrhh/clasifications/:clasificationId', authMiddleware, verifyOwnership, clasificationController.getClasificationObjective)

module.exports = router