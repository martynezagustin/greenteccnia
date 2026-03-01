const transporter = require("../../../../config/nodemailerConfig")

const sendMailOfSuspiciousLogin = async function (email, device, code = null) {
    try {
        let htmlContent = `
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
<div style="background-color:#b4ff94; padding:3rem; border-radius: 10px; margin: 1rem">
      <img src="https://res.cloudinary.com/dtwek4wxj/image/upload/v1740787350/logotype-greenteccnia.png" alt="Logo"
        width="150" height="38" class="d-inline-block align-text-top; margin-top:2rem; padding:1rem">
<h1 style="font-family: Poppins; color: black; letter-spacing: -1.2px; font-size: 2rem; text-align:center;">Se ha detectado un <span style='color:red'>inicio de sesión sospechoso.</span></h1>
<p style='font-family: Poppins; letter-spacing: -1.3px;font-size: 1.7rem; text-align:center;'>Se ha detectado un inicio de sesión de un dispositivo que no está registrado en tu cuenta. Si crees que esto puede tratarse de un ataque por parte de hackers, ingresa ya a tu cuenta.</p>
<div style='background-color: rgb(230,230,230); border:1px solid green; margin: 1rem; padding:0.4rem; text-align:center; border-radius: 10px; font-size: 1.2rem;'>
<h4 style='font-family: Poppins; letter-spacing: -1.4px'>Dispositivo: ${device.device}</h4>
<h4 style='font-family: Poppins; letter-spacing: -1.4px'>Navegador: ${device.browser}</h4>
<h4 style='font-family: Poppins; letter-spacing: -1.4px'>IP: ${device.ip}</h4>
</div>`

        if (code) {
            htmlContent += `<h2 style="color: green;font-family: Poppins; text-align: center; font-size: 2.5rem">Tu código de autenticación multifactor</h2>
              <h3 style="color:black; text-align:center; font-size: 4rem; font-family: Poppins; background-color: #eeee; padding: 5px"; width: 50%>${code}</h3>
              <p style="text-align: center; font-family: Poppins; letter-spacing: -1px">Por razones de seguridad, te recomendamos no compartir con nadie este código de autenticación. </p>
              </div>
        `
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Alerta de inicio de sesión sospechoso",
            html: htmlContent
        }
        try {
            await transporter.sendMail(mailOptions)
            console.log("Email enviado.")
        } catch (error) {
            console.error(error);

        }
    } catch (error) {

        console.error(error);
    }
}

module.exports = sendMailOfSuspiciousLogin