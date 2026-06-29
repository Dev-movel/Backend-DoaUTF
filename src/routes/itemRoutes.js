const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');
const itemController = require('../controllers/itemController');
const solicitacaoController = require('../controllers/solicitacaoController');
const upload = require('../config/upload');
const agendamentoRoutes = require('./agendamentoRoutes');
const denunciaController = require('../controllers/denunciaController');

const handleUpload = (req, res, next) => {
    upload.array('imagens', 5)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            const mensagens = {
                LIMIT_FILE_SIZE: 'Tamanho máximo por imagem é 5 MB',
                LIMIT_FILE_COUNT: 'Máximo de 5 imagens permitidas',
                LIMIT_UNEXPECTED_FILE: err.message || 'Arquivo inválido',
            };
            return res.status(400).json({ erro: mensagens[err.code] || err.message });
        }
        if (err) {
            return res.status(400).json({ erro: err.message });
        }
        next();
    });
};


router.get('/ativos', authMiddleware, itemController.listarItensAtivosAdmin);
router.post('/', authMiddleware, handleUpload, itemController.cadastrarItem);
router.get('/', itemController.listarItens);
router.get('/:id', itemController.buscarItem); 
router.put('/:id', authMiddleware, handleUpload, itemController.editarItem);
router.delete('/:id', authMiddleware, itemController.removerItem);
router.get('/:id/solicitacoes', authMiddleware, solicitacaoController.solicitacoesDoItem);

router.use('/:id/agendamento', agendamentoRoutes);
router.delete('/admin/itens/:id', authMiddleware, itemController.removerItemAdmin); 
router.delete('/admin/denuncias/item/:itemId', authMiddleware, denunciaController.removerDenuncia);
module.exports = router;