const pool = require("../../config/db");

async function initPersonalInfoTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_info (
        id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        name VARCHAR(255),
        department VARCHAR(45),
        approver VARCHAR(255),
        active BOOLEAN DEFAULT true,
        employee_status VARCHAR(45),
        birth_date DATE,
        address VARCHAR(255),
        phone_number VARCHAR(45),
        emergency_contact_person VARCHAR(45),
        emergency_contact_number VARCHAR(45)
      );
    `);
  } catch (error) {
    console.error("Error creating personal_info table:", error);
    throw error;
  }
}

module.exports = { initPersonalInfoTable };