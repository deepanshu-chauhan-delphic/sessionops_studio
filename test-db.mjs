import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://sessionops:sessionops@127.0.0.1:5433/sessionops_studio",
  ssl: false,
});

client
  .connect()
  .then(() => {
    console.log("Connected successfully");
    return client.query("SELECT current_user, current_database()");
  })
  .then((res) => {
    console.log("User:", res.rows[0].current_user);
    console.log("DB:", res.rows[0].current_database);
    return client.end();
  })
  .catch((err) => {
    console.error("Connection failed:", err.message);
    console.error("Code:", err.code);
    client.end();
  });
