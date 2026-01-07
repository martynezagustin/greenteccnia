const User = require("../../../../models/userModel")
const LogUser = require("../../../../models/logs/logUserModel")
const SuspiciousLogin = require("../../../../models/security/suspiciousLoginModel")
const { decryptData } = require("../../../../middlewares/userMiddlewares/security/dataEncrypt")

const setChangesOfSuspiciousLogin = async function (req, res) {
    const { userId, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "El usuario es inexistente." })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            const newLog = new LogUser({
                userId: user._id,
                event: "Error en actualización de inicio de sesión sospechoso",
                details: "El usuario ha intentado actualizar un inicio de sesión sospechoso pero el código 2FA había expirado.",
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
                event: "Error en actualización de inicio de sesión sospechoso",
                details: "El usuario ha intentado actualizar un inicio de sesión sospechoso pero el código 2FA es incorrecto.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(401).json({ message: "Código 2FA incorrecto." })
        }
        const cookieSuspiciousLogin = req.cookies.confirmSuspiciousLogin
        if (!cookieSuspiciousLogin) return res.status(404).json({ message: "No se ha encontrado la cookie para confirmar el estado del inicio de sesión sospechoso." })
        const parseCookie = JSON.parse(cookieSuspiciousLogin);
        console.log(parseCookie)
        if (!parseCookie) {
            return res.status(404).json({ message: "El inicio de sesión no se marcó como sospechoso." });
        }
        console.log(parseCookie);
        
        const updatedSuspiciousLogin = await SuspiciousLogin.findOneAndUpdate({ userId: user._id, _id: parseCookie._id }, { actionByUser: parseCookie.pendingActionByUser }, { new: true })
        if (!updatedSuspiciousLogin) return res.status(404).json({ message: "No se ha encontrado el inicio de sesión sospechoso." })
        const newLog = new LogUser({
            userId: user._id,
            event: "Actualización de inicio de sesión sospechoso",
            details: "El usuario actualizó el estado de su inicio de sesión sospechoso.",
            date: new Date(),
            clasificationSecurity: "Advertencia"
        })
        await newLog.save()
        user.security.logsData.push(newLog._id)
        await user.save()
        res.clearCookie("confirmSuspiciousLogin")
        return res.status(200).json({ message: "Inicio de sesión sospechoso actualizado con éxito.", updatedSuspiciousLogin })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error de servidor: " + error })
    }
}

module.exports = setChangesOfSuspiciousLogin
