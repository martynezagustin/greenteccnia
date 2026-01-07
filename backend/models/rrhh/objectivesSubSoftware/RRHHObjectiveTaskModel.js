const mongoose = require('mongoose')

const RRHHObjectiveTaskSchema = new mongoose.Schema({
    objectiveId: {type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective'},
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise'},
    title:{type: String, required: true},
    description: {type: String, required: true},
    status: {type: String, enum: ['PLANNED', 'IN_PROGRESS', 'ABANDONED', 'COMPLETED'], default: 'PLANNED'},
    weight: {type: Number, default: 1, min: 1, max: 10},
    difficulty: {type: String, enum: ['LOW', 'MEDIUM', 'HIGH']},
    startDate: Date,
    dueDate: Date,
    completedAt: Date,
    dependencies: [{type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjectiveTask'}]
}, {timestamps: true})

module.exports = mongoose.model('RRHHObjectiveTask', RRHHObjectiveTaskSchema)