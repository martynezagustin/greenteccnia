const mongoose = require("mongoose")

const RecoveryKeySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    recoveryKey: { type: String, required: true, minlegth: 6 },
    recoveryKeyCreatedAt: {type: Date, default: Date.now},
    recoveryKeyUsed: {type: Boolean}
})

module.exports = mongoose.model("RecoveryKey", RecoveryKeySchema)