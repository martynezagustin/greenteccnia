const cron = require('node-cron')
const RRHHObjectiveSnapshot = require('../../../../../../models/rrhh/objectivesSubSoftware/RRHHObjectiveSnapshotModel')
const RRHHObjective = require('../../../../../../models/rrhh/objectivesSubSoftware/objective/RRHHObjectiveModel')


const cronRRHHObjectiveSnapshot = async() => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const objectives = await RRHHObjective.find()
            if(objectives){
                for (const obj of objectives){
                    const data = {...obj, objectiveId: obj._id, enterpriseId: obj.enterpriseId, reason: 'CRON'}
                    await RRHHObjectiveSnapshot.create(data)
                }
            }
        } catch (error) {
            console.error(error);
        }
    })
}

module.exports = cronRRHHObjectiveSnapshot