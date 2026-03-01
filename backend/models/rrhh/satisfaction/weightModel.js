const mongoose = require('mongoose')

const WeightSchema = new mongoose.Schema({
    enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise', unique: true, required: true },
    satisfaction: { type: Number, default: 0.5, required: true },
    workEnvironment: { type: Number, default: 0.2, required: true },
    relationshipWithTeam: { type: Number, default: 0.3, required: true }
})

WeightSchema.pre('save', function (next) {
    const total = this.satisfaction + this.workEnvironment + this.relationshipWithTeam
    if (total === 0) {
        this.satisfaction = 0.33
        this.workEnvironment = 0.33
        this.relationshipWithTeam = 0.34
    } else {
        this.satisfaction = parseFloat((this.satisfaction / total).toFixed(4))
        this.workEnvironment = parseFloat((this.workEnvironment / total).toFixed(4))
        this.relationshipWithTeam = parseFloat((this.relationshipWithTeam / total).toFixed(4))

        const newTotal = this.satisfaction + this.workEnvironment + this.relationshipWithTeam
        if(newTotal != 1){
            this.relationshipWithTeam += (1- newTotal) 
        }
    }
    console.log('Pesos normalizados para GreenTeccnia: ' + this.satisfaction + ', ' + this.workEnvironment + ', ' + this.relationshipWithTeam);
    next()
})

module.exports = mongoose.model('Weight', WeightSchema)