const pool = require("../../../config/db");

class PersonalInfoService {
  async createPersonalInfo(data) {
    try {
      const {
        active,
        birth_date,
        address,
        phone_number,
        emergency_contact_person,
        emergency_contact_number,
        user_id,
      } = data;
      const result = await pool.query(
        `INSERT INTO personal_info (
          active, birth_date, address, phone_number, emergency_contact_person, emergency_contact_number, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          active,
          birth_date,
          address,
          phone_number,
          emergency_contact_person,
          emergency_contact_number,
          user_id,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service creating personal_info:", error);
      throw error;
    }
  }

  async getAllPersonalInfo() {
    try {
      const result = await pool.query("SELECT * FROM personal_info");
      return result.rows;
    } catch (error) {
      console.error("Error in service fetching personal_info:", error);
      throw error;
    }
  }

  async getPersonalInfoById(user_id) {
    try {
      const result = await pool.query(
        "SELECT * FROM personal_info WHERE user_id = $1",
        [user_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(
        "Error in service fetching personal_info by user_id:",
        error
      );
      throw error;
    }
  }

  async updatePersonalInfo(user_id, data) {
    try {
      const {
        active,
        birth_date,
        address,
        phone_number,
        emergency_contact_person,
        emergency_contact_number,
      } = data;
      const result = await pool.query(
        `INSERT INTO personal_info (
          user_id, active, birth_date, 
          address, phone_number, emergency_contact_person, emergency_contact_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id)
        DO UPDATE SET
          active = EXCLUDED.active,
          birth_date = EXCLUDED.birth_date,
          address = EXCLUDED.address,
          phone_number = EXCLUDED.phone_number,
          emergency_contact_person = EXCLUDED.emergency_contact_person,
          emergency_contact_number = EXCLUDED.emergency_contact_number,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          user_id,
          active,
          birth_date,
          address,
          phone_number,
          emergency_contact_person,
          emergency_contact_number,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service updating personal_info:", error);
      throw error;
    }
  }

  async deletePersonalInfo(user_id) {
    try {
      const result = await pool.query(
        "DELETE FROM personal_info WHERE user_id = $1 RETURNING *",
        [user_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service deleting personal_info:", error);
      throw error;
    }
  }
}

module.exports = new PersonalInfoService();
