import { Client } from 'pg';
import { GoogleGenAI } from "@google/genai";

const getDbClient = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing");
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon/Production Postgres
  });
  await client.connect();
  return client;
};

export const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const method = event.httpMethod;
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', ''); 
  
  let client;

  try {
    // --- AI PROXY ROUTE (Does not require Database) ---
    if (path === '/analyze' && method === 'POST') {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return { 
                statusCode: 503, 
                headers, 
                body: JSON.stringify({ message: 'Server API configuration missing' }) 
            };
        }

        const { prediction } = JSON.parse(event.body);
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

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: prompt,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ analysis: response.text })
        };
    }

    // --- DATABASE ROUTES ---
    // Only connect to DB for non-AI routes
    try {
        client = await getDbClient();
    } catch (dbError) {
        console.error("Database connection failed:", dbError);
        // If DB fails, return 503 so frontend knows to use mock data
        return { statusCode: 503, headers, body: JSON.stringify({ message: "Database unavailable" }) };
    }

    // --- AUTH ---
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);
      const res = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      
      if (res.rows.length === 0) {
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Invalid credentials' }) };
      }
      
      const user = res.rows[0];
      const formattedUser = {
        ...user,
        phoneNumber: user.phone_number,
        joinDate: user.join_date,
        subscriptionExpiryDate: user.subscription_expiry_date
      };
      
      return { statusCode: 200, headers, body: JSON.stringify(formattedUser) };
    }

    if (path === '/auth/register' && method === 'POST') {
        const body = JSON.parse(event.body);
        const { id, name, email, phoneNumber, password, subscription, role, joinDate } = body;
        
        await client.query(
            `INSERT INTO users (id, name, email, phone_number, password, subscription, role, join_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, name, email, phoneNumber, password, subscription, role, joinDate]
        );
        
        return { statusCode: 201, headers, body: JSON.stringify(body) };
    }

    // --- PREDICTIONS ---
    if (path === '/predictions' || path === '/predictions/') {
        if (method === 'GET') {
            const res = await client.query('SELECT * FROM predictions ORDER BY date DESC');
            const predictions = res.rows.map((p: any) => ({
                ...p,
                homeTeam: p.home_team,
                awayTeam: p.away_team,
                minTier: p.min_tier,
                tipsterId: p.tipster_id
            }));
            return { statusCode: 200, headers, body: JSON.stringify(predictions) };
        }
        
        if (method === 'POST') {
            const p = JSON.parse(event.body);
            await client.query(
                `INSERT INTO predictions (id, league, home_team, away_team, date, time, tip, odds, confidence, min_tier, status, result, tipster_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [p.id, p.league, p.homeTeam, p.awayTeam, p.date, p.time, p.tip, p.odds, p.confidence, p.minTier, p.status, p.result, p.tipsterId]
            );
            return { statusCode: 201, headers, body: JSON.stringify(p) };
        }

        if (method === 'PUT') {
            const p = JSON.parse(event.body);
            await client.query(
                `UPDATE predictions SET status = $1, result = $2 WHERE id = $3`,
                [p.status, p.result, p.id]
            );
            return { statusCode: 200, headers, body: JSON.stringify(p) };
        }
        
        if (method === 'DELETE') {
            const id = event.queryStringParameters?.id;
            await client.query('DELETE FROM predictions WHERE id = $1', [id]);
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
        }
    }

    // --- USERS ---
    if (path === '/users' || path === '/users/') {
        if (method === 'GET') {
            const res = await client.query('SELECT * FROM users');
            const users = res.rows.map((user: any) => ({
                ...user,
                phoneNumber: user.phone_number,
                joinDate: user.join_date,
                subscriptionExpiryDate: user.subscription_expiry_date
            }));
            return { statusCode: 200, headers, body: JSON.stringify(users) };
        }
        
        if (method === 'PUT') {
            const u = JSON.parse(event.body);
            await client.query(
                `UPDATE users SET subscription = $1, subscription_expiry_date = $2 WHERE id = $3`,
                [u.subscription, u.subscriptionExpiryDate, u.id]
            );
            return { statusCode: 200, headers, body: JSON.stringify(u) };
        }

        if (method === 'DELETE') {
            const id = event.queryStringParameters?.id;
            await client.query('DELETE FROM users WHERE id = $1', [id]);
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
        }
    }

    // --- TRANSACTIONS ---
    if (path === '/transactions' || path === '/transactions/') {
        if (method === 'GET') {
            const res = await client.query('SELECT * FROM transactions ORDER BY date DESC');
            const txs = res.rows.map((t: any) => ({
                ...t,
                userId: t.user_id,
                userName: t.user_name,
                planId: t.plan_id,
                receiptUrl: t.receipt_url
            }));
            return { statusCode: 200, headers, body: JSON.stringify(txs) };
        }
        
        if (method === 'POST') {
            const t = JSON.parse(event.body);
            await client.query(
                `INSERT INTO transactions (id, user_id, user_name, plan_id, amount, method, status, date, receipt_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [t.id, t.userId, t.userName, t.planId, t.amount, t.method, t.status, t.date, t.receiptUrl]
            );
            return { statusCode: 201, headers, body: JSON.stringify(t) };
        }

        if (method === 'PUT') {
            const { id, status } = JSON.parse(event.body);
            await client.query('UPDATE transactions SET status = $1 WHERE id = $2', [status, id]);
            return { statusCode: 200, headers, body: JSON.stringify({ id, status }) };
        }
    }

    // --- BLOG ---
    if (path === '/blog' || path === '/blog/') {
        if (method === 'GET') {
            const res = await client.query('SELECT * FROM blog_posts ORDER BY date DESC');
            const posts = res.rows.map((b: any) => ({
                ...b,
                imageUrl: b.image_url
            }));
            return { statusCode: 200, headers, body: JSON.stringify(posts) };
        }
        
        if (method === 'POST') {
            const b = JSON.parse(event.body);
            await client.query(
                `INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, tier)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [b.id, b.title, b.excerpt, b.content, b.author, b.date, b.imageUrl, b.tier]
            );
            return { statusCode: 201, headers, body: JSON.stringify(b) };
        }
        
        if (method === 'DELETE') {
            const id = event.queryStringParameters?.id;
            await client.query('DELETE FROM blog_posts WHERE id = $1', [id]);
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
        }
    }

    return { statusCode: 404, headers, body: JSON.stringify({ message: 'Route not found: ' + path }) };

  } catch (error: any) {
    console.error('API Error:', error);
    return { 
        statusCode: 500, 
        headers,
        body: JSON.stringify({ 
            message: 'Internal Server Error', 
            details: error.message 
        }) 
    };
  } finally {
    if (client) await client.end();
  }
};