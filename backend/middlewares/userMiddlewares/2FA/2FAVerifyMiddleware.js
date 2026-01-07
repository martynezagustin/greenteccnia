const jwt = require("jsonwebtoken")
const User = require("../../../models/userModel")
const Device = require("../../../models/security/deviceModel")
const validateLogin = require("../validateLogin")
const { decryptData } = require("../security/dataEncrypt")

const verifyTwoFA = async function (req, res) {
    const { userId, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "El usuario es inexistente." })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            return res.status(400).json({ message: "El código 2FA expiró." })
        }
        const decrypted2FA = decryptData(user.security.twoFA.twoFACode)
        if (code !== decrypted2FA) return res.status(403).json({ message: "Código 2FA incorrecto." })
        if (user.isActive == false) {
            return res.status(403).json({ message: "El usuario aún no activó su cuenta. Tiene prohibido su uso." })
        }
        return await validateLogin(req, res, user)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Ocurrió un error de servidor: " + error })
    }
}

module.exports = verifyTwoFA