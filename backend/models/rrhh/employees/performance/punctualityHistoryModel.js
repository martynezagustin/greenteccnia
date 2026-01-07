const mongoose = require("mongoose")

const PunctualityHistorySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    records: [{ type: mongoose.Schema.Types.ObjectId, ref: "Punctuality" }],
    generalIndexNumber: { type: Number }
})

module.exports = mongoose.model('PunctualityHistory', PunctualityHistorySchema)