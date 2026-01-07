const mongoose = require("mongoose")

const AssistSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Enterprise", required: true },
    observations: { type: String },
    dateAssist: { type: Date, default: Date.now },
    checkIn: {
        type: Date
    },
    checkOut: {
        type: Date
    },
    hoursWorked: {type: Number},
    assistNow: { type: [Object], default: [] },
    status: { type: String, enum: ["on-time", "absent", "license", "vacations", "late"], required: true },
    transportationMode: {
        type: String,
        enum: ["bicycle",
            "public-transport",
            "on-foot",
            "car",
            "motorcycle",
            "none"
        ],
        default: "car"
    },
    distanceKm: { type: Number },
    remote: {type: Boolean, default: false, required: true},
    fuelType: {
        type: String,
        enum: ["naphta", "diesel", "electric", "GNC", "none"],
        default: "none"
    },
    carbonFootprintForAssist: {
        value: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        unit: { type: String, enum: ["kgCO₂eq"], default: "kgCO₂eq" }
    },
    punctualityStatus: { type: String, enum: ['PUNTUAL', 'TARDE', 'MUY TARDE'] },
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


module.exports = mongoose.model("Assist", AssistSchema)