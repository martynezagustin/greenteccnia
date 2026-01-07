const passwordValidator = (req, res, next) => {
    const {security} = req.body

    console.log(security.password.currentPassword)
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(!regex.test(security.password.currentPassword)){
        return res.status(400).json({message:"La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial."})
    }
    next()

}

module.exports = passwordValidator