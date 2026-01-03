import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

interface HandlerEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
}

const getSql = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL);
};

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  },
  body: JSON.stringify(body),
});

const verifyToken = (headers: Record<string, string | undefined>) => {
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
  } catch (e) {
    return null;
  }
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return response(200, {});

  const path = event.path
    .replace(/^\/\.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    .replace(/^\//, '');
  
  let data: any = {};
  if (event.body) {
    try { data = JSON.parse(event.body); } catch (e) {}
  }

  try {
    const sql = getSql();

    // --- Auth ---

    // 1. Register Endpoint
    if (path === 'auth/register' && event.httpMethod === 'POST') {
      const { name, email, password, phoneNumber } = data;
      
      if (!name) return response(400, { error: 'Name is required' });
      if (!email || !isValidEmail(email)) return response(400, { error: 'Invalid email format' });
      if (!password) return response(400, { error: 'Password is required' });
      
      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.length > 0) return response(400, { error: 'Email already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = `u_${Date.now()}`;
      const role = email.toLowerCase() === 'admin@heptabet.com' ? 'admin' : 'user';
      
      await sql`
        INSERT INTO users (id, name, email, password_hash, phone_number, subscription, role, join_date)
        VALUES (${id}, ${name}, ${email}, ${hashedPassword}, ${phoneNumber}, 'Free', ${role}, ${new Date().toISOString()})
      `;
      
      const token = jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      const user = (await sql`SELECT id, name, email, phone_number, subscription, role, join_date, subscription_expiry_date FROM users WHERE id = ${id}`)[0];
      
      return response(201, { user: { ...user, phoneNumber: user.phone_number, joinDate: user.join_date, subscriptionExpiryDate: user.subscription_expiry_date }, token });
    }

    if (path === 'auth/login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (users.length === 0) return response(401, { error: 'Invalid credentials' });
      const user = users[0];
      
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return response(401, { error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      
      return response(200, { 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phone_number,
          subscription: user.subscription,
          role: user.role,
          joinDate: user.join_date,
          subscriptionExpiryDate: user.subscription_expiry_date
        }, 
        token 
      });
    }

    // Forgot Password - Send OTP
    if (path === 'auth/forgot-password' && event.httpMethod === 'POST') {
      const { email } = data;
      if (!email || !isValidEmail(email)) return response(400, { error: 'Invalid email' });

      const users = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (users.length === 0) return response(404, { error: 'User not found' });

      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Create/Update Verification Table
      await sql`CREATE TABLE IF NOT EXISTS verifications (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )`;

      await sql`
        INSERT INTO verifications (email, code, expires_at)
        VALUES (${email}, ${code}, ${expiresAt.toISOString()})
        ON CONFLICT (email) 
        DO UPDATE SET code = ${code}, expires_at = ${expiresAt.toISOString()}
      `;

      // Send Email
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        try {
          await transporter.sendMail({
            from: `"Heptabet Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your Password - Heptabet',
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #008751; text-align: center;">Password Reset Request</h2>
                <p>You requested to reset your password. Use the code below to complete the process:</p>
                <div style="background: #f0fdf4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #008751; margin: 20px 0;">
                  ${code}
                </div>
                <p style="font-size: 12px; color: #666; text-align: center;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
              </div>
            `
          });
        } catch (e) {
          console.error("Email error:", e);
          return response(500, { error: 'Failed to send email' });
        }
      } else {
        console.warn("SMTP not configured");
        // For development without SMTP, you might log the code here, but strict prod requires SMTP
      }

      return response(200, { success: true, message: 'OTP sent' });
    }

    // Reset Password - Verify OTP & Update
    if (path === 'auth/reset-password' && event.httpMethod === 'POST') {
      const { email, otp, newPassword } = data;
      
      if (!email || !otp || !newPassword) return response(400, { error: 'Missing fields' });
      if (newPassword.length < 6) return response(400, { error: 'Password too short' });

      // Verify OTP
      const record = await sql`
        SELECT * FROM verifications 
        WHERE email = ${email} AND code = ${otp} AND expires_at > NOW()
      `;

      if (record.length === 0) return response(400, { error: 'Invalid or expired OTP' });

      // Update Password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE email = ${email}`;

      // Clean up OTP
      await sql`DELETE FROM verifications WHERE email = ${email}`;

      return response(200, { success: true, message: 'Password updated successfully' });
    }

    if (path === 'auth/me' && event.httpMethod === 'GET') {
      const decoded = verifyToken(event.headers);
      if (!decoded) return response(401, { error: 'Unauthorized' });
      
      const users = await sql`SELECT * FROM users WHERE id = ${decoded.id}`;
      if (users.length === 0) return response(404, { error: 'User not found' });
      
      const u = users[0];
      return response(200, {
          id: u.id,
          name: u.name,
          email: u.email,
          phoneNumber: u.phone_number,
          subscription: u.subscription,
          role: u.role,
          joinDate: u.join_date,
          subscriptionExpiryDate: u.subscription_expiry_date
      });
    }

    // --- Predictions ---
    if (path === 'predictions' && event.httpMethod === 'GET') {
      const preds = await sql`SELECT * FROM predictions ORDER BY date DESC, time ASC`;
      const mapped = preds.map(p => ({
        id: p.id,
        league: p.league,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        date: p.date,
        time: p.time,
        tip: p.tip,
        odds: Number(p.odds),
        confidence: p.confidence,
        minTier: p.min_tier,
        status: p.status,
        result: p.result,
        tipsterId: p.tipster_id
      }));
      return response(200, mapped);
    }

    if (path === 'predictions' && event.httpMethod === 'POST') {
      const user = verifyToken(event.headers);
      if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
      
      const { id, league, homeTeam, awayTeam, date, time, tip, odds, confidence, minTier, status, result, tipsterId } = data;
      await sql`
        INSERT INTO predictions (id, league, home_team, away_team, date, time, tip, odds, confidence, min_tier, status, result, tipster_id)
        VALUES (${id}, ${league}, ${homeTeam}, ${awayTeam}, ${date}, ${time}, ${tip}, ${odds}, ${confidence}, ${minTier}, ${status}, ${result}, ${tipsterId})
      `;
      return response(201, { success: true });
    }

    if (path.startsWith('predictions/') && event.httpMethod === 'DELETE') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        await sql`DELETE FROM predictions WHERE id = ${id}`;
        return response(200, { success: true });
    }

    if (path.startsWith('predictions/') && event.httpMethod === 'PUT') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        if (data.status) await sql`UPDATE predictions SET status = ${data.status} WHERE id = ${id}`;
        if (data.result) await sql`UPDATE predictions SET result = ${data.result} WHERE id = ${id}`;
        return response(200, { success: true });
    }

    // --- Transactions ---
    if (path === 'transactions' && event.httpMethod === 'GET') {
      const user = verifyToken(event.headers);
      if (!user) return response(401, { error: 'Unauthorized' });
      
      let txs;
      if (user.role === 'admin') {
         txs = await sql`SELECT * FROM transactions ORDER BY created_at DESC`;
      } else {
         txs = await sql`SELECT * FROM transactions WHERE user_id = ${user.id} ORDER BY created_at DESC`;
      }
      const mapped = txs.map(t => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name,
          planId: t.plan_id,
          amount: t.amount,
          method: t.method,
          status: t.status,
          date: t.date,
          receiptUrl: t.receipt_url
      }));
      return response(200, mapped);
    }

    if (path === 'transactions' && event.httpMethod === 'POST') {
       const user = verifyToken(event.headers);
       if (!user) return response(401, { error: 'Unauthorized' });
       const { id, userId, userName, planId, amount, method, status, date, receiptUrl } = data;
       
       await sql`
        INSERT INTO transactions (id, user_id, user_name, plan_id, amount, method, status, date, receipt_url)
        VALUES (${id}, ${userId}, ${userName}, ${planId}, ${amount}, ${method}, ${status}, ${date}, ${receiptUrl})
       `;
       return response(201, { success: true });
    }

    if (path.startsWith('transactions/') && event.httpMethod === 'PUT') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        
        await sql`UPDATE transactions SET status = ${data.status} WHERE id = ${id}`;
        
        if (data.status === 'Approved') {
            const txs = await sql`SELECT user_id, plan_id FROM transactions WHERE id = ${id}`;
            if (txs.length > 0) {
                const tx = txs[0];
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + 30);
                await sql`
                    UPDATE users 
                    SET subscription = ${tx.plan_id}, subscription_expiry_date = ${expiry.toISOString()}
                    WHERE id = ${tx.user_id}
                `;
            }
        }
        return response(200, { success: true });
    }

    // --- Users ---
    if (path === 'users' && event.httpMethod === 'GET') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        
        const users = await sql`SELECT * FROM users ORDER BY join_date DESC`;
        const mapped = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phoneNumber: u.phone_number,
            subscription: u.subscription,
            role: u.role,
            joinDate: u.join_date,
            subscriptionExpiryDate: u.subscription_expiry_date
        }));
        return response(200, mapped);
    }

    if (path.startsWith('users/') && event.httpMethod === 'PUT') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        
        if (data.subscription) {
            await sql`UPDATE users SET subscription = ${data.subscription} WHERE id = ${id}`;
        }
        
        if (data.subscriptionExpiryDate !== undefined) {
             await sql`UPDATE users SET subscription_expiry_date = ${data.subscriptionExpiryDate} WHERE id = ${id}`;
        }
        
        return response(200, { success: true });
    }

    if (path.startsWith('users/') && event.httpMethod === 'DELETE') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        await sql`DELETE FROM users WHERE id = ${id}`;
        return response(200, { success: true });
    }

    // --- Blog ---
    if (path === 'blog' && event.httpMethod === 'GET') {
        const posts = await sql`SELECT * FROM blog_posts ORDER BY date DESC`;
        const mapped = posts.map(p => ({ 
            id: p.id,
            title: p.title,
            excerpt: p.excerpt,
            content: p.content,
            author: p.author,
            date: p.date,
            imageUrl: p.image_url,
            tier: p.tier
        }));
        return response(200, mapped);
    }

    if (path === 'blog' && event.httpMethod === 'POST') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const { id, title, excerpt, content, author, date, imageUrl, tier } = data;
        await sql`
            INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, tier)
            VALUES (${id}, ${title}, ${excerpt}, ${content}, ${author}, ${date}, ${imageUrl}, ${tier})
        `;
        return response(201, { success: true });
    }

    if (path.startsWith('blog/') && event.httpMethod === 'DELETE') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        await sql`DELETE FROM blog_posts WHERE id = ${id}`;
        return response(200, { success: true });
    }

    return response(404, { error: 'Not found' });
  } catch (error: any) {
    console.error('API Error', error);
    return response(500, { error: error.message });
  }
};