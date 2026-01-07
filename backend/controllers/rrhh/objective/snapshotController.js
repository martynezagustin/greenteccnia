const RRHHObjectiveService = require('../../../services/rrhh/RRHHObjective/RRHHObjectiveService')
const RRHHObjectiveSnapshotService = require('../../../services/rrhh/RRHHObjective/RRHHObjectiveSnapshotService')
const { validateEnterprise } = require('../../enterprise/handler/utilEnterprise')

const snapshotController = {
    captureSnapshot: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const { objectiveId } = req.params
            const objective = await RRHHObjectiveService.getObjective(objectiveId, enterprise._id)
            if (objective.error) return res(objective.code).json({ message: objective.error })
            const snapshot = await RRHHObjectiveSnapshotService.createSnapshot(objective)
            if (snapshot.error) return res(snapshot.code).json({ message: snapshot.message })
            return res.status(200).json({ message: 'Snapshot capturado con éxito 😉.', snapshot })
        } catch (error) {
            next(error)
        }
    },
    getSnapshot: async function (req, res) {
        try {
            const {snapshotId} = req.params
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
        } catch (error) {

        }
    }
}