const mongoose = require('mongoose')

const ProgressSnapshotSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
    date: { type: Date },
    metrics: {
        active: {type: Number, required: true},
        warning: {type: Number, required: true},
        planned: {type: Number, required: true}
    },
    overallProgress: {type: Number, required: true}
})

ProgressSnapshotSchema.index({enterpriseId: 1, date: 1}, {unique: true})

module.exports = mongoose.model('ProgressSnapshot', ProgressSnapshotSchema)