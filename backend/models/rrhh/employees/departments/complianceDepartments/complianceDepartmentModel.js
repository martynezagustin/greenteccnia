const mongoose = require('mongoose')

const ComplianceDepartmentSchema = new mongoose.Schema({
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: 'Enterprise'},
    parityGender:{
        nonBinary: {type: Number, default: 0},
        male: {type: Number, default: 0},
        female: {type: Number, default: 0},
        other: {type: Number, default: 0},
        preferNotToSayIt: {type: Number, default: 0}
    }
})

module.exports = mongoose.model('ComplianceDepartment', ComplianceDepartmentSchema)