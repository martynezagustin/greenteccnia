const crypto = require("crypto")

const AES_SECRET = process.env.AES_SECRET

function encryptData(code) {
    const key = crypto.createHash("sha256").update(AES_SECRET).digest()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(code.toString(), 'utf-8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return iv.toString('hex') + ':' + encrypted.toString('hex')
}

function decryptData(encryptedCode) {
    const key = crypto.createHash("sha256").update(AES_SECRET).digest(); // 32 bytes seguros
    const [iv, encrypted] = encryptedCode.split(":");
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encrypted, "hex"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {encryptData, decryptData}