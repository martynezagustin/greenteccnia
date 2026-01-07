const mongoose = require("mongoose")

const RRHHSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    workEnvironmentSnapshots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkEnvironmentSnapshot' }],
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }]
})

module.exports = mongoose.model("RRHH", RRHHSchema)