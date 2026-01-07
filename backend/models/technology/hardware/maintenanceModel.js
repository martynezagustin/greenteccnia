const mongoose = require("mongoose")

const MaintenanceSchema = new mongoose.Schema({
    hardwareId: { type: mongoose.Schema.Types.ObjectId, ref: "Hardware" },
    description: { type: String },
    date: { type: Date, default: Date.now },
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

module.exports = mongoose.model("Maintenance", MaintenanceSchema)