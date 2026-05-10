const mongoose = require('mongoose')

const ClassificationObjectiveSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise' },
    name: { type: String, required: true },
    description: {type: String, required: true},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
})

module.exports = mongoose.model('Classification', ClassificationObjectiveSchema)