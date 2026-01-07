const User = require("../../../../models/userModel")
const LogUser = require("../../../../models/logs/logUserModel")
const { decryptData } = require("../../../../middlewares/userMiddlewares/security/dataEncrypt")

const setChangesOfPassword = async function (req, res) {
    const { userId, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "El usuario es inexistente." })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en actualización de contraseña",
                details: "El usuario ha intentado actualizar su contraseña pero el código 2FA había expirado.",
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
                event: "Error en actualización de contraseña",
                details: "El usuario ha intentado actualizar su contraseña pero el código 2FA es incorrecto.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(401).json({ message: "Código 2FA incorrecto." })
        }
        user.security.password.currentPassword = user.security.password.pendingPassword
        user.security.password.pendingPassword = null
        await user.save()
        return res.status(200).json({ message: "Contraseña actualizada con éxito." })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error de servidor: " + error })
    }
}

module.exports = setChangesOfPassword
