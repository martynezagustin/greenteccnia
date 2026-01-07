const Device = require("../../models/security/deviceModel")
const LogUser = require("../../models/logs/logUserModel")
const jwt = require("jsonwebtoken")
const axios = require("axios")

const validateLogin = async function (req, res, user) {
    try {
        const { isMobile, isTablet, isDesktop, browser, os } = req.useragent
        req.token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "7d" })
        res.cookie("token", req.token, { httpOnly: false, secure: false, sameSite: "Lax", maxAge: 1000 * 60 * 60 * 24 * 7 })
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        let deviceType = isMobile ? "Móvil" : isTablet ? "Tablet" : "Escritorio";
        const device = await Device.findOneAndUpdate(
            { userId: user._id, ip },
            { deviceType, lastLogin: new Date(), os: os, browser: browser },
            { upsert: true, new: true }
        )
        await device.save()
        const newLog = new LogUser({
            userId: user._id, event: "Inicio de sesión exitoso",
            details: "El usuario inició sesión de manera exitosa.",
            date: new Date(),
            clasificationSecurity: "Normal"
        })
        await newLog.save()
        user.security.logsData.push(newLog._id)
        await user.save()
        return res.status(200).json({ userId: user._id, message: "Has iniciado sesión con éxito. 😊" })
    } catch (error) {
        return res.status(200).json({ error: "Error al iniciar sesión." + error })
    }
}

module.exports = validateLogin