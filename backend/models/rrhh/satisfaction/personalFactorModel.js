const mongoose = require("mongoose")

const PersonalFactorSchema = new mongoose.Schema({
    ageRange: { type: String, enum: ['18-25', '26-35', '36-45', '46-60', '+60'] },
    department: { type: String },
    tenure: { type: Number },
    educationLevel: { type: String, enum: ['Sin estudios secundarios', 'Secundario', 'Terciario', 'Universitario', 'Posgrado', 'Otro'] },
}, { timestamps: true })

module.exports = mongoose.model('PersonalFactor', PersonalFactorSchema)