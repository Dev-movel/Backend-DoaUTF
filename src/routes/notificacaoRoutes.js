const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const notificacaoController = require('../controllers/notificacaoController');

router.get('/', authMiddleware, notificacaoController.listarNotificacoes);
router.get('/nao-lidas/count', authMiddleware, notificacaoController.contarNaoLidas);
router.patch('/lidas', authMiddleware, notificacaoController.marcarTodasComoLidas);
router.patch('/:id/lida', authMiddleware, notificacaoController.marcarComoLida);

module.exports = router;
