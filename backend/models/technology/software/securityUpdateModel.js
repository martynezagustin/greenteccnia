const mongoose = require("mongoose")

const SecurityUpdateSchema = new mongoose.Schema({
    softwareId: { type: mongoose.Schema.Types.ObjectId },
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

module.exports = mongoose.model("SecurityUpdate", SecurityUpdateSchema)