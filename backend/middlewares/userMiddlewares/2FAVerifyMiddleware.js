const jwt = require("jsonwebtoken")
const User = require("../../models/userModel")

const verifyTwoFA = async function(req,res){
    const {userId, code} = req.body
    try {
        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({message: "El usuario es inexistente."})
        }
        if(user.twoFAExpires < Date.now()){
            return res.status(400).json({message: "El código 2FA expiró."})
        }
        if(user.twoFACode !== code){
            return res.status(401).json({message: "Código 2FA incorrecto."})
        }
        if(user.isActive == false){
            return res.status(403).json({message: "El usuario aún no activó su cuenta. Tiene prohibido su uso."})
        }
        req.token = jwt.sign({userId: user._id}, process.env.SECRET_KEY, {expiresIn: "60m"})
        req.userId = user._id
        user.logsData.push({event: "Inicio de sesión seguro", details: "El usuario inició sesión con éxito."})
        await user.save()
        res.json({token: req.token, userId: req.userId})
    } catch (error) {
        return res.status(500).json({error: "Ocurrió un error de servidor: " + error})
    }
}

module.exports = verifyTwoFA