const nodemailer = require("nodemailer")
const transporter = require("../../../config/nodemailerConfig")
const MemberRequest = require("../../../models/team/teamApprovedModel")
const Enterprise = require("../../../models/enterpriseModel")
const User = require("../../../models/userModel")
const cron = require("node-cron")

const memberRequestWarning = async () => {
    cron.schedule('0 8 * * *', async () => {
        try {
            const pendingMemberRequests = await MemberRequest.find({
                status: "Pendiente"
            }).populate("enterpriseId")
            if (pendingMemberRequests.length === 0) {
                console.log("No se han encontrado solicitudes pendientes.")
            }
            for (const request of pendingMemberRequests) {
                const { enterpriseId, userId } = request
                if (!enterpriseId || !userId) continue

                const enterprise = await Enterprise.findById(enterpriseId)
                const user = await User.findOne({ enterprise: enterpriseId })
                console.log(user)

                if (!enterprise || !user) continue
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: `Nueva solicitud para ingresar a ${enterprise.nameEnterprise}.`,
                    html: `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
                <div style="font-family: Poppins">
                    <h2 style="text-align: center; font-size: 2rem">Solicitud de ingreso a ${enterprise.nameEnterprise}</h2>
                    <p>Hola ${user.name}.<br><br> El usuario ${user.name} ha solicitado unirse al flujo de trabajo de ${enterprise.nameEnterprise}.<br><br> Ingresa a tu plataforma para confirmar o rechazar esta solicitud. Muchas gracias.<br><br> Atte. El soporte de GreenTeccnia+.
                </div>
`
                }
                try {
                    await transporter.sendMail(mailOptions, (err, info) => {
                        if (err) {
                            return console.error("Ha ocurrido un error: " + err)
                        }
                        console.log("Mail enviado exitosamente.", info.response)
                    })
                    const updatedRequest = await MemberRequest.findOneAndUpdate({
                        enterpriseId: enterprise._id,
                        _id: request._id,
                        status: "Notificado"
                    })
                    console.log(updatedRequest)
                } catch (error) {
                    console.error("Ha ocurrido un error y no se han enviado los mails.", error)
                }
            }
        } catch (error) {
            console.error("Error al enviar msj: " + error);
        }

    })
}

module.exports = memberRequestWarning