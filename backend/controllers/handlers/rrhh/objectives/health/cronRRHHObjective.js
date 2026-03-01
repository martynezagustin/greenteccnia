const cron = require('node-cron')
const healthEngine = require('../../../../../services/rrhh/RRHHObjective/objective/health/healthEngine')
const RRHHObjective = require('../../../../../models/rrhh/objectivesSubSoftware/objective/RRHHObjectiveModel')
const Checklist = require('../../../../../models/rrhh/objectivesSubSoftware/objective/checklist/checklistModel')

const cronRRHHObjectiveSchedule = async () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('Hola, estoy generando el cálculo de mierda ese.')
            const rrhhObjectives = await RRHHObjective.find()
            for (const obj of rrhhObjectives) {
                const totalTasks = await Checklist.countDocuments({ objectiveId: obj._id })
                const completedTasks = await Checklist.countDocuments({ objectiveId: obj._id, completed: true })
                const result = await healthEngine(obj, totalTasks, completedTasks)
                obj.status = result.status
                obj.progress = result.progress
                await obj.save()
            }
        } catch (error) {
            console.error('Ocurrió un error para generar el cron de objetivos', error)
        }
    })
}

module.exports = cronRRHHObjectiveSchedule