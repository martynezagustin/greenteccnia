const passwordValidator = (req, res, next) => {
    const {password} = req.body

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(!regex.test(password)){
        return res.status(400).json({message:"La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial."})
    }
    next()

}

module.exports = passwordValidator