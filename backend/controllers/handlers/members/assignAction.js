const User = require("../../../models/userModel")

const assignAction = async (req, res, enterprise) => {
    const user = req.user
    
    const userExists = await User.findOne({ _id: user._id, enterprise: enterprise._id })
    if (!userExists) return res.status(404).json({ message: "No se ha encontrado el usuario." })
    return { _id: userExists._id, username: userExists.username, position: userExists.position }
}


module.exports = assignAction