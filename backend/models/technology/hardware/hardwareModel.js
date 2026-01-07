const mongoose = require("mongoose")

const HardwareModel = new mongoose.Schema({
    type: {
        type: String, required: true, enum: [
            "Servidor",
            "Computadora de Escritorio",
            "Laptop",
            "Impresora",
            "Router",
            "Conmutador",
            "Celular",
            "Tablet",
            "Monitor",
            "Otro"
        ]
    },
    model: { type: String, required: true },
    value: { type: Number, default: 0 },
    manufacturer: { type: String, required: true },
    technologyId: { type: mongoose.Schema.Types.ObjectId, ref: "Technology" },
    maintenances: [{
        type: mongoose.Schema.Types.ObjectId, ref: "Maintenance"
    }],
    uses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Use" }],
    consumptionW: { type: Number, default: 0 },
    carbonFootprintTotal: {
        carbonFootprintG: { type: Number },
        carbonFootprintKG: { type: Number },
        carbonFootprintLB: { type: Number },
        carbonFootprintMT: { type: Number }
    },
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

module.exports = mongoose.model("Hardware", HardwareModel)