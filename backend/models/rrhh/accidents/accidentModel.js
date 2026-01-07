const mongoose = require("mongoose")

const AccidentSchema = new mongoose.Schema({
    employee: {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        name: { type: String, required: true },
        lastname: { type: String, required: true }
    },
    date: { type: Date, required: true, default: Date.now },
    place: {
        street: { type: String, required: true },
        city: { type: String, required: true }
    },
    description: { type: String, required: true },
    typeAccident: {
        type: String,
        enum: ["Caída", "Lesión por maquinaria", "Golpe", "Exposición a sustancias peligrosas", "Accidente de tránsito", "Otro"]
    },
    consequences: [{
        injuries: {
            type: { type: String, enum: ["Fractura", "Cortes", "Quemaduras", "Ninguna", "Otra"] },
            gravity: { type: String, enum: ["Leve", "Moderada", "Grave", "Fatal"] }
        },
    }],
    daysOff: { type: Number, required: true },
    medicalAttention: { type: Boolean, required: true },
    nonExistentSymptoms: [{ type: String, required: true }],
    files: [{
        fileName: { type: String, required: true },
        filePath: { type: String, required: true },
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
})

module.exports = mongoose.model("Accident", AccidentSchema)