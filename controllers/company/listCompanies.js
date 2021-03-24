const getDB = require("../../db");
const listCompanies = async (req, res, next) => {
  let connection;

  try {
    connection = await getDB();

    //Saco querystring
    const { search, order, direction } = req.query;

    const validOrderFields = ["id", "signup_date", "name", "email"];
    const validOrderDirection = ["DESC", "ASC"];

    const orderBy = validOrderFields.includes(order) ? order : "id";
    const orderDirection = validOrderDirection.includes(direction)
      ? direction
      : "ASC";

    let results;

    if (search) {
      [results] = await connection.query(
        `
            SELECT company.id, company.signup_date, company.name, company.city, company.description, company.email, company.logo
            FROM company
            WHERE company.city LIKE ? OR company.name LIKE ?
            GROUP BY company.id, company.signup_date, company.name, company.city, company.description, company.email, company.logo
            ORDER BY ${orderBy} ${orderDirection};
            `,
        [`%${search}%`, `%${search}%`]
      );
    } else {
      //Leo las entradas de la tabla company
      [results] = await connection.query(`
            SELECT company.id, company.signup_date, company.name, company.city, company.description, company.email, company.logo
            FROM company 
            GROUP BY company.id, company.signup_date, company.name, company.city, company.description, company.email, company.logo
            ORDER BY ${orderBy} ${orderDirection};
           `);
    }

    //Saco las id's de los resultados
    const ids = results.map((result) => result.id);

    //Selecciono todas las fotos que estén relacionadas con una id de results
    const [photos] = await connection.query(`
            SELECT * FROM company_photos WHERE company_id IN (${ids.join(",")})
        `);

    //Unimos el array de fotos resultante de la query anterior con los results
    const resultsWithPhotos = results.map((result) => {
      //Fotos correspondiente al resultado (sí las hay de lo contrario devolverá un array vacío)
      const resultPhotos = photos.filter(
        (photo) => photo.company_id === result.id
      );

      return {
        ...result,
        photos: resultPhotos,
      };
    });

    //Devuelvo un json con el resultado + array de fotos
    res.send({
      status: "ok",
      data: resultsWithPhotos,
    });
  } catch (error) {
    //Lo mandamos al middleware de error
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = listCompanies;
