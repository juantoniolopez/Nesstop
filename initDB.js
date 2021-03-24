require("dotenv").config();
const faker = require("faker");
const { random } = require("lodash");
const getDB = require("./db");
const { formatDateToDB } = require("./helpers");

let connection;

async function main() {
    try {
        connection = await getDB();

        await connection.query(`DROP TABLE IF EXISTS company_photos`);
        await connection.query(`DROP TABLE IF EXISTS evaluation`);
        await connection.query(`DROP TABLE IF EXISTS company_aspects`);
        await connection.query(`DROP TABLE IF EXISTS user_company`);
        await connection.query(`DROP TABLE IF EXISTS company`);
        await connection.query(`DROP TABLE IF EXISTS user`);


        //Creamos tabla company
        
        await connection.query(`
            CREATE TABLE company (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                signup_date DATETIME NOT NULL,
                name VARCHAR(255) NOT NULL,
                city VARCHAR(255),
                description TEXT,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(512) NOT NULL,
                logo VARCHAR(50),
                active BOOLEAN DEFAULT false,
                registrationCode VARCHAR(100),
                lastAuthUpdate DATETIME DEFAULT NULL
            );
        `);

        //Creamos tabla user
        
        await connection.query(`
            CREATE TABLE user (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                signup_date DATETIME NOT NULL,
                name VARCHAR(128) NOT NULL,
                surname VARCHAR(128) NOT NULL,
                bio VARCHAR(2048),
                city VARCHAR(128),
                dni VARCHAR(128) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(512) NOT NULL,
                avatar VARCHAR(50),
                active BOOLEAN DEFAULT false,
                registrationCode VARCHAR(100),
                role ENUM("admin", "normal") DEFAULT "normal" NOT NULL,
                lastAuthUpdate DATETIME DEFAULT NULL
            );
        `);
        
    
        //Creamos tabla usuario-companía

        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_company (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                company_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL,
                work_position VARCHAR(255),
                starting_date DATE NOT NULL,
                end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT false,
                registrationCode VARCHAR(100),
                FOREIGN KEY (company_id)
                    REFERENCES company(id),
                FOREIGN KEY (user_id)
                    REFERENCES user(id),
                CONSTRAINT user_company CHECK (starting_date < end_date)
            );
        `);

        //Creamos tabla evaluation

        await connection.query(`
            CREATE TABLE IF NOT EXISTS evaluation (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                company_id BIGINT NOT NULL,
                user_id BIGINT NOT NULL,
                evaluation_date DATETIME,
                aspect1_points TINYINT NOT NULL,
                aspect2_points TINYINT,
                aspect3_points TINYINT,
                aspect4_points TINYINT,
                aspect5_points TINYINT,
                total TINYINT,
                FOREIGN KEY (company_id)
                    REFERENCES company(id),
                FOREIGN KEY (user_id)
                    REFERENCES user(id),
                CONSTRAINT evaluation CHECK (aspect1_points >= 1 AND aspect1_points <= 10 AND aspect2_points >= 1 AND aspect2_points <= 10 AND aspect3_points >= 1 AND aspect3_points <= 10 AND aspect4_points >= 1 AND aspect4_points <= 10 AND aspect5_points >= 1 AND aspect5_points <= 10)
            );
        `);

        
        //Creamos tabla company_aspects
        
        await connection.query(`
            CREATE TABLE company_aspects (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                company_id BIGINT NOT NULL,
                aspect1 VARCHAR(2048),
                aspect2 VARCHAR(2048),
                aspect3 VARCHAR(2048),
                aspect4 VARCHAR(2048),
                aspect5 VARCHAR(2048),
                FOREIGN KEY (company_id)
                    REFERENCES company(id)
            );
        `);

        //Creamos tabla empresa-photos

        await connection.query(`
            CREATE TABLE company_photos (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                uploadDate DATETIME NOT NULL,
                photo VARCHAR(50) NOT NULL,
                company_id BIGINT NOT NULL,
                FOREIGN KEY (company_id)
                    REFERENCES company(id)
            );
        `);


        console.log('Tablas creadas');

        let users = 10;
        let companies = 10;
        let now = new Date();
        
        //Datos de prueba
        //Introducimos companies

        for (let i = 0; i < companies; i++) {
            const company = faker.company.companyName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await connection.query(`
                INSERT INTO company(signup_date, name, email, password, active, lastAuthUpdate)
                VALUES ('${formatDateToDB(now)}', '${company}', '${email}', SHA2('${password}', 512), true, '1990-09-01');
            `)
        }
        //Introducimos usuarios
        //introducimos un usuario administrador
        await connection.query(`
            INSERT INTO user (signup_date, name, surname, dni, email, password, active, role, lastAuthUpdate)
            VALUES ('${formatDateToDB(now)}', 'Fran', 'Iglesias', '35698542X', 'fran@gmail.com', SHA2(${process.env.ADMIN_PASSWORD}, 512), true, 'admin', '1990-09-01');
        `);

        //Introducimo usuarios aleatorios
        for (let i = 0; i < users; i++) {
            const name = faker.name.firstName();
            const lastName = faker.name.lastName();
            const dni = faker.random.word();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await connection.query(`
                INSERT INTO user(signup_date, name, surname, dni, email, password, active)
                VALUES ('${formatDateToDB(now)}', '${name}', '${lastName}', '${dni}', '${email}', SHA2('${password}', 512), true);
            `);
        }


       //Introducimos usuario-companía

        for (let i = 0; i < users; i++) {

            await connection.query(`
                INSERT INTO user_company(company_id ,user_id, work_position ,starting_date ,end_date, active)
                VALUES ('${random(1, 10)}', '${random(2, users+1)}', '${faker.name.jobTitle()}', '1990-09-01', '${formatDateToDB(now)}', true);
            `);
        }

        //Introducimo datos en evalution

        for (let i = 0; i < companies; i++) {
            const now = new Date();

            await connection.query(`
                INSERT INTO evaluation(company_id ,user_id, evaluation_date, aspect1_points, aspect2_points, aspect3_points, aspect4_points, aspect5_points, total)
                VALUES ('${random(1, 10)}', '${random(1, 10)}', '${formatDateToDB(now)}', '${random(1, 10)}', '${random(1, 10)}', '${random(1, 10)}', '${random(1, 10)}', '${random(1, 10)}', '${random(1, 10)}');
            `);
        }

        // Introducimos aspectos a valorar

        for (let i = 0; i < companies; i++) {
            await connection.query(`
                INSERT INTO company_aspects(company_id, aspect1, aspect2, aspect3, aspect4, aspect5)
                VALUES ('${random(1, 10)}', '${faker.random.word()}', '${faker.random.word()}', '${faker.random.word()}', '${faker.random.word()}', '${faker.random.word()}');
            `);
        }

        //Introducimos fotos empresa

        for (let i = 0; i < companies; i++) {
            const now = new Date();

            await connection.query(`
                INSERT INTO company_photos(uploadDate, photo, company_id)
                VALUES ('${formatDateToDB(now)}', '${faker.random.word()}', '${random(1, 10)}' );
            `);
        }

    } catch(error) {
        console.error(error);
        } finally {
            if (connection) {
                connection.release();
                // eslint-disable-next-line no-undef
                process.exit();
            }
        }
}

main();