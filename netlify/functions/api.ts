import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --- Types ---
interface HandlerEvent {
  httpMethod: string;
  path: string;
  body: string | null;
  headers: Record<string, string | undefined>;
}

// --- DB Connection ---
const getSql = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL);
};

// --- Helpers ---
const response = (statusCode: number, body: any) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Adjust for production security
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

// --- Main Handler ---
export const handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return response(200, {});

  const sql = getSql();
  const path = event.path.replace('/api/', '').replace('/.netlify/functions/api/', '');
  
  // Parse Body
  let data: any = {};
  if (event.body) {
    try { data = JSON.parse(event.body); } catch (e) {}
  }

  try {
    // --- Auth Routes ---
    
    if (path === 'auth/register' && event.httpMethod === 'POST') {
      const { name, email, password, phoneNumber } = data;
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = `u_${Date.now()}`;
      
      await sql`
        INSERT INTO users (id, name, email, password_hash, phone_number, subscription, role, join_date)
        VALUES (${id}, ${name}, ${email}, ${hashedPassword}, ${phoneNumber}, 'Free', 'user', ${new Date().toISOString()})
      `;
      
      const token = jwt.sign({ id, email, role: 'user' }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      const user = (await sql`SELECT id, name, email, phone_number, subscription, role, join_date, subscription_expiry_date FROM users WHERE id = ${id}`)[0];
      
      return response(201, { user, token });
    }

    if (path === 'auth/login' && event.httpMethod === 'POST') {
      const { email, password } = data;
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      
      if (users.length === 0) return response(401, { error: 'Invalid credentials' });
      
      const user = users[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      
      if (!valid) return response(401, { error: 'Invalid credentials' });
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '7d' });
      
      // Remove password from response
      delete user.password_hash;
      return response(200, { user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number,
        subscription: user.subscription,
        role: user.role,
        joinDate: user.join_date,
        subscriptionExpiryDate: user.subscription_expiry_date
      }, token });
    }

    if (path === 'auth/me' && event.httpMethod === 'GET') {
      const decoded = verifyToken(event.headers);
      if (!decoded) return response(401, { error: 'Unauthorized' });
      
      const users = await sql`SELECT id, name, email, phone_number, subscription, role, join_date, subscription_expiry_date FROM users WHERE id = ${decoded.id}`;
      return response(200, users[0]);
    }

    // --- Data Routes ---

    if (path === 'predictions' && event.httpMethod === 'GET') {
      const preds = await sql`SELECT * FROM predictions ORDER BY date DESC, time ASC`;
      // Map DB snake_case to camelCase
      const mapped = preds.map(p => ({
        ...p,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        minTier: p.min_tier,
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
        // Handle partial updates
        if (data.status) await sql`UPDATE predictions SET status = ${data.status} WHERE id = ${id}`;
        if (data.result) await sql`UPDATE predictions SET result = ${data.result} WHERE id = ${id}`;
        
        return response(200, { success: true });
    }

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
          ...t,
          userId: t.user_id,
          userName: t.user_name,
          planId: t.plan_id,
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
    
    // Admin Transaction Approval
    if (path.startsWith('transactions/') && event.httpMethod === 'PUT') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        const id = path.split('/')[1];
        
        await sql`UPDATE transactions SET status = ${data.status} WHERE id = ${id}`;
        
        // If Approved, update user subscription
        if (data.status === 'Approved') {
            const tx = (await sql`SELECT user_id, plan_id FROM transactions WHERE id = ${id}`)[0];
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30); // 30 Days
            
            await sql`
                UPDATE users 
                SET subscription = ${tx.plan_id}, subscription_expiry_date = ${expiry.toISOString()}
                WHERE id = ${tx.user_id}
            `;
        }
        return response(200, { success: true });
    }
    
    if (path === 'users' && event.httpMethod === 'GET') {
        const user = verifyToken(event.headers);
        if (!user || user.role !== 'admin') return response(403, { error: 'Admin only' });
        
        const users = await sql`SELECT id, name, email, phone_number, subscription, role, join_date, subscription_expiry_date FROM users`;
        const mapped = users.map(u => ({
            ...u,
            phoneNumber: u.phone_number,
            joinDate: u.join_date,
            subscriptionExpiryDate: u.subscription_expiry_date
        }));
        return response(200, mapped);
    }
    
    if (path === 'blog' && event.httpMethod === 'GET') {
        const posts = await sql`SELECT * FROM blog_posts ORDER BY date DESC`;
        const mapped = posts.map(p => ({ ...p, imageUrl: p.image_url }));
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

    return response(404, { error: 'Not found' });
  } catch (error: any) {
    console.error('API Error', error);
    return response(500, { error: error.message });
  }
};