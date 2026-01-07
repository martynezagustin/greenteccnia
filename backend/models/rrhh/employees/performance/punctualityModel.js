const mongoose = require("mongoose")

const PunctualitySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    resultIndexPuntuality: {type: Number},
    date: { type: Date, required: true },
})

module.exports = mongoose.model('Punctuality', PunctualitySchema)