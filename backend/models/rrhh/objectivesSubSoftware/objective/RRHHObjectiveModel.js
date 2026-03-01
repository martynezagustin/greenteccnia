const mongoose = require('mongoose')

const RRHHObjectiveSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    clasification: { type: mongoose.Schema.Types.ObjectId, ref: 'Clasification' },
    status: { type: String, enum: ['PLANNED', 'WARNING', 'ACTIVE', 'COMPLETED', 'EXPIRED'], default: 'PLANNED' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })



module.exports = mongoose.model('RRHHObjective', RRHHObjectiveSchema)