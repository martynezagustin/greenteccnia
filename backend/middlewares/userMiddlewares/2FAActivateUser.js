const User = require("../../models/userModel")

const verifyRegistration2FA = async function (req,res) {
    const {userId, code} = req.body
    try {
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: "No se ha localizado el usuario"})
        } 
        if(user.twoFAExpires < Date.now()){
            return res.status(400).json({message: "El código 2FA ha expirado."})
        }
        if(user.twoFACode !== code){
            return res.status(401).json({message: "El código 2FA es incorrecto. Vuelve a intentarlo."})
        }
        user.isActive = true
        user.twoFACode = null
        user.twoFAExpires = null

        await user.save()

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
    }
}

module.exports = verifyRegistration2FA