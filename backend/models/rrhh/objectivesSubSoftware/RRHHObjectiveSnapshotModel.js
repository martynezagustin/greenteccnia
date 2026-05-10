const mongoose = require('mongoose')
const crypto = require('crypto')

//Esto congela la realidad en un periodo de tiempo y toma una muestra ;)
const RRHHObjectiveSnapshotSchema = new mongoose.Schema({
    objectiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective' },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
    status: String,
    riskLevel: String,
    progress: { type: Number, default: 0 },
    diff: {
        taskGrowth: Number,
        kpiGrowth: Number,
        scoreGrowth: Number
    },
    reason: { type: String, enum: ['UPDATE', 'CREATION', 'TASK_CHANGE', 'TASK_CREATION', 'KPI_CHANGE', 'STATUS_CHANGE', 'CRON', 'MANUAL', 'STARTED'] } //el snapshot se toma cada tanto, permite flexibilizar la toma de información, decisiones y hacerlo más robusto y escalable
}, { timestamps: true })


//acá haremos HASH

RRHHObjectiveSnapshotSchema.add({
    hash: { type: String, index: true },
    parentHash: { type: String },
    version: { type: String, default: '1.0' }
})
RRHHObjectiveSnapshotSchema.pre('save', async function (next) {

    const payload = {
        objectiveId: this.objectiveId,
        progress: this.progress,
        reason: this.reason,
        createdAt: this.createdAt
    }

    this.hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(payload) + (this.parentHash || ''))
        .digest('hex')

    next()
})

RRHHObjectiveSnapshotSchema.index({enterpriseId: 1, objectiveId: 1, createdAt: -1})

module.exports = mongoose.model('RRHHObjectiveSnapshot', RRHHObjectiveSnapshotSchema)