const mongoose = require("mongoose")

const UseSchema = new mongoose.Schema({
    hardwareId: { type: mongoose.Schema.Types.ObjectId, ref: "Hardware" },
    detailsOrNotes: { type: String },
    employee: {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        name: { type: String, required: true },
        lastname: { type: String, required: true },
    },
    hours: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    consumptionKwh: { type: Number, default: 0 },
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    }
})


module.exports = mongoose.model("Use", UseSchema)