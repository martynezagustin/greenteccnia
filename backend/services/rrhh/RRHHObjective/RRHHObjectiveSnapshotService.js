const RRHHObjectiveSnapshot = require('../../../models/rrhh/objectivesSubSoftware/RRHHObjectiveSnapshotModel')
const { validatePeriod } = require('./utils/handlerDates')

const RRHHObjectiveSnapshotService = {
    createSnapshot: async function (objective, enterpriseId, reason) {
        try {
            if (!objective._id) return {
                error: 'No existe el ID del objetivo.',
                code: 404
            }
            const lastSnapshot = await RRHHObjectiveSnapshot.findOne({ enterpriseId, objectiveId: objective._id }).sort({ createdAt: -1 })
            const snapshot = new RRHHObjectiveSnapshot({
                ...objective,
                enterpriseId: enterpriseId,
                parentHash: lastSnapshot ? lastSnapshot.hash : 'GÉNESIS',
                reason: reason
            })
            return await snapshot.save()
        } catch (error) {
            return { error: `Ha ocurrido un error al crear el snapshot: ${error.message}`, code: 500 }
        }
    },
    getSnapshotsByObjective: async function (objectiveId, enterpriseId) {
        try {
            const allSnapshots = await RRHHObjectiveSnapshot.find({ objectiveId: objectiveId, enterpriseId: enterpriseId }).sort({ createdAt: -1 })
            if (!allSnapshots || allSnapshots.length === 0) return { error: 'No existen registros de snapshots asociados al objetivo', code: 404 }
            return allSnapshots
        } catch (error) {
            return { error: `Error al obtener los snapshots: ${error.message}`, code: 500 };
        }
    },
    deleteAllSnapshots: async function (objectiveId, enterpriseId) {
        try {
            const allSnapshotsToDelete = await RRHHObjectiveSnapshot.deleteMany({ objectiveId: objectiveId, enterpriseId: enterpriseId })
            if (!allSnapshotsToDelete || allSnapshotsToDelete.length === 0) return { error: 'No se han encontrado snapshots a eliminar del objetivo.', code: 404 }
            return allSnapshotsToDelete
        } catch (error) {
            return { error: `Error al obtener los snapshots: ${error.message}`, code: 500 };
        }
    },
    getSnapshotsBySpecificPeriod: async function (objectiveId, enterpriseId, period) {
        // Implementation here
        try {
            const validPeriod = validatePeriod(period)
            const snapshots = await RRHHObjectiveSnapshot.find({ enterpriseId, objectiveId, createdAt: { $gte: validPeriod.startDate, $lte: validPeriod.endDate } })
            if (!snapshots || snapshots.length === 0) return { error: 'No se han encontrado snapshots del objetivo en el periodo especificado.', code: 404 }
            return snapshots
        } catch (error) {
            return { error: `Error al obtener los snapshots: ${error.message}`, code: 500 };
        }
    },
    getLastSnapshot: async function (objectiveId, enterpriseId) {
        try {
            //acá código
            const lastSnapshot = await RRHHObjectiveSnapshot.findOne({ enterpriseId, objectiveId }, { sort: { createdAt: -1 } })
            if (!lastSnapshot) return { error: 'No hay snapshots capturados para este objetivo RRHH.', code: 404 }
            return lastSnapshot
        } catch (error) {
            return { error: `Error al tratar de obtener el snapshot: ${error.message}`, code: 500 };
        }
    }
}

module.exports = RRHHObjectiveSnapshotService