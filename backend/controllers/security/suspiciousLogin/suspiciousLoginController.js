const mongoose = require("mongoose")
const SuspiciousLogin = require("../../../models/security/suspiciousLoginModel")
const User = require("../../../models/userModel")
const crypto = require("crypto")
const sendTwoFACode = require("../../../middlewares/userMiddlewares/2FA/2FAMiddleware")
const { encryptData } = require("../../../middlewares/userMiddlewares/security/dataEncrypt")

const suspiciousLoginController = {
    setActionByUserSuspiciousLogin: async function (req, res) {
        try {
            const { userId, suspiciousLoginId } = req.params
            const { pendingActionByUser } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(suspiciousLoginId)) {
                return res.status(400).json({ message: "ID de usuario o de login sospechoso inválido." })
            }
            const user = await User.findById(userId)
            console.log(pendingActionByUser)
            if (!user) return res.status(404).json({ messsage: "No se ha encontrado el usuario." })
            const validTypes = ["Confirmado", "Sospechoso", "Notificado"]
            if (!validTypes.includes(pendingActionByUser)) return res.status(400).json({ message: "Los valores de estado proporcionados no son válidos." })
            const updatedSuspiciousLoginStatus = await SuspiciousLogin.findOneAndUpdate({ userId: userId, _id: suspiciousLoginId }, {
                pendingActionByUser: pendingActionByUser
            }, { new: true })
            if (!updatedSuspiciousLoginStatus) return res.status(404).json({ message: "No se ha encontrado el login sospechoso." })
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            const encrypted2FA = encryptData(twoFACode)
            user.security.twoFA.twoFACode = encrypted2FA
            user.security.twoFA.twoFAExpires = twoFAExpires
            await user.save()
            res.cookie("confirmSuspiciousLogin", JSON.stringify({
                _id: updatedSuspiciousLoginStatus._id,
                pendingActionByUser: pendingActionByUser
            }), { httpOnly: true, secure: true, sameSite: "Lax", maxAge: 1000 * 60 * 60 })
            await sendTwoFACode(user.email, twoFACode, "Se ha solicitado cambiar el estado de un inicio de sesión sospechoso.", "Has requerido un cambio de estado de un inicio de sesión sospechoso en tu cuenta. Te enviamos este mail para confirmar la acción y garantizar la seguridad de tu cuenta. Si desconoces esta actividad, ingresa ya mismo a tu panel de usuario.")
            return res.status(200).json({ message: "Se envió un código 2FA a tu email para terminar de confirmar la acción" })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getSuspiciousLogin: async function (req, res) {
        try {
            const { userId, suspiciousLoginId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(suspiciousLoginId)) {
                return res.status(404).json({ message: "ID de usuario o de login sospechoso inválido." })
            }
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const suspiciousLogin = await SuspiciousLogin.findOne({ _id: suspiciousLoginId, userId: user._id })
            if (!suspiciousLogin) return res.status(404).json({ message: " No se ha encontrado el login sospechoso." })
            return res.status(200).json(suspiciousLogin)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getAllSuspiciousLogins: async function (req, res) {
        try {
            const { userId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(404).json({ message: "ID de usuario inválido." })
            }
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const suspiciousLogins = await SuspiciousLogin.find({ userId: user._id, actionByUser: "Notificado" })
            if (suspiciousLogins.length === 0) return res.status(404).json({ message: "No se han encontrado logins sospechosos." })
            return res.status(200).json(suspiciousLogins)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}
module.exports = suspiciousLoginController