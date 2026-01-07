const mongoose = require('mongoose')

const RRHHObjectiveCommentSchema = new mongoose.Schema({
    objectiveId: {type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective'},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    comment: {type: String, required: true},
    role: {type: String, enum: ['EMPLOYEE', 'MANAGER', 'HR']}
})

module.exports = mongoose.model('RRHHObjectiveComment', RRHHObjectiveCommentSchema)