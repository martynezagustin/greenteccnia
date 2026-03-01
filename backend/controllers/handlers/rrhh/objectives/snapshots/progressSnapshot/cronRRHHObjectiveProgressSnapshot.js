const cron = require('node-cron')
const ProgressSnapshot = require('../../../../../../models/rrhh/objectivesSubSoftware/objective/progress/progressSnapshotModel')
const RRHHObjective = require('../../../../../../models/rrhh/objectivesSubSoftware/objective/RRHHObjectiveModel')
const Enterprise = require('../../../../../../models/enterpriseModel')

const cronRRHHObjectiveProgressSnapshot = async () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const enterprises = await Enterprise.find()
            const startThisDate = new Date()
            startThisDate.setUTCHours(0, 0, 0, 0)
            const endThisDate = new Date()
            endThisDate.setUTCHours(23, 59, 59, 999)
            for (const enterprise of enterprises) {
                const objectives = await RRHHObjective.find({ enterpriseId: enterprise._id })
                if (!objectives) console.error('No se pueden mostrar objetivos para guardar un snapshot diario.')
                const metrics = {
                    active: objectives.filter(o => o.status === 'ACTIVE').length,
                    warning: objectives.filter(o => o.status === 'WARNING').length,
                    planned: objectives.filter(o => o.status === 'PLANNED').length
                }
                const overallProgress = objectives.length === 0 ? 0 : objectives.reduce((acc, o) => acc + o.progress, 0) / objectives.length
                const exists = await ProgressSnapshot.exists({ date: { $gte: startThisDate, $lte: endThisDate } })
                if (exists) {
                    console.error('Existe perro', exists)
                }
                await ProgressSnapshot.create({
                    enterpriseId: enterprise._id,
                    date: new Date(),
                    metrics,
                    overallProgress
                })
            }

        } catch (error) {
            console.error(error)
        }
    })
}

module.exports = cronRRHHObjectiveProgressSnapshot