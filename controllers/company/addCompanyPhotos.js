const getDB = require("../../db");
const { savePhoto, formatDateToDB } = require("../../helpers");

const addCompanyPhotos = async (req, res, next) => {
  let connection;

  try {
    connection = await getDB();

    const { id } = req.params;

    // Miro cuantas fotos tiene la empresa actualmente
    const [currentPhotos] = await connection.query(
      `
      SELECT id FROM company_photos WHERE company_id=?
    `,
      [id]
    );
    console.log(currentPhotos);
    // Si tiene 10 o más fotos devuelvo un error
    if (currentPhotos.length >= 10) {
      const error = new Error(
        "Puede subir un máximo de 10 fotos"
      );
      error.httpStatus = 403;
      throw error;
    }

    // Procesar las imágenes
    const photos = [];

    if (req.files && Object.keys(req.files).length > 0) {
      // Hay imágenes
      for (const photoData of Object.values(req.files).slice(0, 10)) {
        // Guardar la imagen y conseguir el nombre del fichero
        const photoFile = await savePhoto(photoData);

        photos.push(photoFile);
        // Meter una nueva entrada en la tabla entries_photos
        const now = new Date();

        await connection.query(
          `
          INSERT INTO company_photos(uploadDate, photo, company_id)
          VALUES (?, ?, ?)
        `,
          [formatDateToDB(now), photoFile, id]
        );
      }
    }

    res.send({
      status: "ok",
      data: {
        photo: photos,
      },
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = addCompanyPhotos;