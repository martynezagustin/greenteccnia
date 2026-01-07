const mongoose = require("mongoose")

const CategorySchema = new mongoose.Schema({
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey" },
    conditions: { type: Number, min: 1, max: 5 },
    leadership: { type: Number, min: 1, max: 5 },
    recognition: { type: Number, min: 1, max: 5 },
    balance: { type: Number, min: 1, max: 5 },
    motivation: { type: Number, min: 1, max: 5 },
    globalIndex: { type: Number, min: 1, max: 5 }
})

CategorySchema.pre('save', function (next) {
    const values = Object.values(this.toObject()).
        filter(v => typeof v === 'number' && v !== this.globalIndex)
    if (values.length > 0) {
        this.globalIndex = values.reduce((acc, val) => acc + val, 0) / values.length
    }
    next()
})

module.exports = mongoose.model('Category', CategorySchema)