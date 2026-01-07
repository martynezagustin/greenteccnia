const User = require("../../../../models/userModel")
const LogUser = require("../../../../models/logs/logUserModel")
const { decrypt2FA } = require("../../../../middlewares/userMiddlewares/security/dataEncrypt")

const setDeleteAccountOfUser = async function (req, res) {
    const { userId, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "El usuario es inexistente." })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en la eliminación de cuenta",
                details: "El usuario ha intentado eliminar su cuenta pero el código 2FA había expirado.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(400).json({ message: "El código 2FA expiró." })
        }
        const decrypted2FA = decryptData(user.security.twoFA.twoFACode)
        if (decrypted2FA !== code) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en la eliminación de cuenta",
                details: "El usuario ha intentado eliminar su cuenta pero el código 2FA es incorrecto.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(401).json({ message: "Código 2FA incorrecto." })
        }
        const userDeleted = await User.findByIdAndDelete(user._id)
        if (!userDeleted) return res.status(404).json({ message: "No se ha encontrado tu usuario." })
        return res.status(200).json({ message: "Has eliminado tu usuario con éxito." })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error de servidor: " + error })
    }
}

module.exports = setDeleteAccountOfUser