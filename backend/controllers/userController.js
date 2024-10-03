const User = require("../models/userModel")
const Enterprise = require("../models/enterpriseModel")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const sendTwoFACode = require("../middlewares/userMiddlewares/2FAMiddleware")

//tokens invalidos
let invalidTokens = []

const userController = {
    registerUser: async function (req, res) {
        const { name, lastname, email,age, position, phone, password, subscriptionPlan, username, nameEnterprise, companySize, businessSector, businessType,} = req.body
        try {
            const userExists = await User.findOne({ $or: [{email}, {username}] })
            const enterpriseExists = await Enterprise.findOne({nameEnterprise})
            if (userExists) {
                return res.status(403).json({ message: "Este usuario ya existe, no puedes volver a crearlo." })
            }
            if(enterpriseExists){
                return res.status(403).json({message: "El nombre de la empresa actualmente está registrado y asociado a una cuenta de GreenTeccnia+. Intente con otro nombre de empresa."})
            }
            //Proceder a crear el usuario
            const hashedPassword = await bcrypt.hash(password, 9)
            const newUser = new User({ name, lastname, age, email, position, phone, password: hashedPassword, subscriptionPlan, username })
            const newEnterprise = new Enterprise({userId: newUser._id, nameEnterprise, companySize, businessSector, businessType})
            newUser.enterprise = newEnterprise._id
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            newUser.twoFACode = twoFACode
            newUser.twoFAExpires = twoFAExpires

            await newEnterprise.save()
            await newUser.save()

            await sendTwoFACode(newUser.email, twoFACode)
            
            res.status(200).json({message: "Usuario registrado con éxito. Chequea tu casilla de mail para activarlo."})
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error + ". Vuelve a intentarlo otra vez." })
        }
    },
    loginUser: async function (req, res) {
        const { username, password } = req.body

        try {
            const userToLogin = await User.findOne({ username })
            if (!userToLogin) {
                return res.status(404).json({ message: "El usuario no existe." })
            }
            if (userToLogin.accountLockedUntil && userToLogin.accountLockedUntil > Date.now()) {
                return res.status(403).json({ message: "Tu cuenta ha sido bloqueada por reiterados inicios de sesión fallidos." }) // se bloquea porque es mayor la fecha de desbloqueo que la actual
            }
            const isValidPassword = await bcrypt.compare(password, userToLogin.password)
            if (!isValidPassword) {
                userToLogin.attemptsToLogin++
                if (userToLogin.attemptsToLogin > 9) {
                    userToLogin.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000)
                }
                await userToLogin.save()
                console.log(userToLogin.attemptsToLogin);
                return res.status(401).json({ message: "Usuario o contraseñas incorrectos." })
            }
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            userToLogin.twoFACode = twoFACode
            userToLogin.twoFAExpires = twoFAExpires

            await userToLogin.save()

            await sendTwoFACode(userToLogin.email, twoFACode)

            userToLogin.attemptsToLogin = 0
            return res.status(200).json({ message: "Se ha enviado un código 2FA a tu correo. Chequéalo y verifica tu inicio de sesión." })

        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    logoutUser: async function (req, res) {
        const token = req.headers["authorization"]
        if (!token) {
            return res.status(401).json({ message: "Acceso denegado." })
        }
        if (invalidTokens.includes(token)) {
            return res.status(401).json({ message: "Token expirado o es inválido." })
        }
        try {
            const decodedToken = jwt.verify(token, process.env.SECRET_KEY)
            const user = await User.findById(decodedToken.userId)

            if (!user) {
                return res.status(404).json({ message: "El usuario no ha sido encontrado." })
            }
            invalidTokens.push(token)
            user.logsData.push({event: "Cierre de sesión",  details: "El usuario ha cerrado sesión con éxito."})
            await user.save()
            res.json({ message: "Sesión cerrada con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    getUserInfo: async function (req, res) {
        try {
            const userId = req.params.userId
            const user = await User.findById(userId)
            if (!user) {
                return res.status(404).json({ message: "No ha sido encontrado el usuario." })
            }
            res.json(user)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error al obtener el usuario" })
        }
    },
    updateUser: async function (req, res) {
        try {
            const { name, lastname, age, email, nameEnterprise, position, companySize, phone, businessSector, businessType, currentPassword, subscriptionPlan, username } = req.body
            const user = await User.findById(req.params.userId)
            const updatedUser = await User.findByIdAndUpdate(user._id, { name, lastname, age, email, nameEnterprise, position, companySize, phone, businessSector, businessType, currentPassword, subscriptionPlan, username }, { new: true })
            if (!updatedUser) {
                return res.status(404).json({ message: "No se pudo localizar el usuario." })
            }
            user.logsData.push({event: "Actualización de datos del usuario.", details: "El usuario ha actualizado datos de su perfil."})
            await user.save()
            res.json(updatedUser)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    updatePassword: async function (req, res) {
        try {
            const user = await User.findById(req.params.userId)
            const { currentPassword, newPassword, confirmNewPassword } = req.body
            if(!user){
                return res.status(404).json({message: "El usuario no ha sido localizado."})
            }
            if (newPassword !== confirmNewPassword) {
                return res.status(422).json({ message: "Tu nueva contraseña no coincide con la repetida. Vuelve a intentarlo." })
            }
            const isValidPassword = await bcrypt.compare(currentPassword, user.password)

            if (!isValidPassword) {
                return res.status(401).json({ message: "No coincide tu contraseña actual con la ingresada." })
            }
            const hashedPassword = await bcrypt.hash(confirmNewPassword, 8)
            const passwordUpdated = await User.findByIdAndUpdate(req.params.userId, { password: hashedPassword }, { new: true })
            user.logsData.push({event: "Actualización de contraseña", details: "El usuario ha actualizado su contraseña exitosamente."})
            await user.save()
            res.json(passwordUpdated)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteUser: async function (req, res) {
        try {
            const userId = req.params.userId
            const deletedUser = await User.findByIdAndDelete(userId)
            if (!deletedUser) {
                return res.status(404).json({ message: "No se pudo localizar el usuario." })

            }
            return res.status(200).json(deletedUser)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLogs: async function (req,res) {
        try {
            const user = await User.findById(req.params.userId)
            res.json(user.logsData)
        } catch (error) {
            return res.status(500).json({error: "Ha ocurrido un error de servidor: " + error})
        }
    }
}

module.exports = userController