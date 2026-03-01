const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'storage/evidences')
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        const safeName = crypto.randomUUID()
        cb(null, `${safeName}${ext}`)
    }
})

const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'imagen/png',
        'image/jpeg'
    ]
    if (!allowed.includes(file.mimetype)) {
        return cb(new Error('Tipo de archivo no permitido'), false)
    }

    cb(null, true)
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
})

module.exports = upload