const mongoose = require("mongoose")

const AuditSchema = new mongoose.Schema({
    sustainabilityEnterprise: { type: mongoose.Schema.Types.ObjectId, ref: "Sustainability" },
    date: { type: Date, default: Date.now },
    observations: [{ type: String, required: true }],
    objectivesInvolved: [{
        sustainableObjectiveId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableObjective" },
        title: { type: String }
    }],
    tasksInvolved: [{
        sustainableTaskId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainableTask" },
        name: { type: String }
    }],
    scope: {
        type: String, required: true,
        enum: ["Operativo", "Corporativo", "Infraestructura", "Logística", "Producción", "Otros"],
        required: true
    },
    status: { type: String, enum: ["Planificada", "En progreso", "Completada"], default: "Planificada" },
    documents: [{
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],
    phasePDAC: { type: String, enum: ["Planificar", "Hacer", "Verificar", "Actuar"], required: true },
    notificationStatus: { type: String, enum: ["Notificada", "Por notificar"] },
    teamAuditor: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        name: { type: String },
        lastname: { type: String },
        email: { type: String },
        identityCard: { type: String }
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
}, {
    timestamps: true
})

module.exports = mongoose.model("Audit", AuditSchema)