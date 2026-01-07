const transporter = require("../../../../config/nodemailerConfig")
const Audit = require("../../../../models/sustainability/audit/auditModel")
const Enterprise = require("../../../../models/enterpriseModel")
const SustainabilityEnterprise = require("../../../../models/sustainability/sustainabilityModel")
const cron = require("node-cron")

const setNotificationAudit = async () => {
    cron.schedule('* * * * *', async () => {
        try {
            const pendingAudits = await Audit.find({
                status: "Planificada",
                notificationStatus: "Por notificar"
            }).populate("sustainabilityEnterprise")
            if (pendingAudits.length === 0) return console.log("No hay auditorías en estado planificadas.")
            for (const audit of pendingAudits) {
                const sustainabilityEnterprise = await SustainabilityEnterprise.findOne({
                    _id: audit.sustainabilityEnterprise
                })
                if (!sustainabilityEnterprise) console.error("Hay un error para capturar los datos del módulo de sustentabilidad.")
                const enterprise = await Enterprise.findById(sustainabilityEnterprise.enterpriseId)
                if (!enterprise) console.error("Hay un error para capturar los datos de la empresa.")

                if (audit.teamAuditor.length !== 0) {
                    const employees = audit.teamAuditor.map((employee) => employee)
                    for (const employee of employees) {
                        console.log("Empleado encontrado", employee)
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: employee.email,
                            subject: `Has sido designado para una auditoría.`,
                            html: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
                            <div>
                            <h2 style="font-family: Poppins">Hola, ${employee.name}. Has sido designado como parte de una auditoría de la empresa ${enterprise.nameEnterprise}.</h2><br><br>
                            <h3 style="font-family: Poppins; text-align: center; font-size: 1.5rem">Detalles de la auditoría</h3><br><br>
                            <table style="width: 100%">
                                <thead>
                                    <tr>
                                        <th scope="col" style="border: 1px solid gray; font-family: Poppins; font-size: 1rem; font-weigth: 300; padding: 5px; background-color: #eeee; border-radius: 5px">Empresa</th>
                                        <th scope="col" style="border: 1px solid gray; font-family: Poppins; font-size: 1rem; font-weigth: 300; padding: 5px; background-color: #eeee; border-radius: 5px">Fecha</th>
                                        <th scope="col" style="border: 1px solid gray; font-family: Poppins; font-size: 1rem; font-weigth: 300; padding: 5px; background-color: #eeee; border-radius: 5px">Alcance</th>
                                        <th scope="col" style="border: 1px solid gray; font-family: Poppins; font-size: 1rem; font-weigth: 300; padding: 5px; background-color: #eeee; border-radius: 5px">Fase PVHA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th scope="row" style="border: 1px solid gray; font-family: Poppins; font-size: 1.4rem; font-weigth: 300; padding: 5px; border-radius: 5px">${enterprise.nameEnterprise}</th>
                                        <th scope="row" style="border: 1px solid gray; font-family: Poppins; font-size: 1.4rem; font-weigth: 300; padding: 5px; border-radius: 5px">${audit.date.getDate()}/${audit.date.getMonth()}/${audit.date.getFullYear()}</th>
                                        <th scope="row" style="border: 1px solid gray; font-family: Poppins; font-size: 1.4rem; font-weigth: 300; padding: 5px; border-radius: 5px">${audit.scope}</th>
                                        <th scope="row" style="border: 1px solid gray; font-family: Poppins; font-size: 1.4rem; font-weigth: 300; padding: 5px; border-radius: 5px">${audit.phasePDAC}</th>
                                    </tr>
                                </tbody>
                            </table>
                            </div>
                            `
                        }
                        try {
                            await transporter.sendMail(mailOptions, (err, info) => {
                                if (err) {
                                    return console.error("Ha ocurrido un error al envial los mails: " + err)
                                }
                                console.log("Mail enviado.", info.response)
                            })
                        } catch (error) {
                            console.error(error)
                        }
                        await Audit.findOneAndUpdate({
                            _id: audit._id,
                            notificationStatus: "Notificada"
                        })
                    }
                }
            }
        } catch (error) {
            console.error(error)
        }
    })
}

module.exports = setNotificationAudit