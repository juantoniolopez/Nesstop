const getDB = require("../../db");
const { generateRandomString, sendMail } = require("../../helpers");

const newUser = async (req, res, next) => {
  let connection;

  try {
    //Creo conexión a la BBDD
    connection = await getDB();

    //Recojo de email y contraseña
    const { name, surname, dni, email, password } = req.body;

    //Compruebo que no estén vacios
    if (!email || !dni || !password) {
      const error = new Error("Faltan campos obligatorios");
      error.httpStatus = 400;
      throw error;
    }

    //Compruebo que no exista otro usuario con el mismo email
    const [existingUser] = await connection.query(
      `
            SELECT id FROM user WHERE email=?
        `,
      [email]
    );

    if (existingUser.length > 0) {
      const error = new Error("Ya existe un usuario con este email");
      error.httpStatus = 409;
      throw error;
    }

    //Creo un código de registro (contraseña temporal de un solo uso)
    const registrationCode = generateRandomString(40);

    //Mando un email al usuario con el link de confirmación de email
    const emailBody = `
          Te acabas de registrar en Nesstop. 
          Pulsa este enlace para validar tu email: ${process.env.PUBLIC_HOST}/user/validate/${registrationCode}
        `;

    await sendMail({
      to: email,
      subject: "Activa tu usuario de Nesstop",
      body: emailBody,
    });

    //Meto al usuario en la BBDD desactivado y con ese código de registro
    await connection.query(
      `
            INSERT INTO user(signup_date, name, surname, dni, email, password, registrationCode)
            VALUES(?, ?, ?, ?, ?, SHA2(?, 512), ?)
        `,
      [new Date(), name, surname, dni, email, password, registrationCode]
    );

    //Mando un respuesta
    res.send({
      status: "ok",
      message: "Usuario registrado comprueba tu email para activarlo",
    });

    res.send({
      message: "Registra un nuevo usuario",
    });
  } catch (error) {
    next(error);
  } finally {
    if (connection) connection.release();
  }
};

module.exports = newUser;
