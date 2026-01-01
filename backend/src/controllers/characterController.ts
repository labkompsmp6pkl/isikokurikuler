import { Request, Response } from 'express';
import pool from '../config/db';

// Get Log Harian
export const getDailyLog = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const date = req.query.date ? req.query.date : new Date().toISOString().split('T')[0];

    const [rows] = await pool.query(
      'SELECT * FROM character_logs WHERE student_id = ? AND log_date = ?',
      [studentId, date]
    );

    if ((rows as any).length > 0) {
      res.json((rows as any)[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("Error fetching log:", error);
    res.status(500).json({ message: 'Error fetching log', error });
  }
};

// Save Log (Updated dengan field baru)
export const saveCharacterLog = async (req: Request, res: Response) => {
  try {
    const studentId = (req as any).user.id;
    const { 
      log_date, mode, 
      // Eksekusi Fields
      wake_up_time, worship_activities, worship_detail, // New
      sport_activities, sport_detail, 
      meal_text, 
      study_activities, study_detail, // New
      social_activities, social_detail, // New
      sleep_time, 
      
      // Rencana Fields
      plan_wake_up_time, plan_worship_activities, plan_worship_detail, // New
      plan_sport_activities, plan_sport_detail,
      plan_meal_text, 
      plan_study_activities, plan_study_detail, // New
      plan_social_activities, plan_social_detail, // New
      plan_sleep_time
    } = req.body;

    // Cek existing log
    const [existing] = await pool.query(
      'SELECT id FROM character_logs WHERE student_id = ? AND log_date = ?',
      [studentId, log_date]
    );

    if ((existing as any).length === 0) {
      // INSERT BARU
      if (mode === 'plan') {
         await pool.query(
          `INSERT INTO character_logs 
          (student_id, log_date, 
           plan_wake_up_time, plan_worship_activities, plan_worship_detail,
           plan_sport_activities, plan_sport_detail,
           plan_meal_text, 
           plan_study_activities, plan_study_detail,
           plan_social_activities, plan_social_detail,
           plan_sleep_time, is_plan_submitted)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [studentId, log_date, 
           plan_wake_up_time, JSON.stringify(plan_worship_activities), plan_worship_detail,
           plan_sport_activities, plan_sport_detail,
           plan_meal_text, 
           JSON.stringify(plan_study_activities), plan_study_detail,
           JSON.stringify(plan_social_activities), plan_social_detail,
           plan_sleep_time]
        );
      } else {
        await pool.query(
            `INSERT INTO character_logs 
            (student_id, log_date, 
             wake_up_time, worship_activities, worship_detail,
             sport_activities, sport_detail, 
             meal_text, 
             study_activities, study_detail,
             social_activities, social_detail,
             sleep_time, is_execution_submitted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [studentId, log_date, 
             wake_up_time, JSON.stringify(worship_activities), worship_detail,
             sport_activities, sport_detail, 
             meal_text, 
             JSON.stringify(study_activities), study_detail,
             JSON.stringify(social_activities), social_detail,
             sleep_time]
          );
      }
    } else {
      // UPDATE EXISTING
      if (mode === 'plan') {
        await pool.query(
          `UPDATE character_logs SET 
           plan_wake_up_time = ?, plan_worship_activities = ?, plan_worship_detail = ?,
           plan_sport_activities = ?, plan_sport_detail = ?,
           plan_meal_text = ?, 
           plan_study_activities = ?, plan_study_detail = ?,
           plan_social_activities = ?, plan_social_detail = ?,
           plan_sleep_time = ?, is_plan_submitted = 1
           WHERE student_id = ? AND log_date = ?`,
          [plan_wake_up_time, JSON.stringify(plan_worship_activities), plan_worship_detail,
           plan_sport_activities, plan_sport_detail,
           plan_meal_text, 
           JSON.stringify(plan_study_activities), plan_study_detail,
           JSON.stringify(plan_social_activities), plan_social_detail,
           plan_sleep_time, 
           studentId, log_date]
        );
      } else {
        // Mode Execution
        await pool.query(
          `UPDATE character_logs SET 
           wake_up_time = ?, worship_activities = ?, worship_detail = ?,
           sport_activities = ?, sport_detail = ?, 
           meal_text = ?, 
           study_activities = ?, study_detail = ?,
           social_activities = ?, social_detail = ?,
           sleep_time = ?, is_execution_submitted = 1
           WHERE student_id = ? AND log_date = ?`,
          [wake_up_time, JSON.stringify(worship_activities), worship_detail,
           sport_activities, sport_detail, 
           meal_text, 
           JSON.stringify(study_activities), study_detail,
           JSON.stringify(social_activities), social_detail,
           sleep_time, 
           studentId, log_date]
        );
      }
    }

    res.status(200).json({ message: 'Log saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving log', error });
  }
};
export const getHistory = async (req: Request, res: Response) => {
    try {
      const studentId = (req as any).user.id;
      const [rows] = await pool.query(
        `SELECT * FROM character_logs WHERE student_id = ? ORDER BY log_date DESC`,
        [studentId]
      );
      res.json(rows);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ message: 'Error fetching history', error });
    }
};