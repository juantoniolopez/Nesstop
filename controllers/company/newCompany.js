const getDB = require("../../db");
const { generateRandomString, sendMail } = require("../../helpers");

const newCompany = async (req, res, next) => {
  let connection;

  try {
    //Creo conexión a la BBDD
    connection = await getDB();

    //Recojo de email y contraseña
    const { name, email, password, city } = req.body;

    //Compruebo que no estén vacios
    if (!email || !password) {
      const error = new Error("Faltan campos obligatorios");
      error.httpStatus = 400;
      throw error;
    }

    //Compruebo que no exista otro usuario con el mismo email
    const [existingCompany] = await connection.query(
      `
            SELECT id FROM company WHERE email=?
        `,
      [email]
    );

    if (existingCompany.length > 0) {
      const error = new Error("Ya existe una empresa con este email");
      error.httpStatus = 409;
      throw error;
    }

    //Creo un código de registro (contraseña temporal de un solo uso)
    const registrationCode = generateRandomString(40);

    //Mando un email a la empresa con el link de confirmación de email
    const emailBody = `
          Acaba de registrar su empresa en Nesstop. 
          Pulse este enlace para validar su email: ${process.env.PUBLIC_HOST}/company/validate/${registrationCode}
        `;

    await sendMail({
      to: email,
      subject: "Active su perfil de Nesstop",
      body: emailBody,
    });

    //Meto al usuario en la BBDD desactivado y con ese código de registro
    await connection.query(
      `
            INSERT INTO company(signup_date,  name, email, password, city, registrationCode)
            VALUES(?, ?, ?, SHA2(?, 512), ?, ?)
        `,
      [new Date(), name, email, password, city, registrationCode]
    );

    //Mando un respuesta
    res.send({
      status: "ok",
      message: "Empresa registrada, Compruebe su email para activar su perfil",
    });

    res.send({
      message: "Registra una nueva empresa",
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = newCompany;
