const cron = require("node-cron")
const Project = require("../../../models/projects/projectModel")
const User = require("../../../models/userModel")
const transporter = require("../../../config/nodemailerConfig")

const scheduleProjectReminder = () => {
    cron.schedule('0 8 * * *', async () => {
        try {
            const today = new Date()
            const intervals = [
                { days: 30, label: "1 mes" },
                { days: 7, label: "1 semana" },
                { days: 1, label: "1 día" }

            ]
            for (let i = 0; i < intervals.length; i++) {
                const currentInterval = intervals[i]
                const startDate = new Date()
                if (i > 0) {
                    startDate.setDate(today.getDate() + intervals[i - 1].days + 1)
                }
                const reminderDate = new Date()
                reminderDate.setDate(today.getDate() + currentInterval.days)
                console.log(`Buscando proyectos con fecha entre entre ${today.toISOString()} y ${reminderDate.toISOString()}...`);
                const projects = await Project.find({
                    endDate: { $gte: startDate, $lte: reminderDate }
                }).populate("enterpriseId")
                console.log(`Se encontraron: ${projects.length} proyectos para ${currentInterval.label}`)
                for (const project of projects) {
                    const enterpriseId = project.enterpriseId._id
                    const users = await User.find({ enterprise: enterpriseId })

                    for (const user of users) {
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: `El proyecto ${project.title} está a punto de finalizar.`,
                            text: `Hola ${user.name}.\n\n El proyecto ${project.title} de la empresa ${project.enterpriseId.name} finaliza en ${currentInterval.label}, ¡Saludos!`
                        }
                        try {
                            await transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log("Ocurrió un error: " + error);

                                }
                                console.log("Mail enviado. ", info.response);
                            })

                        } catch (error) {
                            console.error(error);

                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error al enviar msj: " + error);
        }
    })
}
//ver ESTO, no funciona bien
const scheduleTaskOfProjectReminder = () => {
    cron.schedule('0 8 * * *', async () => {
        try {
            const today = new Date()
            const intervals = [
                { days: 30, label: "1 mes" },
                { days: 7, label: "1 semana" },
                { days: 1, label: "1 día" }
            ]
            for (let i = 0; i < intervals.length; i++) {
                const currentInterval = intervals[i]
                const startDate = new Date()
                if (i > 0) {
                    startDate.setDate(today.getDate() + intervals[i - 1].days + 1)
                }
                const reminderDate = new Date()
                reminderDate.setDate(today.getDate() + currentInterval.days)
                console.log(`Buscando tareas con fecha entre ${today.toISOString()} y ${reminderDate.toISOString()}...`);
                const projects = await Project.find({
                    "tasksAssigned.endDate": { $gte: startDate, $lte: reminderDate }
                }).populate("enterpriseId")

                console.log(`Se encontraron ${projects.length} proyectos con tareas próximas a vencer.`)
                for (const project of projects) {
                    const enterpriseId = project.enterpriseId._id
                    const users = await User.find({ enterprise: enterpriseId })
                    for (const user of users) {
                        for (const task of project.tasksAssigned) {
                            console.log("Tareas en total: " + projects.tasksAssigned.length)
                            if (task.endDate >= today && task.endDate <= reminderDate) {
                                const mailOptions = {
                                    from: process.env.EMAIL_USER,
                                    to: user.email,
                                    subject: `La tarea ${task.task} del proyecto ${project.title} está a punto de finalizar.`,
                                    text: `Hola ${user.name}.\n\n La tarea ${task.task} proyecto ${project.title} finaliza en ${currentInterval.label}, ¡Saludos!`
                                }
                                try {
                                    await transporter.sendMail(mailOptions, (error, info) => {
                                        if (error) {
                                            return console.log("Ha ocurrido un error: " + error)
                                        }
                                        console.log("Mail enviado. " + info.response);

                                    })
                                } catch (error) {
                                    return res.status(500).json({ error: "Ha ocurrido un error de servidor: " + error })
                                }
                            }
                        }
                    }

                }
            }

        } catch (error) {
            console.error("Error al enviar msj: " + error);
        }
    })
}

module.exports = { scheduleProjectReminder, scheduleTaskOfProjectReminder }