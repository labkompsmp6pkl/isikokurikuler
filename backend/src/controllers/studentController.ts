import { Request, Response } from 'express';
import pool from '../config/db';

export const getJournals = async (req: Request, res: Response) => {
  const studentId = (req as any).user.id; // Diambil dari token JWT

  try {
    const [rows] = await pool.query('SELECT * FROM journals WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journals', error });
  }
};

export const createJournal = async (req: Request, res: Response) => {
    const studentId = (req as any).user.id;
    const { title, content } = req.body;

    try {
        const [result] = await pool.query('INSERT INTO journals (student_id, title, content) VALUES (?, ?, ?)', [studentId, title, content]);
        res.status(201).json({ id: (result as any).insertId, title, content });
    } catch (error) {
        res.status(500).json({ message: 'Error creating journal', error });
    }
};