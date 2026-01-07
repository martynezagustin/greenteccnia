const mongoose = require('mongoose')

const EvidenceSchema = new mongoose.Schema({
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise'},
    objectiveId: {type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjective', required: true},
    taskId: {type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjectiveTask'},
    type: {type: String, enum : ['FILE', 'COMMENT', 'LINK']},
    fileUrl: {type: String},
    uploadedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}    
})

module.exports = mongoose.model('Evidence', EvidenceSchema)