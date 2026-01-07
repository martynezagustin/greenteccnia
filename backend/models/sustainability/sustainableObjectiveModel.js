const mongoose = require("mongoose")

const SustainableObjectiveSchema = new mongoose.Schema({
    sustainabilityEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainability" },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now, required: true },
    status: { type: String, enum: ["Pendiente", "En progreso", "Planificado", "Completado"] },
    impact: { type: String, enum: ["Bajo", "Mediano", "Alto"] },
    relationWithODS: {
        type: String, enum: [
            "1 - Fin de la pobreza",
            "2 - Hambre cero",
            "3 - Salud y bienestar",
            "4 - Educación de calidad",
            "5 - Igualdad de género",
            "6 - Agua limpia y saneamiento",
            "7 - Energía asequible y no contaminante",
            "8 - Trabajo decente y crecimiento económico",
            "9 - Industria, innovación e infraestructura",
            "10 - Reducción de las desigualdades",
            "11 - Ciudades y comunidades sostenibles",
            "12 - Producción y consumo responsables",
            "13 - Acción por el clima",
            "14 - Vida submarina",
            "15 - Vida de ecosistemas terrestres",
            "16 - Paz, justicia e instituciones sólidas",
            "17 - Alianzas para lograr los objetivos"
        ]
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

module.exports = mongoose.model("SustainableObjective", SustainableObjectiveSchema)