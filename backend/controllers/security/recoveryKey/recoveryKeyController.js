const mongoose = require("mongoose")
const RecoveryKey = require("../../../models/security/recoveryKeyModel")
const User = require("../../../models/userModel")
const bcrypt = require("bcrypt")
const { encryptData, decryptData } = require("../../../middlewares/userMiddlewares/security/dataEncrypt")

const recoveryKeyController = {
    addRecoveryKey: async function (req, res) {
        try {
            const { recoveryKey } = req.body
            const { userId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const recoveryKeyExists = await RecoveryKey.findOne({ userId: user._id })
            if (recoveryKeyExists) return res.status(400).json({ message: "El usuario ya tiene una clave de recuperación." })
            if (!recoveryKey) return res.status(400).json({ message: "La clave de recuperación es requerida." })
            if (recoveryKey.length < 6) return res.status(400).json({ message: "La clave de recuperación debe tener como mínimo 6 caracteres." })
            const encryptedRecoveryKey = encryptData(recoveryKey)
            const newRecoveryKey = new RecoveryKey({
                userId: user._id,
                recoveryKey: encryptedRecoveryKey
            })
            user.recoveryKey = newRecoveryKey._id
            await newRecoveryKey.save()
            await user.save()
            return res.status(200).json({ message: "Clave de recuperación añadida correctamente." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getRecoveryKey: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const recoveryKey = await RecoveryKey.findOne({ userId: user._id })
            if (!recoveryKey) return res.status(404).json({ message: "No se ha encontrado la clave de recuperación." })
            const decryptedRecoveryKey = decryptData(recoveryKey.recoveryKey)
            return res.status(200).json({ isValid: true, recoveryKey: decryptedRecoveryKey })
        }
        catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = recoveryKeyController