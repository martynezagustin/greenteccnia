const jwt = require("jsonwebtoken")
const User = require("../../models/userModel")

const roleMiddleware = (...requiredRoles) => {
    return async (req, res, next) => {
        try {
            const validTypes = ["Administrador",
                "CEO",
                "Director financiero",
                "Director tecnológico",
                "Miembro del equipo",
                "Líder departamental"]
            if (!requiredRoles.every(role => validTypes.includes(role))) return res.status(400).json({ message: "El rol asignado al usuario no existe como tal en GreenTeccnia+." })

            const token = req.headers["authorization"]
            if (!token) return res.status(403).json({ message: "Access denied. No token provided." })
            const decoded = jwt.verify(token, process.env.SECRET_KEY)

            const user = await User.findById(decoded.userId)
            if (!user) return res.status(401).json({ message: "No se ha encontrado el usuario." })

            if (!requiredRoles.includes(user.position)) return res.status(403).json({ message: "Acceso denegado. No tienes los permisos suficientes." })
            next()
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error al autenticarse." + error })
        }
    }
}

module.exports = roleMiddleware