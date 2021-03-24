const getDB = require("../../db");

const getCompany = async (req, res, next) => {
    let connection;

    try {
        connection = await getDB();

        //Saco el id de los parámetros de ruta
        const { id } = req.params;

        //Saco la información del usuario
        const [company] = await connection.query(`
        SELECT id, signup_date, name, city, description, email, logo
        FROM company
        WHERE id=?
        `, [id]);

        //Sacamos las fotos de la entrada
        const [photos] = await connection.query(`
            SELECT id, photo, uploadDate FROM company_photos WHERE company_id=?
        `, [id]);
        
        //Creo la respuesta básica
        const companyInfo = {
            logo: company[0].logo,
            name: company[0].name,
            description: company[0].description,
            city: company[0].city,
            //photos: photos
        }

        //Sí el usuario solicitado coincide con el del token añado a la respuesta básica los datos privados
        if(company[0].id === req.auth.id || req.auth.role === 'admin') {
            companyInfo.date = company[0].signup_date;
            companyInfo.email = company[0].email;
            companyInfo.photos = photos;
        }

        //Devuelvo un json con las entradas
        res.send({
            status: "ok",
            data: {
                companyInfo,
            }
        });
    } catch (error) {
        //Lo mandamos al middleware de error
        next(error);
    } finally {
        if(connection) connection.release();
    }
};

module.exports = getCompany;