const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
app.use(require("morgan")("dev"));

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

const PORT = process.env.PORT || 3000;

app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees(name, department_id) values ($1, $2) RETURNING *`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
                    DELETE from employees WHERE id = $1;  
                `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE employees
      SET name=$1, department_id =$2, updated_at=now()
      WHERE id=$3 
      `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

const init = async () => {
  await client.connect();
  let SQL = `
    
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
       department VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        name VARCHAR(255) NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  SQL = `
    INSERT INTO departments(department) values('clothes');
    INSERT INTO departments(department) values('shoes');
    INSERT INTO employees(name, department_id) values('Pedro', (SELECT id from departments WHERE department='clothes'));
    INSERT INTO employees(name, department_id) values('Paulo', (SELECT id from departments WHERE department='clothes'));
    INSERT INTO employees(name, department_id) values('Patricia', (SELECT id from departments WHERE department='clothes'));
    INSERT INTO employees(name, department_id) values('Marta', (SELECT id from departments WHERE department='shoes'));
    INSERT INTO employees(name, department_id) values('Marcia', (SELECT id from departments WHERE department='shoes'));
    INSERT INTO employees(name, department_id) values('Maria', (SELECT id from departments WHERE department='shoes'));
  
    `;
  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
};

init();
