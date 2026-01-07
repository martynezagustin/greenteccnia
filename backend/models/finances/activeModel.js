const mongoose = require("mongoose")

const ActiveSchema = new mongoose.Schema({
    financeId: { type: mongoose.Schema.Types.ObjectId, ref: "Finance" },
    category: {
        type: String,
        enum: [
            "Activo corriente",
            "Activo no corriente",
            "Activo intangible"
        ],
        required: true
    },
    typeAccount: { type: String, enum: ["Caja", "Bancos", "Inversiones a corto plazo", "Suministros", "Inventario", "Cuentas por cobrar", "Inventarios", "Otros activos corrientes", "Bienes inmuebles", "Maquinaria", "Vehículos", "Muebles y enseres", "Equipos de procesos informáticos", "Otros activos no corrientes", "Patentes", "Marcas registradas", "Derechos de autor", "Software", "Otros activos intangibles", "Obras en curso", "Inversiones a largo plazo", "Otros activos no corrientes"] },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true, required: true },
    details: { type: String, required: true },
    hardwareId: { type: mongoose.Schema.Types.ObjectId, ref: "Hardware" },
    softwareId: { type: mongoose.Schema.Types.ObjectId, ref: "Software" },
    createdBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    updatedBy: {
        username: { type: String },
        position: { type: String },
        date: { type: Date, default: Date.now }
    },
    type: { type: String, enum: ["active"], required: true }
})

module.exports = mongoose.model("Active", ActiveSchema)