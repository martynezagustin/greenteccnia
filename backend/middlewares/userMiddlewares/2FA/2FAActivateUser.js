const User = require("../../../models/userModel")
const { decryptData } = require("../security/dataEncrypt")

const verifyRegistration2FA = async function (req, res) {
    const userIdCookie = JSON.parse(req.cookies.userId)
    console.log(userIdCookie)
    const { userId = userIdCookie._id, code } = req.body
    try {
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "No se ha localizado el usuario" })
        }
        if (user.security.twoFA.twoFAExpires < Date.now()) {
            return res.status(400).json({ message: "El código 2FA ha expirado." })
        }
        const decrypted2FA = decryptData(user.security.twoFA.twoFACode)
        if (decrypted2FA !== code) {
            return res.status(401).json({ message: "El código 2FA es incorrecto. Vuelve a intentarlo." })
        }
        user.isActive = true
        user.security.twoFA.twoFACode = null
        user.security.twoFA.twoFAExpires = null

        await user.save()
        res.clearCookie("userId", { httpOnly: false, secure: false, sameSite: "Lax" })
        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
    }
}

module.exports = verifyRegistration2FA