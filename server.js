require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection Helper
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

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Analysis Proxy
app.post('/api/analyze', async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(503).json({ message: 'Server API configuration missing' });
    }

    const { prediction } = req.body;
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

    res.json({ analysis: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ message: 'AI Analysis failed' });
  }
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  let client;
  try {
    client = await getDbClient();
    const { email, password } = req.body;
    const result = await client.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    // Map snake_case DB columns to camelCase frontend types
    const formattedUser = {
      ...user,
      phoneNumber: user.phone_number,
      joinDate: user.join_date,
      subscriptionExpiryDate: user.subscription_expiry_date
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (client) await client.end();
  }
});

app.post('/api/auth/register', async (req, res) => {
  let client;
  try {
    client = await getDbClient();
    const { id, name, email, phoneNumber, password, subscription, role, joinDate } = req.body;
    
    await client.query(
      `INSERT INTO users (id, name, email, phone_number, password, subscription, role, join_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, name, email, phoneNumber, password, subscription, role, joinDate]
    );
    
    res.status(201).json(req.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed', details: error.message });
  } finally {
    if (client) await client.end();
  }
});

// Prediction Routes
app.route('/api/predictions')
  .get(async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM predictions ORDER BY date DESC');
      const predictions = result.rows.map(p => ({
        ...p,
        homeTeam: p.home_team,
        awayTeam: p.away_team,
        minTier: p.min_tier,
        tipsterId: p.tipster_id
      }));
      res.json(predictions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch predictions' });
    } finally {
      if (client) await client.end();
    }
  })
  .post(async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const p = req.body;
      await client.query(
        `INSERT INTO predictions (id, league, home_team, away_team, date, time, tip, odds, confidence, min_tier, status, result, tipster_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [p.id, p.league, p.homeTeam, p.awayTeam, p.date, p.time, p.tip, p.odds, p.confidence, p.minTier, p.status, p.result, p.tipsterId]
      );
      res.status(201).json(p);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create prediction' });
    } finally {
      if (client) await client.end();
    }
  })
  .put(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const p = req.body;
        await client.query(
            `UPDATE predictions SET status = $1, result = $2 WHERE id = $3`,
            [p.status, p.result, p.id]
        );
        res.json(p);
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update prediction'});
    } finally {
        if (client) await client.end();
    }
  })
  .delete(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const { id } = req.query;
        await client.query('DELETE FROM predictions WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete' });
    } finally {
        if(client) await client.end();
    }
  });

// User Routes
app.route('/api/users')
  .get(async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM users');
      const users = result.rows.map(user => ({
        ...user,
        phoneNumber: user.phone_number,
        joinDate: user.join_date,
        subscriptionExpiryDate: user.subscription_expiry_date
      }));
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch users' });
    } finally {
      if (client) await client.end();
    }
  })
  .put(async (req, res) => {
      let client;
      try {
          client = await getDbClient();
          const u = req.body;
          await client.query(
              `UPDATE users SET subscription = $1, subscription_expiry_date = $2 WHERE id = $3`,
              [u.subscription, u.subscriptionExpiryDate, u.id]
          );
          res.json(u);
      } catch(error) {
          console.error(error);
          res.status(500).json({ message: 'Update failed'});
      } finally {
          if (client) await client.end();
      }
  });

// Transaction Routes
app.route('/api/transactions')
  .get(async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM transactions ORDER BY date DESC');
      const txs = result.rows.map(t => ({
        ...t,
        userId: t.user_id,
        userName: t.user_name,
        planId: t.plan_id,
        receiptUrl: t.receipt_url
      }));
      res.json(txs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    } finally {
      if (client) await client.end();
    }
  })
  .post(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const t = req.body;
        await client.query(
            `INSERT INTO transactions (id, user_id, user_name, plan_id, amount, method, status, date, receipt_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [t.id, t.userId, t.userName, t.planId, t.amount, t.method, t.status, t.date, t.receiptUrl]
        );
        res.status(201).json(t);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Transaction failed'});
    } finally {
        if(client) await client.end();
    }
  })
  .put(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const { id, status } = req.body;
        await client.query('UPDATE transactions SET status = $1 WHERE id = $2', [status, id]);
        res.json({ id, status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Update failed'});
    } finally {
        if(client) await client.end();
    }
  });

// Blog Routes
app.route('/api/blog')
  .get(async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM blog_posts ORDER BY date DESC');
      const posts = result.rows.map(b => ({
        ...b,
        imageUrl: b.image_url
      }));
      res.json(posts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch blog posts' });
    } finally {
      if (client) await client.end();
    }
  })
  .post(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const b = req.body;
        await client.query(
            `INSERT INTO blog_posts (id, title, excerpt, content, author, date, image_url, tier)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [b.id, b.title, b.excerpt, b.content, b.author, b.date, b.imageUrl, b.tier]
        );
        res.status(201).json(b);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Post failed'});
    } finally {
        if(client) await client.end();
    }
  })
  .delete(async (req, res) => {
    let client;
    try {
        client = await getDbClient();
        const { id } = req.query;
        await client.query('DELETE FROM blog_posts WHERE id = $1', [id]);
        res.json({ message: 'Deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Delete failed'});
    } finally {
        if(client) await client.end();
    }
  });

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
