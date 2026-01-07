const mongoose = require('mongoose')

const RRHHObjectiveSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', required: true },
    title: { type: String, required: true },
    dateStart: { type: Date, default: Date.now },
    dateEnd: { type: Date, default: Date.now },
    description: { type: String, required: true },
    //tipos de objetivo
    clasification: [{ type: mongoose.Schema.ObjectId, ref: 'ClasificationObjective', required: true }],
    //quién es el responsable de cumplir? (owner)
    owner: { //polimórfico, te permite cualquier tipo de schemaId
        ownerType: { type: String, enum: ['COMPANY', 'DEPARTMENT', 'EMPLOYEE'] },
        ownerId: { type: mongoose.Schema.Types.ObjectId, required: false }
    },
    //hay involucrados??
    stakeholders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        required: true
    },
    impact: [{
        type: String,
        enum: ['FINANCIAL', 'LEGAL', 'OPERATIONAL', 'REPUTATIONAL', 'ENVIRONMENTAL', 'SUSTAINABILITY']
    }],
    status: { type: String, enum: ['PLANNED', 'IN_PROGRESS', 'AT_RISK', 'CRITICAL', 'PAUSED', 'COMPLETED', 'CANCELLED', 'DEFEATED', 'DRAFT'], default: 'PLANNED' },
    isStarted: { type: Boolean, default: false },
    metricType: { type: String, enum: ['KPI', 'BINARY', 'PROGRESS', 'INTEGRATED'], required: true },
    kpi: {
        unit: String, //puede ser $, moneda, kilowats, lo que se te antoje
        initialValue: Number,
        targetValue: Number,
        currentValue: Number,
        tolerance: Number,
        formula: String
    },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] },
    progress: {
        taskProgress: { type: Number, default: 0 },
        kpiProgress: { type: Number, default: 0 }, //el ejemplo de los 200mil pesos 😉
        score: { type: Number, default: 0 }
    },
    SMARTConditions: { type: mongoose.Schema.Types.ObjectId, ref: 'RRHHSMARTObjective' },
    riskLevel: { type: String, enum: ['GREEN', 'YELLOW', 'RED'], default: 'GREEN' },
    snapshots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RRHHObjectiveSnapshot' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

module.exports = mongoose.model('RRHHObjective', RRHHObjectiveSchema)