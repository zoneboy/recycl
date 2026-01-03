import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from "@google/genai";
import { sanitize } from 'isomorphic-dompurify';

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

const response = (statusCode: number, body: any, headers: Record<string, string> = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...headers
  },
  body: JSON.stringify(body),
});

// Helper to create secure cookie string
const createCookie = (token: string, days: number = 7) => {
  const isProd = process.env.NODE_ENV === 'production';
  // Note: 'Secure' attribute requires HTTPS. Localhost handles this differently, 
  // but for production deployment 'Secure' is essential.
  return `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${days * 24 * 60 * 60}; ${isProd ? 'Secure' : ''}`;
};

const verifyToken = (headers: Record<string, string | undefined>) => {
  // Try to get token from Cookie header first (HttpOnly), fallback to Authorization for backward compat if needed
  const cookieHeader = headers['cookie'] || headers['Cookie'];
  let token = null;

  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  // Fallback to Bearer if no cookie (optional, can be removed for strict security)
  if (!token) {
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (authHeader) token = authHeader.split(' ')[1];
  }

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret-key') as any;
  } catch (e) {
    return null;
  }
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- Email Config ---
const sendEmail = async (to: string, subject: string, html: string) => {
    // Skip if no credentials (dev mode without env vars)
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('SMTP credentials missing. Email not sent.');
        console.log(`[Mock Email] To: ${to}, Subject: ${subject}`);
        return;
    }

    try {
      const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
          },
          // Production robustness settings
          tls: {
            rejectUnauthorized: false // Helps with some shared hosting/proxy certificate issues
          },
          connectionTimeout: 5000, // Fail fast (5s) to avoid Netlify function timeouts
          greetingTimeout: 5000,
          socketTimeout: 10000
      });

      await transporter.sendMail({
          from: `"Heptabet Support" <${process.env.SMTP_USER}>`,
          to,
          subject,
          html,
      });
    } catch (error) {
      console.error('Nodemailer Error:', error);
      throw new Error('Failed to send email via SMTP');
    }
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

    // --- AI Analysis ---
    if (path === 'analyze' && event.httpMethod === 'POST') {
        const { prediction } = data;
        if (!prediction) return response(400, { error: 'Prediction data required' });

        // Optional: Verify user subscription here if stricter control is needed
        // const user = verifyToken(event.headers);
        // if (!user || user.subscription !== 'Premium') ...

        try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.error("Server API Key missing");
                return response(500, { error: 'Server configuration error' });
            }

            const ai = new GoogleGenAI({ apiKey });
            const prompt = `
              Act as a professional football analyst for the Nigerian betting market.
              Analyze the following match:
              League: ${prediction.league}
              Match: ${prediction.homeTeam} vs ${prediction.awayTeam}
              Date: ${prediction.date}
              Current Tip: ${prediction.tip}
              
              Provide a concise, 2-paragraph analysis explaining why this tip is likely to win. 
              Focus on recent form, head-to-head stats, and key players. 
              Keep the tone confident and professional.
            `;

            const result = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
            });
            
            return response(200, { analysis: result.text });
        } catch (e: any) {
            console.error("AI Error:", e);
            return response(500, { error: "Failed to generate analysis" });
        }
    }

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
      
      // Send Welcome Email
      try {
          await sendEmail(
              email,
              'Welcome to Heptabet! ⚽️',
              `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
                  <div style="text-align: center; margin-bottom: 20px;">
                      <h1 style="color: #008751; font-size: 28px; margin: 0;">Heptabet</h1>
                  </div>
                  <div style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                      <h2 style="color: #333; margin-top: 0;">Welcome to the Winning Team!</h2>
                      <p>Hello <strong>${name}</strong>,</p>
                      <p>Your registration with Heptabet was successful. We are thrilled to have you on board.</p>
                      <p>Here is what you can expect:</p>
                      <ul style="color: #555;">
                          <li>Daily expert football predictions</li>
                          <li>AI-powered match analysis</li>
                          <li>Transparent win/loss records</li>
                      </ul>
                      <p>Get ready to beat the bookies!</p>
                      <br/>
                      <div style="text-align: center;">
                          <a href="https://heptabet.com" style="background-color: #008751; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
                      </div>
                  </div>
                  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
                      © ${new Date().getFullYear()} Heptabet. All rights reserved.
                  </p>
              </div>
              `
          );
      } catch (emailErr) {
          console.error('Welcome Email Failed:', emailErr);
      }

      const token = jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      const user = (await sql`SELECT id, name, email, phone_number, subscription, role, join_date, subscription_expiry_date FROM users WHERE id = ${id}`)[0];
      
      // Send token in Cookie only
      return response(
        201, 
        { user: { ...user, phoneNumber: user.phone_number, joinDate: user.join_date, subscriptionExpiryDate: user.subscription_expiry_date } },
        { 'Set-Cookie': createCookie(token) }
      );
    }

    if (path === 'auth/login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (users.length === 0) return response(401, { error: 'Invalid credentials' });
      const user = users[0];
      
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return response(401, { error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      
      // Send token in Cookie only
      return response(
        200, 
        { 
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phone_number,
            subscription: user.subscription,
            role: user.role,
            joinDate: user.join_date,
            subscriptionExpiryDate: user.subscription_expiry_date
          }
        }, 
        { 'Set-Cookie': createCookie(token) }
      );
    }

    // Logout Endpoint
    if (path === 'auth/logout' && event.httpMethod === 'POST') {
        // Overwrite cookie with expired date
        return response(
            200, 
            { success: true },
            { 'Set-Cookie': 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0' }
        );
    }

    // 2. Forgot Password Endpoint (Generate OTP)
    if (path === 'auth/forgot-password' && event.httpMethod === 'POST') {
        const { email } = data;
        if (!email) return response(400, { error: 'Email is required' });

        try {
            const users = await sql`SELECT id, name, reset_otp_expiry FROM users WHERE email = ${email}`;
            
            // Security: Don't reveal if user exists, but here we process if they do
            if (users.length > 0) {
                const user = users[0];
                const now = Date.now();
                const OTP_DURATION = 15 * 60 * 1000;
                
                // RATE LIMITING: Check if an OTP was sent recently (last 60 seconds)
                // We infer 'createdAt' from the 'reset_otp_expiry' assuming constant 15min duration.
                if (user.reset_otp_expiry) {
                    const expiry = new Date(user.reset_otp_expiry).getTime();
                    const estimatedCreatedAt = expiry - OTP_DURATION;
                    // Allow 5 second buffer for execution time
                    if (now - estimatedCreatedAt < 60 * 1000) {
                        return response(429, { error: 'Please wait 1 minute before requesting another code.' });
                    }
                }

                const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
                const expiry = Date.now() + OTP_DURATION; // 15 minutes

                // DB Update
                try {
                    await sql`UPDATE users SET reset_otp = ${otp}, reset_otp_expiry = ${expiry} WHERE email = ${email}`;
                } catch (dbErr: any) {
                    console.error('DB Update OTP Error:', dbErr);
                    throw new Error('Database error while generating OTP.');
                }

                // Email Send
                try {
                    await sendEmail(
                        email,
                        'Password Reset Code - Heptabet',
                        `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #008751;">Reset Your Password</h2>
                            <p>Hello ${user.name},</p>
                            <p>You requested to reset your password. Use the code below to proceed:</p>
                            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
                                ${otp}
                            </div>
                            <p>This code expires in 15 minutes.</p>
                            <p>If you didn't request this, please ignore this email.</p>
                        </div>
                        `
                    );
                } catch (emailErr) {
                    console.error('Email Send Error:', emailErr);
                    // Return 500 but with specific message so frontend knows it's an email issue
                    return response(500, { error: 'Failed to send reset email. Please try again later.' });
                }
            } else {
                // Optional: Artificial delay to prevent timing attacks
            }

            return response(200, { message: 'If an account exists with that email, a reset code has been sent.' });
        } catch (err: any) {
            console.error('Forgot Password Handler Error:', err);
            return response(500, { error: err.message || 'Internal Server Error' });
        }
    }

    // 3. Reset Password Endpoint (Verify OTP & Update)
    if (path === 'auth/reset-password' && event.httpMethod === 'POST') {
        const { email, otp, newPassword } = data;
        
        if (!email || !otp || !newPassword) return response(400, { error: 'Missing required fields' });

        try {
            // Check if OTP matches and is not expired
            const users = await sql`
                SELECT id FROM users 
                WHERE email = ${email} 
                AND reset_otp = ${otp} 
                AND reset_otp_expiry > ${Date.now()}
            `;

            if (users.length === 0) {
                // Note: In a robust system we would increment a 'failed_attempts' counter here
                return response(400, { error: 'Invalid or expired OTP' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear OTP
            await sql`
                UPDATE users 
                SET password_hash = ${hashedPassword}, reset_otp = NULL, reset_otp_expiry = NULL 
                WHERE email = ${email}
            `;

            return response(200, { message: 'Password reset successfully' });
        } catch (err: any) {
            console.error('Reset Password Error:', err);
            return response(500, { error: 'Failed to reset password in database.' });
        }
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
        
        // SERVER-SIDE SANITIZATION: Protects against XSS attacks
        const sanitizedContent = sanitize(content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'b', 'i', 'blockquote', 'img'],
            ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class']
        });

        await sql`
            INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, tier)
            VALUES (${id}, ${title}, ${excerpt}, ${sanitizedContent}, ${author}, ${date}, ${imageUrl}, ${tier})
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