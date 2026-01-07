const mongoose = require("mongoose")

const DepartmentSchema = new mongoose.Schema({
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: "Enterprise"},
    name: {type: String, required: true},
    description: {type: String, required: true},
    employees: [{type: mongoose.Schema.Types.ObjectId, ref: "Employees"}],
    compliance: {type: mongoose.Schema.Types.ObjectId, ref: 'ComplianceDepartment'}
}, {timestamps: true})

module.exports = mongoose.model('Department', DepartmentSchema)