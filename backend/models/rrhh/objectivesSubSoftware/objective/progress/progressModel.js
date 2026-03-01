const mongoose = require('mongoose')

const ProgressSchema = new mongoose.Schema({
    taskProgress: { type: Number, default: 0 },
    score: { type: Number, default: 0 }
})

module.exports = mongoose.model('Progress', ProgressSchema)