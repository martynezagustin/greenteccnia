const express = require('express')
const router = express.Router()
const authMiddleware = require('../../../middlewares/userMiddlewares/authMiddleware')
const verifyOwnership = require('../../../middlewares/userMiddlewares/verifyOwnership')
const RRHHObjectiveController = require('../../../controllers/rrhh/objective/RRHHObjectiveController')

router.post('/:enterpriseId/rrhh/objectives/create', authMiddleware, verifyOwnership, RRHHObjectiveController.createObjective)
router.get('/:enterpriseId/rrhh/objectives/:objectiveId', authMiddleware, verifyOwnership, RRHHObjectiveController.getObjective)
router.get('/:enterpriseId/rrhh/objectives', authMiddleware, verifyOwnership, RRHHObjectiveController.getAllObjectives)
router.put('/:enterpriseId/rrhh/objectives/:objectiveId/update', authMiddleware, verifyOwnership, RRHHObjectiveController.updateObjective)
router.delete('/:enterpriseId/rrhh/objectives/:objectiveId/delete', authMiddleware, verifyOwnership, RRHHObjectiveController.deleteObjective)
router.get('/:enterpriseId/rrhh/objectives/filter/by-current-period', authMiddleware, verifyOwnership, RRHHObjectiveController.getGeneralObjectivesByCurrentPeriod)
router.get('/:enterpriseId/rrhh/objectives/filter/last-objective', authMiddleware, verifyOwnership, RRHHObjectiveController.getLastObjective)


module.exports = router