const mongoose = require("mongoose")
const Device = require("../../models/security/deviceModel")
const User = require("../../models/userModel")
const SuspiciousLogin = require("../../models/security/suspiciousLoginModel")

const deviceController = {
    getDevice: async function (req, res) {
        try {
            const { userId, deviceId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(deviceId)) return res.status(404).json({ message: "ID de usuario o de dispositivo inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const device = await Device.findOne({
                userId: user._id,
                _id: deviceId
            })
            if (!device) return res.status(404).json({ message: "No se encontró el dispositivo." })
            return res.status(200).json(device)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteDevice: async function (req, res) {
        try {
            const { userId, deviceId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(deviceId)) return res.status(404).json({ message: "ID de usuario o de dispositivo inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const deletedDevice = await Device.findOneAndDelete({
                userId: user._id,
                _id: deviceId
            })
            if (!deletedDevice) return res.status(404).json({ message: "No se ha encontrado el dispositivo." })
            return res.status(200).json({ message: "Eliminado con éxito.", deletedDevice })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getDeviceForTrusted: async function (req, res) {
        try {
            const { userId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const deviceCookie = req.cookies.confirmDevice
            if (!deviceCookie) return res.status(404).json({ message: "No hay una cookie al respecto." })
            const parseDeviceCookie = JSON.parse(deviceCookie)
            const device = await Device.findOne(
                { userId: user._id, deviceType: parseDeviceCookie.deviceType, os: parseDeviceCookie.os, browser: parseDeviceCookie.browser, isTrusted: false }
            )
            if (!device) {
                return res.status(404).json({ message: "No se ha encontrado el dispositivo a registrar. Vuelve a iniciar sesión." })
            }
            console.log(device)
            return res.status(200).json(device)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    setTrustedDevice: async function (req, res) {
        try {
            const { userId, deviceId } = req.params
            const { isTrusted } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(deviceId)) return res.status(404).json({ message: "ID de usuario o dispositivo inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const device = await Device.findOneAndUpdate({
                userId: user._id,
                _id: deviceId
            }, {
                isTrusted: isTrusted
            }, {
                new: true
            })
            if (!device) return res.status(404).json({ message: "No se ha encontrado el dispositivo y no se ha podido actualizar." })
            const suspiciousLogin = await SuspiciousLogin.findOneAndUpdate({ userId: user._id, os: device.os, browser: device.browser, ip: device.ip }, { actionByUser: "Confirmado" }, { new: true })
            if (!suspiciousLogin) return res.status(200).json({ message: "No se ha encontrado el inicio de sesión sospechoso." })
            return res.status(200).json({ message: "Dispositivo actualizado con éxito", device, suspiciousLogin })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = deviceController