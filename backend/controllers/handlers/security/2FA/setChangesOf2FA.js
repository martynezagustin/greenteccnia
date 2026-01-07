const User = require("../../../../models/userModel")
const LogUser = require("../../../../models/logs/logUserModel")

const setChangesOf2FA = async function (req, res) {
    const { userId, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "El usuario es inexistente." })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en actualización de autenticación multifactor",
                details: "El usuario ha intentado ctualizar su estado de autenticación multifactor pero el código 2FA había expirado.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.logsData.push(newLog._id)
            await user.save()
            return res.status(400).json({ message: "El código 2FA expiró." })
        }
        if (user.security.twoFA.twoFACode !== code) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en actualización de autenticación multifactor",
                details: "El usuario ha intentado actualizar su estado de autenticación multifactor pero el código 2FA es incorrecto.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.logsData.push(newLog._id)
            await user.save()
            return res.status(401).json({ message: "Código 2FA incorrecto." })
        }
        user.security.twoFA.twoFAActived = user.security.twoFA.pendingTwoFA
        const newLog = new LogUser({
            userId: user._id,
            event: "Actualización en la autenticación multifactor",
            details: "El usuario ha actualizado el estado de su autenticación multifactor con éxito.",
            date: new Date(),
            clasificationSecurity: "Normal"
        })
        await newLog.save()
        user.logsData.push(newLog._id)
        await user.save()
        return res.status(200).json({message: "Autenticación multifactor actualizada con éxito."})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error de servidor: " + error })
    }
}

module.exports = setChangesOf2FA