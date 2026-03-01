const mongoose = require("mongoose")
const User = require("../models/userModel")
const RecoveryKey = require("../models/security/recoveryKeyModel")
const UxUser = require("../models/ux/uxUserModel")
const Device = require("../models/security/deviceModel")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const sendTwoFACode = require("../middlewares/userMiddlewares/2FA/2FAMiddleware")
const validateLogin = require("../middlewares/userMiddlewares/validateLogin")
const LogUser = require("../models/logs/logUserModel")
const SuspiciousLogin = require("../models/security/suspiciousLoginModel")
const sendMailOfSuspiciousLogin = require("./handlers/security/suspiciousLogin/sendMailOfSuspiciousLogin")
const { encryptData, decryptData } = require("../middlewares/userMiddlewares/security/dataEncrypt")

//tokens invalidos
let invalidTokens = []

const userController = {
    registerUser: async function (req, res) {
        const { name, lastname, email, age, gender, address, identityCard, position, phone, security, subscriptionPlan, username } = req.body //más que nada se calcula la unidad de medida
        console.log(req.body)
        try {
            if (!name || !lastname || !email || !username || !age || !gender || !address || !identityCard || !position || !phone || !security.password.currentPassword) {
                return res.status(400).json({ message: "Hay campos incompletos. Vuelve a intentarlo." })
            }
            const userExists = await User.findOne({ $or: [{ email }, { username }] })
            if (userExists) {
                return res.status(409).json({ message: "Este usuario ya existe, no puedes volver a crearlo." })
            }
            const userExistsByIdentityCard = await User.findOne({ identityCard })
            if (userExistsByIdentityCard) return res.status(400).json({ message: "Ya existe un usuario con una cédula de identidad similar." })
            //Proceder a crear el usuario
            const hashedPassword = await bcrypt.hash(security.password.currentPassword, 9)
            const newUser = new User({ name, lastname, email, age, gender, address, identityCard, position, phone, security: { password: { currentPassword: hashedPassword } }, twoFAActived: true, subscriptionPlan, username })
            //setearle un modulo de uX
            const newUx = new UxUser({ userId: newUser._id })
            /*
            const newEnterprise = new Enterprise({ userId: newUser._id, nameEnterprise, address, city, stateOrProvince, country, companySize, businessSector, businessType, currency })
            newUser.enterprise = newEnterprise._id
            //acá el usuario deberá definir su unidad de medida
            const newSustainabilityEnterprise = new SustainabilityEnterprise({
                enterpriseId: newEnterprise._id,
                dataSustainability: {
                    consumptionKwh: {
                        value: 0,
                        unit: "kWh",
                        frequency: dataSustainability.consumptionKwh.frequency
                    },
                    waterConsumption: {
                        value: 0,
                        unit: dataSustainability.waterConsumption.unit,
                        frequency: dataSustainability.waterConsumption.frequency,
                    },
                    waste: {
                        value: 0,
                        unit: dataSustainability.waste.unit,
                        frequency: dataSustainability.waste.frequency
                    },
                    CO2emissions: {
                        value: 0,
                        unit: dataSustainability.CO2emissions.unit,
                        frequency: dataSustainability.CO2emissions.frequency
                    }
                },
                estimatedSavings: {
                    consumptionKwh: {
                        unit: "kWh"
                    },
                    water: {
                        unit: estimatedSavings.water.unit,
                        frequency: estimatedSavings.water.frequency,
                    },
                    waste: {
                        unit: estimatedSavings.waste.unit,
                        frequency: estimatedSavings.waste.frequency
                    },
                    CO2: {
                        unit: estimatedSavings.CO2.unit,
                        frequency: estimatedSavings.CO2.frequency
                    }
                }
            })
            const newTechnologyEnterprise = new Technology({ enterpriseId: newEnterprise._id })
            newEnterprise.sustainable = newSustainabilityEnterprise
            */
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)
            console.log("Dato que quiero encriptar", twoFACode)
            const encrypted2FA = encryptData(twoFACode)
            newUser.security.twoFA.twoFACode = encrypted2FA
            newUser.security.twoFA.twoFAExpires = twoFAExpires

            /*
            await newSustainabilityEnterprise.save()
            await newTechnologyEnterprise.save()
            await newEnterprise.save()
            */
            await newUx.save()
            await newUser.save()

            await sendTwoFACode(newUser.email, twoFACode, "Termina de crear tu usuario en GreenTeccnia+.", "Te agradecemos por querer unirte a GreenTeccnia+ para gestionar tu proyecto, empresa o emprendimiento. Te dejaremos a continuación el código de autenticación multifactor para activar tu usuario. En caso de no ingresarlo en los próximos 30 minutos, tu usuario será eliminado.")
            res.cookie("userId", JSON.stringify({ _id: newUser._id }), { httpOnly: false, secure: false, sameSite: "Lax", maxAge: 1000 * 60 * 60 })
            return res.status(200).json({ message: "Usuario registrado con éxito. Chequea tu casilla de mail para activarlo." })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ error: "Ha ocurrido un error: " + error + ". Vuelve a intentarlo otra vez." })
        }
    },
    loginUser: async function (req, res) {
        const { username, password } = req.body
        try {
            const userToLogin = await User.findOne({ username: username })
            if (!username || !password) return res.status(400).json({ message: "Hay campos vacíos, vuelve a intentarlo." })
            if (!userToLogin) {
                return res.status(404).json({ message: "El usuario no existe." })
            }
            if (userToLogin.security.accountLockedUntil && userToLogin.security.accountLockedUntil > Date.now()) {
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Bloqueo de cuenta",
                    details: "El usuario ha sido bloqueado por reiterados inicios de sesión fallidos.",
                    date: new Date(),
                    clasificationSecurity: "Crítico"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await userToLogin.save()
                return res.status(403).json({ message: "Tu cuenta ha sido bloqueada por reiterados inicios de sesión fallidos." }) // se bloquea porque es mayor la fecha de desbloqueo que la actual
            }
            const isValidPassword = await bcrypt.compare(password, userToLogin.security.password.currentPassword)
            if (!isValidPassword) {
                userToLogin.security.attemptsToLogin++
                if (userToLogin.security.attemptsToLogin > 9) {
                    userToLogin.security.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000)
                }
                await userToLogin.save()
                console.log(userToLogin.security.attemptsToLogin);
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Inicio de sesión fallido",
                    details: "El usuario intentó iniciar sesión con una credencial incorrecta.",
                    date: new Date(),
                    clasificationSecurity: "Error"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await userToLogin.save()
                return res.status(401).json({ message: "Usuario o contraseña incorrectos." })
            }
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
            const deviceExists = await Device.findOne({ userId: userToLogin._id, ip: ip })
            if (userToLogin.security.twoFA.twoFAActived === false && deviceExists.isTrusted) {
                userToLogin.attemptsToLogin = 0
                await userToLogin.save()
                return await validateLogin(req, res, userToLogin)
            }
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)
            const encrypted2FA = encryptData(twoFACode)
            userToLogin.security.twoFA.twoFACode = encrypted2FA
            userToLogin.security.twoFA.twoFAExpires = twoFAExpires
            if (!deviceExists || !deviceExists.isTrusted) {
                const { isMobile, isTablet, isDesktop, browser, os } = req.useragent
                const newSuspiciousLogin = new SuspiciousLogin({
                    userId: userToLogin._id,
                    date: new Date(),
                    ip: ip,
                    browser: browser,
                    device: isMobile ? "Móvil" : isTablet ? "Tablet" : "Escritorio",
                    os: os,
                    actionByUser: "Notificado",
                })
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Intento de inicio de sesión en dispositivo sospechoso",
                    details: "El usuario intentó iniciar sesión en un dispositivo sospechoso.",
                    date: new Date(),
                    clasificationSecurity: "Advertencia"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await newSuspiciousLogin.save()
                await userToLogin.save()
                userToLogin.attemptsToLogin = 0
                res.cookie("confirmDevice", JSON.stringify({
                    ip: newSuspiciousLogin.ip,
                    browser: newSuspiciousLogin.browser,
                    deviceType: newSuspiciousLogin.device,
                    os: newSuspiciousLogin.os
                }), { httpOnly: true, secure: true, sameSite: "Lax", maxAge: 1000 * 60 * 60 })
                console.log(userToLogin)
                await sendMailOfSuspiciousLogin(userToLogin.email, newSuspiciousLogin, twoFACode)
            }
            console.log(userToLogin);
            await userToLogin.save()
            const userId = userToLogin._id
            if (userToLogin.security.twoFA.twoFAActived && deviceExists && deviceExists.isTrusted) await sendTwoFACode(userToLogin.email, twoFACode, "Se ha solicitado un inicio de sesión.", "Estás por iniciar sesión, así que deberás ingresar el código de autenticación que aparece a continuación.")
            return res.status(200).json({ message: "Se ha enviado un código 2FA a tu correo. Chequéalo y verifica tu inicio de sesión.", warn: !deviceExists || !deviceExists.isTrusted ? "El dispositivo en el que deseas ingresar es sospechoso." : null, userId })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    logoutUser: async function (req, res) {
        const token = req.cookies.token
        if (!token) return res.status(404).json({ message: "Token no encontrado." })
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
            const newLog = new LogUser({
                userId: user._id,
                event: "Cierre de sesión",
                details: "El usuario cerró sesión con éxito",
                clasificationSecurity: "Normal",
                date: new Date()
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            user.security.lastActivity = new Date()
            await user.save()
            res.clearCookie("token", { httpOnly: true, sameSite: "Lax" })
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
            return res.status(500).json({ error: "Ha ocurrido un error al obtener el usuario" + error })
        }
    },
    getUserByEmail: async function (req, res) {
        try {
            const { email } = req.query
            if (!email) return res.status(400).json({ message: "Ingresa un email." })
            const user = await User.findOne({ email: email })
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            return res.status(200).json(user)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error al obtener el usuario" + error })
        }
    },
    //CAMBIAR Y DIVIDIR EMPRESA DEL USUARIO. SE PLANTEAN EN LÓGICAS DISTINTAS
    updateUser: async function (req, res) {
        try {
            const { name, lastname, email, age, gender, address, identityCard, position, phone, subscriptionPlan, username } = req.body
            const user = await User.findById(req.params.userId)
            if (!name || !lastname || !email || !age || !gender || !identityCard || !phone) {
                return res.status(400).json({ message: "Hay campos incompletos. Vuelve a intentarlo." })
            }
            const updatedUser = await User.findByIdAndUpdate(user._id, { name, lastname, email, age, gender, address, identityCard, position, phone, subscriptionPlan, username }, { new: true })
            if (!updatedUser) {
                return res.status(404).json({ message: "No se pudo localizar el usuario." })
            }
            const newLog = new LogUser({
                userId: user._id,
                event: "Actualización de datos del usuario.",
                details: "El usuario ha actualizado datos de su perfil.",
                date: new Date(),
                clasificationSecurity: "Normal"
            })
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(200).json({ message: "Usuario actualizado con éxito.", updatedUser })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error: " + error })
        }
    },
    updatePassword: async function (req, res) {
        try {
            const user = await User.findById(req.params.userId)
            const { password, newPassword, repeatNewPassword } = req.body
            if (!user) {
                return res.status(404).json({ message: "El usuario no ha sido localizado." })
            }
            if (!password || !newPassword || !repeatNewPassword) {
                return res.status(400).json({ message: "Hay campos vacíos. Vuelve a intentarlo." })
            }
            if (newPassword !== repeatNewPassword) {
                return res.status(422).json({ message: "Tu nueva contraseña no coincide con la repetida. Vuelve a intentarlo." })
            }
            const isValidPassword = await bcrypt.compare(password, user.security.password.currentPassword)

            if (!isValidPassword) {
                const newLog = new LogUser({
                    userId: user._id,
                    event: "Error en actualización de contraseña",
                    details: "El usuario ha intentado actualizar su contraseña e ingresó su contraseña actual de manera incorrecta.",
                    date: new Date(),
                    clasificationSecurity: "Advertencia"
                })
                await newLog.save()
                user.security.logsData.push(newLog._id)
                await user.save()
                return res.status(401).json({ message: "No coincide tu contraseña actual con la ingresada." })
            }
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            user.security.twoFA.twoFACode = twoFACode
            user.security.twoFA.twoFAExpires = twoFAExpires
            await sendTwoFACode(user.email, twoFACode, "Se ha solicitado actualizar la contraseña.", "Has requerido un cambio de contraseña en tu cuenta. Te enviamos este mail para confirmar la acción y garantizar la seguridad de tu cuenta. Si desconoces esta actividad, ingresa ya mismo a tu panel de usuario.")
            const newLog = new LogUser({
                userId: user._id,
                event: "Solicitud de cambio de contraseña",
                details: "El usuario solicitó actualizar su contraseña.",
                date: new Date(),
                clasificationSecurity: "Advertencia"
            })
            const hashedPassword = await bcrypt.hash(repeatNewPassword, 8)
            user.security.password.pendingPassword = hashedPassword
            await newLog.save()
            user.security.logsData.push(newLog._id)
            await user.save()
            return res.status(200).json({ message: "Hemos enviado un código 2FA a tu correo para terminar de cambiar la contraseña." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    deleteUser: async function (req, res) {
        try {
            const userId = req.params.userId
            const { password, repeatYourPassword } = req.body
            console.log(req.body)
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            if (!password || !repeatYourPassword) return res.status(400).json({ message: "Hay campos vacíos. Vuelve a intentarlo." })
            if (password !== repeatYourPassword) return res.status(400).json({ message: "Las contraseñas no coinciden." })
            const isValidPassword = await bcrypt.compare(repeatYourPassword, user.security.password.currentPassword)
            if (!isValidPassword) {
                const newLog = new LogUser({
                    userId: user._id,
                    event: "Error en la eliminación de cuenta",
                    details: "El usuario ha intentado eliminar su cuenta e ingresó su contraseña de manera incorrecta.",
                    date: new Date(),
                    clasificationSecurity: "Error"
                })
                await newLog.save()
                user.security.logsData.push(newLog._id)
                await user.save()
                return res.status(401).json({ message: "Tu contraseña no es correcta. Vuelve a intentarlo." })
            }
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)

            user.security.twoFA.twoFACode = twoFACode
            user.security.twoFA.twoFAExpires = twoFAExpires
            await sendTwoFACode(user.email, twoFACode, "Se ha solicitado elminar tu cuenta.", "Lamentamos mucho que te vayas de GreenTeccnia+. Deseamos saber en algún momento tu opinión y que nos ayudes a mejorar.\nSi crees que esto se trata de actividad inusual o sospechosa en tu cuenta, inicia ya mismo tu sesión y vé al panel de seguridad.")
            return res.status(200).json({ message: "Hemos enviado un código 2FA a tu correo para terminar de eliminar la cuenta." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getLogs: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const getAllLogs = await LogUser.find({ userId: user._id }).limit(50)
            if (getAllLogs.length === 0) return res.status(404).json({ message: "No se han encontrado logs de usuario." })
            return res.status(200).json(getAllLogs)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    getDevices: async function (req, res) {
        try {
            const { userId } = req.params
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const devices = await Device.find({
                userId
            })
            if (devices.length === 0) return res.status(404).json({ message: "No se han encontrado dispositivos registrados." })
            return res.status(200).json(devices)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    //function for validate password in security themes
    validatePassword: async function (req, res) {
        try {
            const { userId } = req.params
            const { password, repeatYourPassword } = req.body
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            if (password !== repeatYourPassword) return res.status(400).json({ message: "No coinciden las contraseñas." })
            bcrypt.compare(repeatYourPassword, user.security.password.currentPassword, (err, result) => {
                if (err) return res.status(500).json({
                    error: "Error interno de servidor al validar la contraseña."
                })
                if (result) {
                    return res.status(200).json({ isValid: true })
                } else {
                    return res.status(400).json({ message: "Las contraseñas no coinciden." })
                }
            }
            )

        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    loginWithRecoveryKey: async function (req, res) {
        try {
            const { username, recoveryKey } = req.body
            const userToLogin = await User.findOne({ username: username })
            if (!username || !recoveryKey) return res.status(409).json({ message: "Hay campos vacíos, vuelve a intentarlo." })
            if (!userToLogin) {
                return res.status(404).json({ message: "El usuario no existe." })
            }
            if (userToLogin.security.accountLockedUntil && userToLogin.security.accountLockedUntil > Date.now()) {
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Bloqueo de cuenta",
                    details: "El usuario ha sido bloqueado por reiterados inicios de sesión fallidos.",
                    date: new Date(),
                    clasificationSecurity: "Crítico"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await userToLogin.save()
                return res.status(403).json({ message: "Tu cuenta ha sido bloqueada por reiterados inicios de sesión fallidos." }) // se bloquea porque es mayor la fecha de desbloqueo que la actual
            }
            const recoveryKeyOfUser = await RecoveryKey.findOne({ userId: userToLogin._id })
            if (!recoveryKeyOfUser) {
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Error en inicio de sesión con clave de recuperación",
                    details: "El usuario ha intentado iniciar sesión con su clave de recuperación pero esta no existe.",
                    date: new Date(),
                    clasificationSecurity: "Error"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await userToLogin.save()
                return res.status(400).json({ message: "No se ha encontrado la clave de recuperación" })
            }
            const decryptedRecoveryKey = decryptData(recoveryKeyOfUser.recoveryKey)
            if (recoveryKey !== decryptedRecoveryKey) {
                const newLog = new LogUser({
                    userId: userToLogin._id,
                    event: "Error en inicio de sesión con clave de recuperación",
                    details: "El usuario ha intentado iniciar sesión con su clave de recuperación pero el valor ingresado es incorrecto.",
                    date: new Date(),
                    clasificationSecurity: "Error"
                })
                await newLog.save()
                userToLogin.security.logsData.push(newLog._id)
                await userToLogin.save()
                return res.status(400).json({ message: "La clave de recuperación no es correcta" })
            }
            const newLog = new LogUser({
                userId: userToLogin._id,
                event: "Inicio de sesión con clave de recuperación",
                details: "El usuario inició sesión con su clave de recuperación exitosamente.",
                date: new Date(),
                clasificationSecurity: "Normal"
            })
            await newLog.save()
            userToLogin.security.logsData.push(newLog._id)
            await userToLogin.save()
            await validateLogin(req, res, userToLogin)
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    forgotPassword: async function (req, res) {
        try {
            const { email } = req.body
            if (!email) return res.status(409).json({ message: "Ingresa un email." })
            const findUserByMail = await User.findOne({ email: email })
            if (!findUserByMail) return res.status(404).json({ message: "No se ha encontrado el usuario por su mail." })
            const twoFACode = crypto.randomBytes(3).toString("hex") //code aleatorio para 2FA
            const twoFAExpires = new Date(Date.now() + 10 * 60 * 1000)
            findUserByMail.security.twoFA.twoFACode = twoFACode
            findUserByMail.security.twoFA.twoFAExpires = twoFAExpires
            await sendTwoFACode(findUserByMail.email, twoFACode, "Reestablece tu contraseña", "A continuación, te proporcionaremos un código para que reestablezcas tu contraseña.\nSi crees que esto se trata de actividad inusual o sospechosa en tu cuenta, inicia ya mismo tu sesión y vé al panel de seguridad.")
            await findUserByMail.save()
            return res.status(200).json({ message: "Hemos enviado un código 2FA a tu correo para confirmar el cambio de contraseña." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    setPasswordBecauseForgot: async function (req, res) {
        try {
            const { userId } = req.params
            const { newPassword, repeatNewPassword } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de usuario inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            if (!newPassword || !repeatNewPassword) return res.status(409).json({ message: "Hay campos vacíos. Vuelve a intentarlo." })
            if (newPassword !== repeatNewPassword) return res.status(409).json({ message: "Las contraseñas no coinciden." })
            const hashedPassword = await bcrypt.hash(repeatNewPassword, 8)
            user.security.password.currentPassword = hashedPassword
            await user.save()
            res.clearCookie("token", { httpOnly: true, sameSite: "Lax" })
            return res.status(200).json({ message: "Contraseña actualizada con éxito. Ya puedes iniciar sesión." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    },
    updateRetentionData: async function (req, res) {
        try {
            const { userId } = req.params
            const { inactivityPeriod } = req.body
            if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(404).json({ message: "ID de empresa inválido." })
            const user = await User.findById(userId)
            if (!user) return res.status(404).json({ message: "No se ha encontrado el usuario." })
            const updatedUser = await User.findByIdAndUpdate({ _id: userId }, { inactivityPeriod: inactivityPeriod }, { new: true })
            if (!updatedUser) return res.status(404).json({ message: "No se ha encontrado el usuario. " })
            return res.status(200).json({ message: "Tiempo de retención actualizado con éxito." })
        } catch (error) {
            return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
        }
    }
}

module.exports = userController