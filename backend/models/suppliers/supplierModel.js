const mongoose = require("mongoose")

const SupplierSchema = new mongoose.Schema({
    enterpriseId: {type: mongoose.Schema.Types.ObjectId, ref: "Enterprise"},
    name: {type: String, required: true},
    phone: {type: String, required: true},
    siteWeb: {type: String, required: true},
    category: {type: String, required: true},
    address: {type: String, required: true},
    description: {type: String, required: true},
    taxCategory: {type: String, required: true},
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
}, {timestamps: true})

module.exports = mongoose.model("Supplier", SupplierSchema)