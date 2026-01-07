const express = require('express')
const router = express.Router()
const clasificationController = require('../../../controllers/rrhh/objective/clasificationController')
const authMiddleware = require('../../../middlewares/userMiddlewares/authMiddleware')
const verifyOwnership = require('../../../middlewares/userMiddlewares/verifyOwnership')

router.post('/:enterpriseId/rrhh/objectives/clasifications/create', authMiddleware, verifyOwnership, clasificationController.addClasificationObjective)

module.exports = router