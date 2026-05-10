const express = require('express')
const router = express.Router()
const classificationController = require('../../../controllers/rrhh/objective/classificationController')
const authMiddleware = require('../../../middlewares/userMiddlewares/authMiddleware')
const verifyOwnership = require('../../../middlewares/userMiddlewares/verifyOwnership')

router.post('/:enterpriseId/rrhh/classifications/create', authMiddleware, verifyOwnership, classificationController.addClassificationObjective)
router.get('/:enterpriseId/rrhh/classifications', authMiddleware, verifyOwnership, classificationController.getClassifications)
router.get('/:enterprise/rrhh/classifications/:classificationId', authMiddleware, verifyOwnership, classificationController.getClassificationObjective)

module.exports = router