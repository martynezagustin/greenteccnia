const cron = require("node-cron")
const transporter = require("../../../../config/nodemailerConfig")
const User = require("../../../../models/userModel")

const inactivityUserWarnToDelete = () => {
    cron.schedule("0 0 * * *"), async () => {
        const currentTime = new Date().getTime()

        const inactiveUsers = await User.find()
        inactiveUsers.forEach(async (user) => {
            const lastActivity = new Date(user.security.lastActivity)
            const inactivityPeriod = user.security.inactivityPeriod * 24 * 60 * 60 * 1000

            if (currentTime - lastActivity > inactivityPeriod) {
                await User.deleteOne({ _id: user._id })
                console.log(`Usuario ${user.name} ${user.lastname} eliminado por inactividad.`)

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Aviso de eliminación de cuenta..`,
                    text: `Hola ${user.name}.\n\n Hemos notado que no has interactuado con tu cuenta por más de ${user.inactivityPeriod} días. Si no realizas alguna acción, procederemos a eliminar tus datos en los próximos días `
                }

                await transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log("Mail enviado.", info.response)
                    }
                })
            }
        })
    }
}
module.exports = inactivityUserWarnToDelete