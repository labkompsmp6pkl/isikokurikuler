import { Request, Response } from 'express';
import pool from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  console.log('\n--- New Login Attempt ---');
  console.log('Attempting to log in with email:', email);

  try {
    const [rows]: any[] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      console.log('Login Error: User not found in database.');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found in database. Role:', user.role);
    console.log('Hash stored in database:', user.password);
    console.log('Password provided by user:', password);

    // Comparing the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log('Password validation result (isPasswordValid):', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Login Error: Password comparison failed.');
      return res.status(401).json({ message: 'Login failed: Password does not match.' });
    }

    console.log('Password is valid. Generating JWT.');
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    console.log('Login successful. Sending token and user data.');
    res.json({
      token,
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    });

  } catch (error) {
    console.error('An unexpected error occurred during login:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(`Registering new user. Email: ${email}, Hashed Password: ${hashedPassword}`);

    const [result]: any[] = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'student']
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });

  } catch (error) {
    console.error('An unexpected error occurred during registration:', error);
    res.status(500).json({ message: 'Error registering user', error });
  }
};
