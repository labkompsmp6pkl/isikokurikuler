import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET as string, 
      { expiresIn: '1h' } 
    );

    res.json({ token, user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role } });

  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result]: any[] = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)', 
      [name, email, hashedPassword, 'student']
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });

  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};
