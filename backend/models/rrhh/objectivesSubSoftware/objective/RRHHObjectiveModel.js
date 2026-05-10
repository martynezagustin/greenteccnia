const mongoose = require('mongoose')

const RRHHObjectiveSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    classification: { type: mongoose.Schema.Types.ObjectId, ref: 'Classification' },
    status: { type: String, enum: ['PLANNED', 'WARNING', 'ACTIVE', 'COMPLETED', 'EXPIRED'], default: 'PLANNED' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })



module.exports = mongoose.model('RRHHObjective', RRHHObjectiveSchema)