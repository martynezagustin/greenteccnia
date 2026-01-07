const mongoose = require("mongoose")

const SurveyHistorySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    snapshots: [Object],
    lastIndex: {type: Number}
}, { timestamps: true })

module.exports = mongoose.model("SurveyHistory", SurveyHistorySchema)