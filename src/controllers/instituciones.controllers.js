import { pool } from "../database/auth_db.js"


export const getInstituciones = async (request, response) => {
    try {
        const { page = 1, limit = 10 } = request.query; // Obtener el número de página y el límite de la solicitud

        // Calcular el offset basado en la página y el límite
        const offset = (page - 1) * limit;

        const institucionesQuery = await pool.query(
            `
            SELECT * FROM public.instituciones_financieras
            ORDER BY originalid
            OFFSET $1
            LIMIT $2
            `,
            [offset, limit]
        );

        response.status(200).json({
            'instituciones': institucionesQuery.rows
        });
    } catch (error) {
        console.error(error);
        response.status(500).json({
            'error': 'Parece que ha habido un error al intentar consultar las instituciones financieras'
        });
    }
};


export const searchInstitucion = async (request, response) => {

    const { search, page, limit } = request.query

    // Calcular el offset basado en la página y el límite
    const offset = (page - 1) * limit;

    try {
        const searchQuery = await pool.query(`
        SELECT * FROM public.instituciones_financieras
        WHERE denominacion_social
        ILIKE '%' || $1 || '%'
        OFFSET $2
        LIMIT $3
        `, [search, offset, limit])
        response.status(200).json({
            'results': searchQuery.rows
        })
    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que hubo un error en la búsqueda'
        })
    }
}


export const getSingleInstitucion = async (request, response) => {

    const institucionId = request.query.institucion_id

    try {

        const institucionQuery = await pool.query(`
        SELECT * 
        FROM public.instituciones_financieras
        WHERE institucionid = $1
        `, [institucionId])

        response.status(200).json({
            'institucion': institucionQuery.rows
        })

    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que hubo un error al intentar consultar los datos de una institución financiera'
        })
    }
}


export const updateInstitucion = async (request, response) => {
    const institucionId = request.query.institucion_id
    const { originalid, denominacion_social, clave_registro, reune, redeco } = request.body
    try {

        const institucionQuery = await pool.query(`
        UPDATE public.instituciones_financieras
        SET originalid = $2, denominacion_social = $3, clave_registro = $4, reune = $5, redeco = $6
        WHERE institucionid = $1;
        `, [institucionId, originalid, denominacion_social, clave_registro, reune, redeco])

        response.status(200).json({
            'msg': `Se ha actualizado corectamente los datos de la institución ${denominacion_social}`
        })

    } catch (error) {
        console.error(error)
        response.status(500).json({
            'error': 'Parece que hubo un error al intentar actualizar los datos de una institución financiera'
        })
    }
}