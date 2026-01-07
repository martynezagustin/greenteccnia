const RRHHObjective = require('../../../models/rrhh/objectivesSubSoftware/RRHHObjectiveModel')
const RRHHObjectiveSnapshotService = require('./RRHHObjectiveSnapshotService')
const Employee = require('../../../models/rrhh/employees/employeeModel')
const { validatePeriod } = require('./utils/handlerDates')

const VALID_OBJECTIVES = ['ESTRATEGIC', 'OPERATIONAL', 'COMPLIANCE', 'SUSTAINABILITY', 'INNOVATION']
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const RRHHObjectiveService = {
    createObjective: async function (data, user, enterpriseId) {
        try {
            if (!data.title) throw new Error('Falta el título del objetivo.')
            console.log('El clasification', data.clasification)
            if (!VALID_OBJECTIVES.includes(data.clasification)) return { error: 'El tipo de objetivo indicado no está disponible. Vuelve a intentarlo.', code: 400 }
            if (!VALID_PRIORITIES.includes(data.priority)) return { error: 'La prioridad es inválida. Vuelve a intentarlo.', code: 400 }
            if (data.owner) {
                if (!data.owner?.ownerType || !data.owner?.ownerId) return { error: 'Hay errores en la definición de los responsables.', code: 409 }
            }
            let stakeholders = []
            if (data.stakeholders) {
                const employees = data.stakeholders
                for (const employee of employees) {
                    const employeeExists = await Employee.findOne({ enterpriseId: enterpriseId, _id: employee })
                    if (employeeExists) stakeholders.push(employeeExists)
                }
            }
            let clasifications = []
            if(!data.clasification){
                return {error: 'No se ha especificado ninguna clasificación, no puede crearse un objetivo sin clasificarlo.', code: 409}
            }
            if(data.clasification){
                const clasificationsArray = data.clasification
                for(const c of clasificationsArray){
                    const clasificationExists = await ClasificationObjective.findOne({enterpriseId, _id: clasification})
                    if(clasificationExists) clasifications.push(clasificationExists)
                }
            }

            //2️⃣ Creamos el objetivo
            const objective = new RRHHObjective({
                enterpriseId: enterpriseId,
                title: data.title,
                description: data.description,
                clasification: clasifications.length > 0 ? clasifications : [],
                dateStart: data.dateStart,
                dateEnd: data.dateEnd,
                priority: data.priority,
                impact: data.impact,
                metricType: data.metricType,
                kpi: data.kpi,
                stakeholders: stakeholders.length !== 0 ? stakeholders : null,
                frequency: data.frequency,
                createdBy: user._id
            })
            const snapshot = await RRHHObjectiveSnapshotService.createSnapshot(objective, enterpriseId, 'CREATION')
            objective.snapshots.push(snapshot._id)
            await objective.save()
            return objective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getObjective: async function (objectiveId, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se ha especificado un ID de objetivo', code: 404 }
            const objective = await RRHHObjective.findOne({ _id: objectiveId, enterpriseId: enterpriseId })
            if (!objective) return { error: 'No se ha encontrado el objetivo.', code: 404 }
            return objective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getAllObjectives: async function (enterpriseId) {
        try {
            const allObjectives = await RRHHObjective.find({ enterpriseId: enterpriseId })
            if (!allObjectives || allObjectives.length === 0) return { error: 'No se han encontrado objetivos de RRHH de la empresa.', code: 404 }
            return allObjectives
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', error: 500 }
        }
    },
    updateObjective: async function (objectiveId, data, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se ha especificado un ID de objetivo', code: 404 }
            const updatedObjective = await RRHHObjective.findOneAndUpdate({ _id: objectiveId, enterpriseId: enterpriseId }, { ...data }, { new: true })
            if (!updatedObjective) return { error: 'No se ha encontrado el objetivo.', code: 404 }
            const snapshot = await RRHHObjectiveSnapshotService.createSnapshot(updatedObjective, enterpriseId, 'UPDATE')
            await snapshot.save()
            updatedObjective.snapshots.push(snapshot._id)
            return updatedObjective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    deleteObjective: async function (objectiveId, enterpriseId) {
        try {
            if (!objectiveId) return { error: 'No se especificó un ID de objetivo', code: 404 }
            const deletedObjective = await RRHHObjective.findOneAndDelete({ enterpriseId: enterpriseId, _id: objectiveId })
            if (!deletedObjective) return { error: 'No se ha encontrado el objetivo.', code: 404 }
            const deleteSnapshotsOfObjective = await RRHHObjectiveSnapshotService.deleteAllSnapshots(objectiveId, enterpriseId)
            return { deletedObjective, deleteSnapshotsOfObjective }
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    deleteAllObjectives: async function (enterpriseId) {
        try {
            const deletedAllObjectives = await RRHHObjective.deleteMany({ enterpriseId })
            if (!deletedAllObjectives || deletedAllObjectives.length === 0) return { error: 'No se han encontrado objetivos.', code: 404 }
            return deletedAllObjectives
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getGeneralObjectivesByCurrentPeriod: async function (enterpriseId, currentPeriod) {
        try {
            const periodValid = validatePeriod(currentPeriod)
            const objectives = await RRHHObjective.find({ enterpriseId, createdAt: { $gte: periodValid.startDate, $lte: periodValid.endDate } })
            if (!objectives || objectives.length === 0) return { error: 'No se han encontrado objetivos en el periodo especificado', code: 404 }
            return objectives
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getObjectivesByStatus: async function (enterpriseId, status) {
        try {
            const objectives = await RRHHObjective.find({ enterpriseId, status: status })
            if (!objectives || objectives.length === 0) return { error: 'No se han encontrado objetivos.', code: 404 }
            return objectives
        } catch (error) {
            return { error: `Ha ocurrido un error de servidor: ${error.message}`, code: 500 }
        }
    },
    getLastObjective: async function (enterpriseId) {
        try {
            const objective = await RRHHObjective.findOne({ enterpriseId: enterpriseId }).sort({ createdAt: -1 })
            if (!objective) return { error: 'No hay objetivos RRHH agregados aún.', code: 404 }
            return objective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    },
    getLastObjectiveByOwner: async function (enterpriseId, ownerType, ownerId) {
        try {
            const objective = await RRHHObjective.findOne({ enterpriseId, 'owner.ownerType': ownerType, 'owner.ownerId': ownerId }).sort({ createdAt: -1 })
            if (!objective) return { error: 'No se ha encontrado ningún objetivo del responsable seleccionado.' }
            return objective
        } catch (error) {
            return { error: 'Ha ocurrido un error de servidor.', code: 500 }
        }
    }
}

module.exports = RRHHObjectiveService