const mongoose = require("mongoose")

const ReportSchema = new mongoose.Schema({
    assistId: { type: mongoose.Schema.Types.ObjectId, ref: "Assist" },
    paperUsage: {
        value: { type: Number, default: 0 },
        recycled: { type: Boolean, default: false },
        factor: { type: Number }
    },
    wasteGenerated: {
        process: { type: String, enum: ["Vertederos", "Incineración", "Reciclaje"] },
        value: { type: Number, default: 0 },
        factor: { type: Number }
    },
    otherEmissionsCO2: {
        value: { type: Number, default: 0 },
        source: { type: String, enum: ["Energía", "Maquinaria", "Residuos"] },
        factor: { type: Number }
    },
    internalTransport: {
        distanceKm: { type: Number },
        fuelType: {
            type: String, enum: ["Nafta", "Diesel", "Eléctrico", "Gas Natural Comprimido", "No aplica"], default: "No aplica"
        },
        transportationMode: {
            type: String,
            enum: ["Bicicleta",
                "Transporte público",
                "Caminata",
                "Automóvil",
                "Motocicleta",
                "No aplica"
            ],
            default: "Automóvil"
        },
        factor: { type: Number }
    },
    chemicalUsage: {
        type: { type: String, enum: ["Detergentes", "Pinturas", "Solventes", "Otros"] },
        value: { type: Number, default: 0 },
        riskLevel: { type: String, enum: ["Bajo", "Medio", "Alto"] },
        factor: { type: Number }
    },
    consumptionKwh: { type: Number, default: 0 },
    carbonFootprintKG: { type: Number, default: 0 },
    uses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Use" }],
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
}, { timestamps: true })


module.exports = mongoose.model("Report", ReportSchema)