const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido ou inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    const userId = decoded.sub; 
    
    const { rows } = await pool.query(
      'SELECT bloqueado FROM pessoa WHERE id = $1',
      [userId]
    );
    if (rows.length === 0 || rows[0].bloqueado === true) {
      return res.status(403).json({ 
        erro: 'Sua conta foi bloqueada pelo administrador. Acesso negado.' 
      });
    }
    next();

  } catch (error) {
    console.error('Erro no authMiddleware:', error.message);
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};

module.exports = authMiddleware;