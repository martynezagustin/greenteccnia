const roleMiddleware = async function (req,res,next,roles){
    const user = req.user
    if(!roles.includes(user.role)){
        return res.status(403).json({message: "No tienes permisos suficientes para realizar esta operación."})
    }
    next()
} 

module.exports = roleMiddleware