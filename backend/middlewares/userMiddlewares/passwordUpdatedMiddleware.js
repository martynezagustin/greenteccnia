const passwordUpdatedValidator = (req, res, next) => {
    const {newPassword, confirmNewPassword} = req.body

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;

    if(!regex.test(newPassword)){
        return res.status(400).json({message:"La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un caracter especial."})
    }
    next()

}

module.exports = passwordUpdatedValidator