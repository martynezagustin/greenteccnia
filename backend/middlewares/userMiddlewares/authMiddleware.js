const jwt = require("jsonwebtoken")
const User = require("../../models/userModel")

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token
    console.log("Token?", token)
    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." })
    }
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token no válido. Inicia sesión." })
        }
        const user = await User.findById(decoded.userId)
        if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
        req.user = user
        next()
    })
}

module.exports = authMiddleware