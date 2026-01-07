const mongoose = require("mongoose")

const ClientSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise" },
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    age: { type: Number, required: true },
    categoryIVA: {
        type: String,
        enum: [
            "Consumidor Final",
            "IVA Responsable Inscripto",
            "Persona Jurídica",
            "Cliente del Exterior",
            "Monotributo Social",
            "Sujeto no Categorizado",
            "Proveedor del Exterior",
            "IVA Sujeto Exento",
            "Responsable Monotributo",
            "IVA Liberado",
            "IVA no Alcanzado",
            "Monotributista Trabajador Independiente Promovido"
        ],
        required: true
    },
    tags: {
        type: String,
        enum: [
            "VIP",
            "Potencial",
            "En riesgo"
        ]
    },
    tasks: [{
        description: { type: String },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: Date.now },
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
    }],
    notes: [{
        note: { type: String }
    }],
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
    negotiations: [{type: mongoose.Schema.Types.ObjectId, ref: "Negotiation"}]
})

module.exports = mongoose.model("Client", ClientSchema)