const pool = require("../../../config/db");

class EmployeeDetailsService {
  async createEmployeeDetails(data) {
    try {
      const {
        id,
        user_id,
        position,
        job_level,
        payment_method,
        pay_computation,
        salary_type,
        basic_pay,
        allowance,
        gross,
        bank_number,
        salary_grade,
        date_hired,
        employee_activity,
        activity_effect_date,
        remarks,
      } = data;
      const result = await pool.query(
        `INSERT INTO employee_details (
          id, user_id, position, job_level, payment_method, pay_computation, salary_type, basic_pay, allowance,gross, bank_number, salary_grade, date_hired, employee_activity, activity_effect_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
        RETURNING *`,
        [
          id,
          user_id,
          position,
          job_level,
          payment_method,
          pay_computation,
          salary_type,
          basic_pay,
          allowance,
          gross,
          bank_number,
          salary_grade,
          date_hired,
          employee_activity,
          activity_effect_date,
          remarks,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service creating employee_details:", error);
      throw error;
    }
  }

  async getAllEmployeeDetails() {
    try {
      const result = await pool.query("SELECT * FROM employee_details");
      return result.rows;
    } catch (error) {
      console.error("Error in service fetching employee_details:", error);
      throw error;
    }
  }

  async getEmployeeDetailsById(user_id) {
    try {
      const result = await pool.query(
        "SELECT * FROM employee_details WHERE user_id = $1",
        [user_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(
        "Error in service fetching employee_details by user_id:",
        error
      );
      throw error;
    }
  }

  async updateEmployeeDetails(user_id, data) {
    try {
      const {
        id,
        user_id,
        position,
        job_level,
        payment_method,
        pay_computation,
        salary_type,
        basic_pay,
        allowance,
        gross,
        bank_number,
        salary_grade,
        date_hired,
        employee_activity,
        activity_effect_date,
        remarks,
      } = data;
      const result = await pool.query(
        `INSERT INTO employee_details (
          id, user_id, position, job_level, payment_method, pay_computation, salary_type, basic_pay, allowance,
          gross, bank_number, salary_grade, date_hired, employee_activity, activity_effect_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (user_id)
        DO UPDATE SET
            id = EXCLUDED.id,
            user_id = EXCLUDED.user_id,
            position = EXCLUDED.position,
            job_level = EXCLUDED.job_level,
            payment_method = EXCLUDED.payment_method,
            pay_computation = EXCLUDED.pay_computation,
            salary_type = EXCLUDED.salary_type,
            basic_pay = EXCLUDED.basic_pay,
            allowance = EXCLUDED.allowance,
            gross = EXCLUDED.gross,
            bank_number = EXCLUDED.bank_number,
            salary_grade = EXCLUDED.salary_grade,
            date_hired = EXCLUDED.date_hired,
            employee_activity = EXCLUDED.employee_activity,
            activity_effect_date = EXCLUDED.activity_effect_date,
            remarks = EXCLUDED.remarks
        RETURNING *`,
        [
          id,
          user_id,
          position,
          job_level,
          payment_method,
          pay_computation,
          salary_type,
          basic_pay,
          allowance,
          gross,
          bank_number,
          salary_grade,
          date_hired,
          employee_activity,
          activity_effect_date,
          remarks,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service updating employee_details:", error);
      throw error;
    }
  }

  async deleteEmployeeDetails(user_id) {
    try {
      const result = await pool.query(
        "DELETE FROM employee_details WHERE user_id = $1 RETURNING *",
        [user_id]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error in service deleting employee_details:", error);
      throw error;
    }
  }
}

module.exports = new EmployeeDetailsService();
