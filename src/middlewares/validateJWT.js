
import jwt from 'jsonwebtoken';
import { pool } from '../database/auth_db.js';


export const validarJWT = async (request, response, next) => {

    const token = request.header('Authorization')

    // VERIFICAMOS QUE EL TOKEN VENGA CON LA PETICIÓN DEL USUARIO
    if (!token) {
        return response.status(401).json({
            msg: 'Es necesario incluir un token en la petición'
        })
    }

    try {
        const { uid, username, institucionid, intitucionClave, denominacion_social, sectorid, sector, exp } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        
        request.uid = uid;
        request.username = username;
        request.institucionid = institucionid;
        request.intitucionClave = intitucionClave;
        request.denominacion_social = denominacion_social;
        request.sectorid = sectorid;
        request.sector = sector;

        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime >= exp) {
            return response.status(400).json({
                error: 'El token ha expirado'
            });
        }

        const userData = await pool.query('SELECT * FROM public.users WHERE userid = $1', [uid]);
        request.usuario = userData.rows[0]

        if (!userData.rows[0].is_active) {
            return response.status(401).json({
                msg: 'El usuario no está activo'
            })
        }

        next();

    } catch (error) {
        console.error(error)
        return response.status(401).json({
            msg: 'Token no válido'
        })
    }

};
