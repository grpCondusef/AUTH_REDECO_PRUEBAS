
import jwt from 'jsonwebtoken';

export const generateJWT = (uid = '', username='', institucionid = '', institucionClave = '', denominacion_social = '', sectorid = '', sector = '', system = '') => {
    return new Promise((resolve, reject) => {

        const payload = { uid, username, institucionid, institucionClave, denominacion_social, sectorid, sector, system }

        jwt.sign(payload, process.env.SECRETORPRIVATEKEY, {
            // expiresIn: '1m'
            //expiresIn: '4h'
            expiresIn: '30d'
        }, (error, token) => {

            if (error) {
                console.log(error)
                reject('No se pudo generar el JWT')
            } else {
                resolve(token)
            }
        })
    })
}
