const mongoose = require("mongoose")
const User = require("../../models/userModel")
const UxUserSchema = require("../../models/ux/uxUserModel")

const uxUserController = {
    changeDarkTheme: async function (req, res) {
        try {
            const { userId } = req.params
            const { darkMode } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario" })
            const updatedUxOption = await UxUserSchema.findOneAndUpdate({ userId: user._id }, { darkMode: darkMode })
            if (!updatedUxOption) return res.status(404).json({ message: " No se encontró el módulo de UX del usuario." })
            return res.status(200).json(updatedUxOption)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    changeFont: async function (req, res) {
        try {
            const { userId } = req.params
            const { montserratFont } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const uxOptions = await UxUserSchema.findOneAndUpdate({ userId: user._id }, { montserratFont: montserratFont }, { new: true })
            return res.status(200).json({ message: "Fuente", uxOptions })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    changeButtonsStyle: async function (req, res) {
        try {
            const { userId } = req.params
            const { roundedButtons } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const uxOptions = await UxUserSchema.findOneAndUpdate({ userId: user._id }, { roundedButtons: roundedButtons }, { new: true })
            return res.status(200).json({ message: "Bordes redondeados", uxOptions })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    setMonochrome: async function (req, res) {
        try {
            const { userId } = req.params
            const { monochromeStatus } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const uxOptions = await UxUserSchema.findOneAndUpdate({ userId: user._id }, { monochrome: monochromeStatus, darkMode: false }, { new: true })
            return res.status(200).json({ message: "Estado del monocromático", uxOptions })
        } catch (error) {

        }
    },
    getUxOptions: async function (req, res) {
        try {
            const { userId } = req.params
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario" })
            const uxOptions = await UxUserSchema.findOne({
                userId: user._id
            })
            return res.status(200).json({ message: "Tema oscuro:", uxOptions })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = uxUserController