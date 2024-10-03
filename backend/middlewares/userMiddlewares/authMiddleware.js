const jwt = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {
    const token = req.headers["authorization"]
    if (!token) {
        return res.status(403).json({ message: "Access denied. No token provided." })
    }
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Token no válido." })
        }
        req.user = decoded
        next()
    })
}

module.exports = authMiddleware