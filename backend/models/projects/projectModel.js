const mongoose = require("mongoose")

const ProjectSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    justification: { type: String, required: true },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true, default: Date.now },
    budget: { type: Number, required: true },
    methodology: { type: String, enum: ["Ágil", "Scrum", "Cascada", "Kanban"], required: true },
    tasksAssigned: [{
        task: { type: String },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ["Pendiente", "En progreso", "Completada"],
            default: "Pendiente"
        }
    }],
    costs: [{
        description: { type: String },
        amount: { type: Number },
        type: { type: String, enum: ["Iniciales", "Operativos", "Financieros"] },
    }],
    ambientalImpact: {
        waterConsumptionReduction: {
            value: { type: Number, required: true, value: 0 },
            unit: { type: String, enum: ["litros", "galones", "onzas", "m³"] },
            frequency: { type: String, enum: ["hora", "día", "mes", "año"], default: "día" }
        },
        energyConsumptionReduction: {
            value: { type: Number, required: true, value: 0 },
            unit: { type: String, enum: ["kWh"], required: true },
            frequency: { type: String, enum: ["hora", "día", "mes", "año"], default: "día" }
        },
        CO2ConsumptionReduction: {
            value: { type: Number, required: true, value: 0 },
            unit: { type: String, enum: ["kg"], default: "kg", required: true },
            frequency: { type: String, enum: ["hora", "día", "mes", "año"], default: "día" }
        },
        scrapsReduction: {
            value: { type: Number, required: true, value: 0 },
            unit: { type: String, enum: ["kg", "lbs", "t"], required: true },
            frequency: { type: String, enum: ["hora", "día", "mes", "año"], default: "día" }
        },
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    statusProject: {
        type: String, enum: [
            "Planificado",
            "En progreso",
            "Completado",
            "En espera"
        ], required: true
    },
    percentageProject: { type: Number, required: true },
    logsData: [{
        event: String,
        date: { type: Date, default: Date.now },
        details: String
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
    }
})


module.exports = mongoose.model("Project", ProjectSchema)