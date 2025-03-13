import { pool } from '../database/auth_db.js'

export const userExists = async (request, response, next) => {

    const { username } = request.body;
    const users = await pool.query(`SELECT * FROM public.users WHERE username = $1`, [username])

    if (users.rows[0]) {
        return response.status(401).json({
            msg: 'Ya existe un usuario con este username'
        })
    }

    next()
}