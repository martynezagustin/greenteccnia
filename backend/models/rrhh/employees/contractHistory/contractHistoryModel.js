const mongoose = require("mongoose")

const ContractHistorySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    startDate: { type: Date, required: true },
    registrationDate: { type: Date, required: true },
    endDate: { type: Date }
})

module.exports = mongoose.model("ContractHistory", ContractHistorySchema)