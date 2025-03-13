import { v4 as uuidv4 } from 'uuid';
import jwt from "jsonwebtoken";
import bcryptjs from 'bcryptjs';
import { pool } from "../database/auth_db.js";
import { generateJWT } from '../helpers/generateJWT.js';
import { encriptPassword } from '../helpers/encriptPassword.js';
import { getTodayDate } from '../helpers/generatedates.js';
import { response } from 'express';


export const createSuperUser = async (request, response) => {

    const { key, username, password, confirm_password } = request.body
    const userid = uuidv4()
    const keyid = uuidv4()
    const is_active = true
    const profileid = '2'
    const system_key = 'redeco_key' 
    const system = 'REDECO'

    if (username === '' || password === '') {
        return response.status(400).json({
            msg: 'El campo username y password no pueden estar vacíos'
        })
    }

    if (key.length < 1) {
        return response.status(400).json({
            msg: 'El campo key no puede venir vacío'
        })
    }

    if (password === confirm_password) {

        try {
            //ENCRIPTAR LA CONTRASEÑA DEL USUARIO
            const hashedPassword = encriptPassword(password)

            const keysQuery = await pool.query(`
                SELECT *
                FROM public.used_keys
                WHERE "key" = $1
            `, [key])


            if (keysQuery.rows[0]) {
                return response.status(401).json({
                    error: 'Ya fue creado un súper usuario utilizando esta key'
                })
            }

            const institucionesQuery = await pool.query(`
                SELECT *
                FROM public.instituciones_financieras
                WHERE ${system_key} = $1
            `, [key])

            if (!institucionesQuery.rows[0]) {
                return response.status(401).json({
                    error: 'La key proporcionada no es válida'
                })
            }

            const systemQuery = await pool.query(`
                SELECT * 
                FROM public.systems
                WHERE "system" = $1
            `, [system])

            const systemId = systemQuery.rows[0].systemid

            const institucionid = institucionesQuery.rows[0].institucionid
            const institucionClave = institucionesQuery.rows[0].originalid
            const denominacion_social = institucionesQuery.rows[0].denominacion_social
            const sectorid = institucionesQuery.rows[0].sectorid
            const sector = institucionesQuery.rows[0].sector

            const createSuperUser = await pool.query(`
                INSERT INTO public.users
                (userid, username, "password", institucionid, is_active, profileid, date, system)
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING *
            `, [userid, username, hashedPassword, institucionid, is_active, profileid, systemId])

            const addUsedKey = await pool.query(`
                INSERT INTO public.used_keys
                (usedkeyid, "key", date, system)
                VALUES ($1, $2, NOW(), $3) RETURNING *
            `, [keyid, key, system])

            const token_access = await generateJWT(userid, username, institucionid, institucionClave, denominacion_social, sectorid, sector, system)

            response.status(200).json({
                message: 'El usuario ha sido creado exitosamente!',
                data: {
                    ...createSuperUser.rows[0], // Mantener los datos existentes
                    token_access, // Agregar el token al objeto de respuesta
                }
            })

        } catch (error) {
            console.error(error)
            response.status(500).json({
                error: 'Parece que ha habido un error al intentar crear un súper usuario'
            })
        }
    } else {
        response.status(400).json({
            msg: 'Las coontraseñas deben de coincidir'
        });
    }
}



export const createUser = async (request, response) => {

    const { institucionid, profileid } = request.usuario

    const { username, password, confirm_password } = request.body
    const userid = uuidv4()
    const is_active = true
    const simpleProfileId = "1"
    const system = 'REDECO'
    
    if (username === '' || password === '') {
        return response.status(400).json({
            msg: 'El campo username y password no pueden estar vacíos'
        })
    }

    // SI AMBAS CONTRASEÑAS COINCIDEN, GENERAR EL REGISTRO
    if (password === confirm_password) {

        if (profileid !== "2") {
            return response.status(401).json({
                error: 'Su usuario no cuenta con los permisos requeridos para crear un nuevo usuario'
            })
        }

        try {
            //ENCRIPTAR LA CONTRASEÑA DEL USUARIO
            const hashedPassword = encriptPassword(password)

            const systemQuery = await pool.query(`
                SELECT * 
                FROM public.systems
                WHERE "system" = $1
            `, [system])

            const systemId = systemQuery.rows[0].systemid

            //CREAMOS EL REGISTRO EN BASE DE DATOS
            const addUser = await pool.query(
                `INSERT INTO public.users (userid, username, "password", institucionid, is_active, profileid, date, system) 
                VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING *`,
                [userid, username, hashedPassword, institucionid, is_active, simpleProfileId, systemId]
            );

            const institucionesQuery = await pool.query(`
                SELECT *
                FROM public.instituciones_financieras
                WHERE institucionid = $1
            `, [institucionid])

            const institucionClave = institucionesQuery.rows[0].originalid
            const denominacion_social = institucionesQuery.rows[0].denominacion_social
            const sectorid = institucionesQuery.rows[0].sectorid
            const sector = institucionesQuery.rows[0].sector

            const token_access = await generateJWT(userid, username, institucionid, institucionClave, denominacion_social, sectorid, sector, system)

            response.status(201).json({
                message: 'El usuario ha sido creado exitosamente!',
                data: {
                    ...addUser.rows[0], // Mantener los datos existentes
                    token_access, // Agregar el token al objeto de respuesta
                }
            });
        } catch (error) {
            console.error(error)
            response.status(500).json({
                'error': 'Parece que hubo un error al intentar crear un usuario'
            })
        }
    } else {
        response.status(400).json({
            msg: 'Las coontraseñas deben de coincidir'
        });
    }
}


////////////////////////// RENOVACIÓN DE TOKEN //////////////////////////////////
export const generateToken = async (request, response) => {
    const { username, password } = request.body;

    try {
        // ====================== VALIDAR QUE EL USUARIO EXISTE ====================== 
        const userExists = await pool.query(`
            SELECT U.userid, U.username, U."password", S.system, I.originalid, U.institucionid, U.is_active, I.denominacion_social, I.sectorid, I.sector
            FROM public.users U
            INNER JOIN public.instituciones_financieras I ON U.institucionid = I.institucionid
            inner join public.systems S on S.systemid = U.system
            WHERE username = $1
        `, [username]);
        
        if (userExists.rows.length === 0) {
            response.status(404).json({
                message: 'El usuario no existe para el sistema.'
            });

            return; // Asegúrate de detener la ejecución
        }

        const userId = userExists.rows[0].userid;
        const institucionId = userExists.rows[0].institucionid;
        const institucionClave = userExists.rows[0].originalid;
        const denominacion_social = userExists.rows[0].denominacion_social;
        const sectorid = userExists.rows[0].sectorid;
        const sector = userExists.rows[0].sector;
        const system = userExists.rows[0].system;

        // ======================  VALIDAR LA CONTRASEÑA DEL USUARIO ====================== 
        const validPassword = bcryptjs.compareSync(password, userExists.rows[0].password);
        if (!validPassword) {
            response.status(404).json({
                message: 'La contraseña es incorrecta'
            });
            return; // Asegúrate de detener la ejecución
        }
           
        
        // ====================== VALIDAR EL ENDPOINT ======================
    //    const host = request.hostname || request.headers.host;
    //    const validHosts = {
    //        'REDECO': 'https://api.condusef.gob.mx',
    //        'REUNE': 'https://api-reune-pruebas.condusef.gob.mx'
    //    };
    //    if ((system === 'REDECO' && host !== validHosts.REDECO) || (system === 'REUNE' && host !== validHosts.REUNE)) {
    //        return response.status(403).json({
    //            message: 'La solicitud no se realizó desde el endpoint correcto.'
    //        });
    //    }

        // ====================== GENERAR EL JWT ======================
        const token = await generateJWT(userId, username, institucionId, institucionClave, denominacion_social, sectorid, sector, system);

        let userData = {};
        userData['token_access'] = token;
        userData['username'] = userExists.rows[0].username;

        response.json({
            'msg': 'Login exitoso!!!',
            user: userData
        });

    } catch (error) {
        console.error(error);
        if (!response.headersSent) {
            response.status(500).json({
                'error': 'Parece que ocurrió un error al intentar logear al usuario'
            });
        }
    }
};

export const generateTestToken = async (request, response) => {

    const { key, username, system } = request.body
    const userid = uuidv4()
    const system_key = system == 'REDECO' ? 'redeco_key' : 'reune_key'

    if (username === '') {
        return response.status(400).json({
            msg: 'El campo username no puede estar vacío'
        })
    }

    if (key.length < 1) {
        return response.status(400).json({
            msg: 'El campo key no puede venir vacío'
        })
    }

    try {

        const institucionesQuery = await pool.query(`
                SELECT *
                FROM public.instituciones_financieras
                WHERE ${system_key} = $1
            `, [key])

        if (!institucionesQuery.rows[0]) {
            return response.status(401).json({
                error: 'La key proporcionada no es válida'
            })
        }

        const institucionid = institucionesQuery.rows[0].institucionid
        const institucionClave = institucionesQuery.rows[0].originalid
        const denominacion_social = institucionesQuery.rows[0].denominacion_social
        const sectorid = institucionesQuery.rows[0].sectorid
        const sector = institucionesQuery.rows[0].sector

        const token_access = await generateJWT(userid, username, institucionid, institucionClave, denominacion_social, sectorid, sector, system)

        response.status(200).json({
            data: {
                token_access, // Agregar el token al objeto de respuesta
            }
        })

    } catch (error) {
        console.error(error)
        response.status(500).json({
            error: 'Parece que ha habido un error al intentar crear un súper usuario'
        })
    }

}


export const tokenIsNotExpired = (request, response) => {
    try {
        const { token } = request.query;
        const decodedToken = jwt.verify(token, process.env.SECRETORPRIVATEKEY);
        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime >= decodedToken.exp) {
            response.status(200).json({
                'tokenIsNotExpired': false
            });
        } else {
            response.status(200).json({
                'tokenIsNotExpired': true
            });
        }
    } catch (error) {
        console.error(error);
        if (error.name === 'TokenExpiredError') {
            response.status(200).json({
                'tokenIsNotExpired': false
            });
        } else {
            response.status(500).json({
                'error': 'Parece que ha ocurrido un error al intentar verificar tu token'
            });
        }
    }
};


export const deactivateUser = async (request, response) => {

    const { uid } = request;
    const { username } = request.body
    const status = false

    try {

        // ====================== VALIDAR QUE AL SUPER USUARIO ====================== 
        const superUserValidation = await pool.query(`
            SELECT profileid, is_active
            FROM public.users 
            WHERE userid = $1
        `, [uid]);
        if (superUserValidation.rows.length === 0) {
            response.status(404).json({
                message: 'El usuario no existe!'
            });
            return; // Se debe también agregar un return para evitar que se realicen más operaciones de envío de respuesta.
        }

        const profileid = superUserValidation.rows[0].profileid

        // VERIFICAR QUE EL USUARIO TIENE EL PERFIL PARA EDITAR EL ESTATUS DE UN USUARIO NORMAL
        if (profileid !== "2") {
            return response.status(401).json({
                error: 'El usuario no tiene permisos para realizar esta acción'
            })
        }

        // ====================== VALIDAR AL USUARIO QUE VA A SER MODIFICADO ====================== 
        const userExists = await pool.query(`
                    SELECT username, is_active
                    FROM public.users 
                    WHERE username = $1
                `, [username]);
        if (userExists.rows.length === 0) {
            response.status(404).json({
                message: 'El usuario no existe!'
            });
            return; // Se debe también agregar un return para evitar que se realicen más operaciones de envío de respuesta.
        }

        const is_active = userExists.rows[0].is_active

        if (is_active !== true) {
            return response.status(401).json({
                error: 'El usuario ya ha sido dado de baja'
            })
        }

        const userQuery = await pool.query(`
            UPDATE public.users
            SET is_active = $2
            WHERE username = $1
        `, [username, status])

        response.status(200).json({
            'msg': `Se ha dado de baja al usuario ${username} de forma correcta`
        })

    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que occurrió un error al intentar actualiza el password'
        })
    }
}


export const changePassword = async (request, response) => {

    const { username, new_password } = request.body

    try {

        //ENCRIPTAR LA CONTRASEÑA DEL USUARIO
        const hashedPassword = encriptPassword(new_password)

        const userQuery = await pool.query(`
        UPDATE public.users
        SET password = $2
        WHERE username = $1
        `, [username, hashedPassword])

        response.status(200).json({
            'msg': 'Se ha actualizado correctamente el password del usuario'
        })

    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que occurrió un error al intentar actualiza el password'
        })
    }
}



export const getUsers = async (request, response) => {

    const { institucionid } = request.usuario

    try {
        const usersArray = []
        const usersQuery = await pool.query(`
        SELECT U.username, U.institucionid, I.denominacion_social, U.is_active
        FROM public.users U
        INNER JOIN public.instituciones_financieras I ON U.institucionid = I.institucionid 
        WHERE U.institucionid = $1
        `, [institucionid])
        usersQuery.rows.map(user => {
            const item = {}
            item['username'] = user.username
            item['institucion_financiera'] = user.denominacion_social
            item['is_active'] = user.is_active
            usersArray.push(item)
        })
        response.status(200).json({
            'users': usersArray
        })
    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que ha ocurrido un error al intentar consultar los usuarios'
        })
    }
}


export const addSystem = async (request, response) => {
    const { system } = request.body
    try {
        const systemId = uuidv4()
        //CREAMOS EL REGISTRO EN BASE DE DATOS
        const addSystem = await pool.query(
            `INSERT INTO public.systems (systemid, "system") 
            VALUES ($1, $2) RETURNING *`,
            [systemId, system]
        );
        response.status(200).json({
            'msg': `Sistema ${system} agregado correctamente`
        })
    } catch (error) {
        response.status(500).json({
            'error': 'Parece que hubo un error al intentar agregar un sistema nuevo.'
        })
        console.error(error)
    }
}