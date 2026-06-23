const { WebSocketServer } = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { notify } = require('../services/notificationService');

// Mapa: solicitacaoId -> Set de { ws, pessoaId }
const salas = new Map();

function initChatWs(server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (req, socket, head) => {
        const parsed = url.parse(req.url, true);

        const match = parsed.pathname.match(/^\/chat\/(\d+)$/);
        if (!match) {
            socket.destroy();
            return;
        }

        const solicitacaoId = parseInt(match[1], 10);
        const token = parsed.query.token;

        if (!token) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        let pessoaId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            pessoaId = decoded.sub;
        } catch {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        try {
            const bloqueadoRes = await pool.query(
                'SELECT bloqueado FROM pessoa WHERE id = $1',
                [pessoaId]
            );
            if (bloqueadoRes.rowCount === 0 || bloqueadoRes.rows[0].bloqueado) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }

            const solicitacaoRes = await pool.query(
                `SELECT s.solicitante_pessoa_id, i.pessoa_id AS doador_id
                 FROM solicitacao s
                 JOIN item i ON i.id = s.item_id
                 WHERE s.id = $1`,
                [solicitacaoId]
            );

            if (solicitacaoRes.rowCount === 0) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                socket.destroy();
                return;
            }

            const { solicitante_pessoa_id, doador_id } = solicitacaoRes.rows[0];

            if (Number(pessoaId) !== Number(solicitante_pessoa_id) && Number(pessoaId) !== Number(doador_id)) {
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                wss.emit('connection', ws, req, {
                    solicitacaoId,
                    pessoaId,
                    solicitantePessoaId: solicitante_pessoa_id,
                    doadorId: doador_id,
                });
            });
        } catch (err) {
            console.error('[ChatWS] Erro na autenticação do upgrade:', err.message);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
        }
    });

    wss.on('connection', (ws, _req, { solicitacaoId, pessoaId, solicitantePessoaId, doadorId }) => {
        if (!salas.has(solicitacaoId)) {
            salas.set(solicitacaoId, new Set());
        }
        const sala = salas.get(solicitacaoId);
        const cliente = { ws, pessoaId };
        sala.add(cliente);

        ws.on('message', async (data) => {
            let conteudo;
            try {
                const msg = JSON.parse(data);
                conteudo = msg.conteudo;
                if (!conteudo || typeof conteudo !== 'string' || !conteudo.trim()) return;
            } catch {
                return;
            }

            try {
                const res = await pool.query(
                    `INSERT INTO mensagens_chat (solicitacao_id, remetente_id, conteudo)
                     VALUES ($1, $2, $3)
                     RETURNING id, remetente_id, conteudo, criado_em`,
                    [solicitacaoId, pessoaId, conteudo.trim()]
                );

                const mensagem = JSON.stringify(res.rows[0]);

                for (const c of sala) {
                    if (c.ws.readyState === c.ws.OPEN) {
                        c.ws.send(mensagem);
                    }
                }

                // ── Notifica o destinatário, mesmo que ele não esteja na sala ──
                const destinatarioId =
                    Number(pessoaId) === Number(solicitantePessoaId) ? doadorId : solicitantePessoaId;

                // Só cria notificação se o destinatário não estiver com o chat aberto agora
                const destinatarioConectado = [...sala].some(
                    (c) => Number(c.pessoaId) === Number(destinatarioId) && c.ws.readyState === c.ws.OPEN
                );

                if (!destinatarioConectado) {
                    notificarNovaMensagem({
                        destinatarioId,
                        remetenteId: pessoaId,
                        solicitacaoId,
                        conteudo: conteudo.trim(),
                    });
                }
            } catch (err) {
                console.error('[ChatWS] Erro ao salvar mensagem:', err.message);
            }
        });

        ws.on('close', () => {
            sala.delete(cliente);
            if (sala.size === 0) {
                salas.delete(solicitacaoId);
            }
        });
    });
}

async function notificarNovaMensagem({ destinatarioId, remetenteId, solicitacaoId, conteudo }) {
    try {
        const infoRes = await pool.query(
            `SELECT p.nome AS remetente_nome, i.titulo AS item_titulo
             FROM solicitacao s
             JOIN item i ON i.id = s.item_id
             JOIN pessoa p ON p.id = $2
             WHERE s.id = $1`,
            [solicitacaoId, remetenteId]
        );

        if (infoRes.rowCount === 0) return;

        const { remetente_nome, item_titulo } = infoRes.rows[0];
        const mensagem = `${remetente_nome}: ${conteudo}`;

        await notify(destinatarioId, 'nova_mensagem', mensagem, {
            solicitacao_id: solicitacaoId,
            remetente_id: remetenteId,
            usuario_nome: remetente_nome,
            item_titulo,
        });
    } catch (err) {
        console.error('[ChatWS] Erro ao notificar nova mensagem:', err.message);
    }
}

module.exports = { initChatWs };