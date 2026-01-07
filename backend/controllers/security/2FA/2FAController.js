const mongoose = require("mongoose")
const User = require("../../../models/userModel")
const crypto = require("crypto")
const sendTwoFACode = require("../../../middlewares/userMiddlewares/2FA/2FAMiddleware")
const { encryptData } = require("../../../middlewares/userMiddlewares/security/dataEncrypt")

const twoFAController = {
    //para cambiar en el panel de control la 2fa status
    activeOInactiveVerify2FA: async function (req, res) {
        try {
            const { userId } = req.params
            const { status2FA } = req.body
            const user = await User.findById(userId)

            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            const encrypted2FA = encryptData(twoFACode)
            user.security.twoFA.twoFACode = encrypted2FA
            user.security.twoFA.twoFAExpires = twoFAExpires
            user.security.twoFA.pendingTwoFA = status2FA

            await sendTwoFACode(user.email, twoFACode, "Se ha solicitado un cambio de estado en 2FA.", "Has requerido un cambio de estado en la autenticación multifactor. Te enviamos este mail para confirmar la acción y garantizar la seguridad de tu cuenta. Si desconoces esta actividad, ingresa ya mismo a tu panel de usuario.")
            await user.save()
            return res.status(200).json({ message: "Hemos enviado un código 2FA a tu correo para terminar de cambiar el estado de la autenticación multifactor." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
}

module.exports = twoFAController