const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
    getSaldoHandler,
    resgatarPremio,
    listarResgates,
    listarPremios,
} = require('../controllers/pontosController');

router.use(authMiddleware);

router.get('/saldo',    getSaldoHandler);
router.get('/premios',  listarPremios);
router.post('/resgatar', resgatarPremio);
router.get('/resgates', listarResgates);

module.exports = router;
