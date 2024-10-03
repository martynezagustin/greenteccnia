const transporter = require("../../config/nodemailerConfig");

const sendTwoFACode = async function (email, code) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Tu código 2FA",
        html: `<h2 style="color: red;font-family: sans-serif;">Tu código de autenticación multifactor</h2>
              <h1 style="color:green">${code}</h1>
              <p>Por razones de seguridad, te recomendamos no compartir con nadie este código de autenticación. Muchas gracias y buen inicio de sesión.`
    }
    try {
        await transporter.sendMail(mailOptions)
        console.log("2FA enviado.");
    } catch (error) {
        console.error("Error al enviar el correo: " + error);
    }
}

module.exports = sendTwoFACode