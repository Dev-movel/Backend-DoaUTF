const pool = require('../config/db');
const { getSaldo, adjustPoints } = require('../services/pontosService');
const { sendResgateCodigo } = require('../config/mailer');

const PREMIOS = [
    { id: 1,  nome: 'Post-it Doai',       custo: 50   },
    { id: 2,  nome: 'Caneta Doai',        custo: 100  },
    { id: 3,  nome: 'Botton Doai',        custo: 150  },
    { id: 4,  nome: 'Caderno Doai',       custo: 200  },
    { id: 5,  nome: 'Copo Doai',          custo: 300  },
    { id: 6,  nome: 'Ecobag Doai',        custo: 400  },
    { id: 7,  nome: 'Caneca Doai',        custo: 500  },
    { id: 8,  nome: 'Guarda-chuva Doai',  custo: 700  },
    { id: 9,  nome: 'Camiseta UTF/Doai',  custo: 1000 },
    { id: 10, nome: 'Notebook',           custo: 2500 },
];

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

async function gerarCodigoUnico(client) {
    for (let tentativa = 0; tentativa < 10; tentativa++) {
        const sufixo = Array.from({ length: 5 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
        const codigo = `DOA-${sufixo}`;
        const r = await client.query('SELECT 1 FROM resgates WHERE codigo = $1', [codigo]);
        if (r.rowCount === 0) return codigo;
    }
    throw new Error('Não foi possível gerar um código único após 10 tentativas.');
}

const getSaldoHandler = async (req, res) => {
    const usuarioId = req.user.sub;
    try {
        const saldo = await getSaldo(usuarioId);
        return res.status(200).json({ saldo });
    } catch (error) {
        console.error('Erro em getSaldo:', error);
        return res.status(500).json({ erro: 'Erro ao buscar saldo.' });
    }
};

const resgatarPremio = async (req, res) => {
    const usuarioId = req.user.sub;
    const { premio_id } = req.body;

    const premio = PREMIOS.find(p => p.id === Number(premio_id));
    if (!premio) {
        return res.status(400).json({ erro: 'Prêmio inválido.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Garante registro e bloqueia a linha para evitar condição de corrida
        await client.query(
            `INSERT INTO pontos_usuario (usuario_id, saldo) VALUES ($1, 0)
             ON CONFLICT (usuario_id) DO NOTHING`,
            [usuarioId]
        );
        const saldoRes = await client.query(
            'SELECT saldo FROM pontos_usuario WHERE usuario_id = $1 FOR UPDATE',
            [usuarioId]
        );
        const saldoAtual = saldoRes.rows[0].saldo;

        if (saldoAtual < premio.custo) {
            await client.query('ROLLBACK');
            return res.status(400).json({ erro: 'Saldo insuficiente.' });
        }

        const codigo = await gerarCodigoUnico(client);

        const novoSaldo = await adjustPoints(client, usuarioId, -premio.custo, `resgate:${premio.id}`);

        const resgateRes = await client.query(
            `INSERT INTO resgates (usuario_id, premio_id, premio_nome, pontos_gastos, codigo, status)
             VALUES ($1, $2, $3, $4, $5, 'pendente')
             RETURNING id`,
            [usuarioId, premio.id, premio.nome, premio.custo, codigo]
        );

        await client.query('COMMIT');

        // E-mail assíncrono — não trava a resposta
        pool.query('SELECT p.nome, p.email FROM pessoa p WHERE p.id = $1', [usuarioId])
            .then(r => {
                if (r.rowCount > 0) {
                    const { nome, email } = r.rows[0];
                    sendResgateCodigo(email, nome, premio.nome, codigo, premio.custo)
                        .catch(err => console.error('[mailer] Erro ao enviar e-mail de resgate:', err.message));
                }
            })
            .catch(err => console.error('[mailer] Erro ao buscar dados do usuário para e-mail:', err.message));

        console.log(`Resgate #${resgateRes.rows[0].id} — usuário ${usuarioId}, prêmio "${premio.nome}", código ${codigo}`);

        return res.status(201).json({
            codigo,
            premio_nome: premio.nome,
            pontos_gastos: premio.custo,
            saldo_restante: novoSaldo,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro em resgatarPremio:', error);
        return res.status(500).json({ erro: 'Erro ao processar resgate.' });
    } finally {
        client.release();
    }
};

const listarResgates = async (req, res) => {
    const usuarioId = req.user.sub;
    try {
        const result = await pool.query(
            `SELECT id, premio_id, premio_nome, pontos_gastos, codigo, status, criado_em
             FROM resgates
             WHERE usuario_id = $1
             ORDER BY criado_em DESC`,
            [usuarioId]
        );
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro em listarResgates:', error);
        return res.status(500).json({ erro: 'Erro ao listar resgates.' });
    }
};

const listarPremios = async (req, res) => {
    return res.status(200).json(PREMIOS);
};

module.exports = { getSaldoHandler, resgatarPremio, listarResgates, listarPremios };
