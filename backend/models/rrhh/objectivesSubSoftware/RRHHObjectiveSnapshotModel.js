const mongoose = require('mongoose')
const crypto = require('crypto')

//Esto congela la realidad en un periodo de tiempo y toma una muestra ;)
const RRHHObjectiveSnapshotSchema = new mongoose.Schema({
    objectiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective' },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
    ownerType: String,
    ownerId: mongoose.Schema.Types.ObjectId, //esto te permitirá filtrar además, responsables en el tiempo, etc
    status: String,
    riskLevel: String,
    progress: {
        taskProgress: { type: Number, default: 0 },
        kpiProgress: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
    },
    kpi: { unit: String, initialValue: Number, targetValue: Number, currentValue: Number, tolerance: Number, formula: String },
    diff: {
        taskGrowth: Number,
        kpiGrowth: Number,
        scoreGrowth: Number
    },
    reason: { type: String, enum: ['UPDATE', 'CREATION', 'TASK_CHANGE', 'KPI_CHANGE', 'STATUS_CHANGE', 'CRON', 'MANUAL'] } //el snapshot se toma cada tanto, permite flexibilizar la toma de información, decisiones y hacerlo más robusto y escalable
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
        score: this.progress.score,
        kpiValue: this.kpi.currentValue,
        reason: this.reason,
        createdAt: this.createdAt
    }

    this.hash = crypto
        .createHash('sha256')
        .update(JSON.stringify(payload) + (this.parentHash || ''))
        .digest('hex')

    next()
})

module.exports = mongoose.model('RRHHObjectiveSnapshot', RRHHObjectiveSnapshotSchema)