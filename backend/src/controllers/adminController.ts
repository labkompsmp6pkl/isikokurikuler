import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import { sendWhatsApp } from '../utils/whatsapp';

// CRUD User
export const createUser = async (req: Request, res: Response) => {
  const { username, password, fullName, role, parentId, whatsappNumber } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query('INSERT INTO users (username, password, full_name, role, parent_id, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)', [username, hashedPassword, fullName, role, parentId, whatsappNumber]);
    res.status(201).json({ id: (result as any).insertId, username, fullName, role });
  } catch (error) { 
    res.status(500).json({ message: 'Error creating user', error });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, username, full_name, role, whatsapp_number FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, fullName, role, parentId, whatsappNumber } = req.body;

  try {
    await pool.query(
      'UPDATE users SET username = ?, full_name = ?, role = ?, parent_id = ?, whatsapp_number = ? WHERE id = ?',
      [username, fullName, role, parentId, whatsappNumber, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

export const broadcastMessage = async (req: Request, res: Response) => {
  const { message } = req.body;

  try {
    const [rows]: any[] = await pool.query('SELECT whatsapp_number FROM users WHERE whatsapp_number IS NOT NULL');
    
    for (const user of rows) {
      await sendWhatsApp(user.whatsapp_number, message);
    }

    res.json({ message: 'Broadcast sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending broadcast', error });
  }
};

// Fungsi baru untuk mendapatkan siswa
export const getStudents = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT id, full_name as name, username as email FROM users WHERE role = 'student'");
    res.json({ students: rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error });
  }
};

// Fungsi untuk membuat siswa baru
export const createStudent = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nama, email, dan password diperlukan' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      "INSERT INTO users (full_name, username, password, role) VALUES (?, ?, ?, 'student')",
      [name, email, hashedPassword]
    );
    res.status(201).json({ id: (result as any).insertId, name, email });
  } catch (error) {
    res.status(500).json({ message: 'Error creating student', error });
  }
};

// Fungsi untuk memperbarui siswa
export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Nama dan email diperlukan' });
  }
  try {
    await pool.query(
      "UPDATE users SET full_name = ?, username = ? WHERE id = ? AND role = 'student'",
      [name, email, id]
    );
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating student', error });
  }
};

// Fungsi untuk menghapus siswa
export const deleteStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ? AND role = 'student'", [id]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error });
  }
};
