const RRHHObjectiveService = require('../../../services/rrhh/RRHHObjective/objective/RRHHObjectiveService')
const { validateEnterprise } = require('../../enterprise/handler/utilEnterprise')

const RRHHObjectiveController = {
    createObjective: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            console.log('Cómo llega el req.body', req.body)
            const objective = await RRHHObjectiveService.createObjective(req.body, req.user, enterprise._id)
            if (objective.error) {
                return res.status(objective.code).json({ message: objective.error })
            }
            return res.status(200).json({ message: 'Se creó el objetivo de RRHH con éxito.', objective })
        } catch (error) {
            next(error)
        }
    },
    getObjective: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const objective = await RRHHObjectiveService.getObjective(objectiveId, enterprise._id)
            if (objective.error) return res.status(objective.code).json({ message: objective.error })
            return res.status(200).json(objective)
        } catch (error) {
            next(error)
        }
    },
    getAllObjectives: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            const allObjectives = await RRHHObjectiveService.getAllObjectives(enterprise._id)
            if (allObjectives.error) return res.status(allObjectives.code).json({ message: allObjectives.error })
            return res.status(200).json(allObjectives)
        } catch (error) {
            next(error)
        }
    },
    deleteObjective: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const deleteObjective = await RRHHObjectiveService.deleteObjective(objectiveId, enterprise._id)
            if (deleteObjective.error) return res.status(deleteObjective.code).json({ message: deleteObjective.error })
            return res.status(200).json({ message: 'Objetivo eliminado con éxito.' })
        } catch (error) {
            next(error)
        }
    },
    /*
    printCompleteDashboard: async function (req, res) { }, //es para imprimir todos los datos relativos a los objetivos, tareas y que permita en una petición obtener diversos recursos.
    */
    updateObjective: async function (req, res, next) {
        try {
            const { objectiveId } = req.params
            const enterprise = await validateEnterprise(req, res)
            const updateObjective = await RRHHObjectiveService.updateObjective(objectiveId, req.body, enterprise._id)
            if (updateObjective.error) {
                return res.status(updateObjective.code).json({ message: updateObjective.error })
            }
            return res.status(200).json({ message: 'Objetivo actualizado exitosamente', updateObjective })
        } catch (error) {
            next(error)
        }
    }, //solo para cambiar datos esenciales, no para actualizar estados o KPI's que hace el cron o el ingreso de tareas / kpis / cumplimiento / evidencia o añadido de información
    updateVariousObjectives: async function (req, res, next) { },//opción dinámica
    deleteAllObjectives: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            const deleteAllObjectives = await RRHHObjectiveService.deleteAllObjectives(enterprise._id)
            if (deleteAllObjectives.error) return res.status(deleteAllObjectives.code).json({ message: deleteAllObjectives.error })
            return res.status(200).json({ message: 'Todos los objetivos fueron eliminados con éxito.' })
        } catch (error) {
            next(error)
        }
    },
    getGeneralObjectivesByCurrentPeriod: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            const { currentPeriod } = req.body
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const objectives = await RRHHObjectiveService.getGeneralObjectivesByCurrentPeriod(enterprise._id, currentPeriod)
            if (objectives.error) return res.status(objectives.code).json({ message: objectives.error })
            return res.status(200).json(objectives)
        } catch (error) {
            next(error)
        }
    },
    getLastObjective: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const objective = await RRHHObjectiveService.getLastObjective(enterprise._id)
            if (objective.error) return res.status(objective.code).json({ message: objective.error })
            return res.status(200).json(objective)
        } catch (error) {
            next(error)
        }
    },
    printDashboard: async function (req, res, next) {
        try {
            const enterprise = await validateEnterprise(req, res)
            if (enterprise.error) return res.status(enterprise.code).json({ message: enterprise.error })
            const dashboard = await RRHHObjectiveService.printDashboardObjectives(enterprise._id)
            return res.status(200).json(dashboard)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = RRHHObjectiveController