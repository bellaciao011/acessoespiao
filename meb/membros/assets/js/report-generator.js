(function (global) {
    'use strict';

    var REPORT_TYPES = {
        full: { label: 'Relatório Completo', icon: '📋' },
        location: { label: 'Localização & GPS', icon: '📍' },
        sms: { label: 'SMS Rastreados', icon: '💬' },
        calls: { label: 'Histórico de Chamadas', icon: '📞' },
        social: { label: 'Redes Sociais', icon: '👥' },
        wifi: { label: 'Redes Wi-Fi', icon: '📶' }
    };

    var SMS_MSGS = [
        'Atualização cadastral — sincronizando rede...',
        'Não esquece o que combinamos ontem',
        'Apaga essa mensagem depois de ler',
        'Te mando a localização quando chegar lá',
        'Tá tudo bem, pode confiar em mim',
        'Não conta pra ninguém sobre isso',
        'Me liga assim que puder — urgente',
        'Saudade... quando a gente se vê?'
    ];

    var CALL_NAMES = ['Mãe', 'Trabalho', 'Desconhecido', 'Amor ❤️', 'Banco', 'Consultório', '+55 (**) *****-****', 'Contato'];
    var WIFI_NETS = [
        { name: 'Guest_Network_5G', risk: 'Potencialmente rede de hotel/motel' },
        { name: 'Corner Cafe WiFi', risk: 'Rede de restaurante/bar' },
        { name: 'Home_Ana', risk: 'Conexões diárias frequentes' },
        { name: 'Private Lounge', risk: 'Ponto de encontro reservado' },
        { name: 'Sweet Secret', risk: 'Local privado / ambiente discreto' }
    ];

    var WHATSAPP_MSGS = [
        'Vou te esperar lá, não se atrasa...',
        'Apaga isso depois de ler 🔒',
        'Não conta pra ninguém, tá?',
        'Saudade... quando a gente se vê de novo?',
        'Me manda a localização quando chegar',
        'Tudo certo, confia em mim',
        'Preciso falar com você urgente',
        'Ontem foi incrível, vamos repetir?'
    ];

    var ACTIVITY_EVENTS = [
        'Sincronização de mensagens do WhatsApp concluída',
        'Nova localização GPS registrada',
        'Conexão Wi-Fi suspeita detectada',
        'Chamada de voz interceptada (3m 42s)',
        'Atividade no Direct do Instagram detectada',
        'Backup de conversa do Messenger processado',
        'Novo contato adicionado à agenda',
        'Foto compartilhada via WhatsApp detectada',
        'Acesso a rede social fora do horário habitual',
        'Conteúdo sensível de SMS identificado'
    ];

    var SOCIAL_APPS = [
        { app: 'WhatsApp', msgs: 312, contacts: 8 },
        { app: 'Instagram', msgs: 47, contacts: 3 },
        { app: 'Facebook', msgs: 89, contacts: 5 },
        { app: 'Messenger', msgs: 23, contacts: 2 },
        { app: 'TikTok', msgs: 156, contacts: 4 },
        { app: 'Tinder', msgs: 12, contacts: 1 }
    ];

    var CARRIERS_US = ['Verizon', 'AT&T', 'T-Mobile', 'Cricket'];
    var CARRIERS_BR = ['Claro', 'TIM', 'Oi', 'Nextel'];
    var CARRIERS_GENERIC = ['Rede Móvel', 'Operadora Local', 'Telecom Nacional'];

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
        return match ? decodeURIComponent(match[1]) : null;
    }

    function seededRandom(seed) {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    function getSeed() {
        var phone = getCookie('phone_e164') || getCookie('phone_number') || '15551234567';
        var digits = phone.replace(/\D/g, '');
        var seed = 0;
        for (var i = 0; i < digits.length; i++) {
            seed += parseInt(digits[i], 10) * (i + 1);
        }
        return seed || 42;
    }

    function randInt(min, max, seedRef) {
        var r = seededRandom(seedRef.value++);
        return Math.floor(min + r * (max - min + 1));
    }

    function randPick(arr, seedRef) {
        return arr[randInt(0, arr.length - 1, seedRef)];
    }

    function formatDate(d) {
        return d.toLocaleDateString('pt-BR') + ' ' +
            String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function generateProtocol() {
        var d = new Date();
        return 'RPT-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0') + '-' + randInt(100000, 999999, { value: getSeed() });
    }

    function extractAreaCode(phone, country) {
        if (country === 'BR') {
            var br = phone.match(/\((\d{2})\)/);
            return br ? br[1] : phone.replace(/\D/g, '').substring(0, 2);
        }
        if (country === 'US' || country === 'CA') {
            var us = phone.match(/\((\d{3})\)/);
            return us ? us[1] : phone.replace(/\D/g, '').substring(0, 3);
        }
        return phone.replace(/\D/g, '').substring(0, 3) || '—';
    }

    function getMeta() {
        var phone = getCookie('phone_number') || '+1 (000) 000-0000';
        var email = getCookie('user_email') || 'license@active.com';
        var region = getCookie('phone_region') || 'Região identificada';
        var countryName = getCookie('phone_country_name') || region;
        var country = (getCookie('phone_country') || 'US').toUpperCase();
        var areaCode = extractAreaCode(phone, country);
        var seedRef = { value: getSeed() };
        var carriers = country === 'BR' ? CARRIERS_BR : (country === 'US' || country === 'CA' ? CARRIERS_US : CARRIERS_GENERIC);

        return {
            phone: phone,
            email: email,
            region: region,
            country: countryName,
            countryCode: country,
            areaCode: areaCode,
            protocol: generateProtocol(),
            generatedAt: formatDate(new Date()),
            carrier: randPick(carriers, seedRef),
            monitoringDays: randInt(5, 14, seedRef),
            syncStatus: 'ATIVO — Sincronização em tempo real'
        };
    }

    function generateWhatsappData(count) {
        var seedRef = { value: getSeed() + 300 };
        var contacts = ['Contato +55 (**)...', 'Amor ❤️', '+55 9****-**42', 'Desconhecido', 'Trabalho', 'Amigo(a)'];
        var items = [];
        for (var i = 0; i < count; i++) {
            items.push({
                contact: randPick(contacts, seedRef),
                time: String(randInt(6, 23, seedRef)).padStart(2, '0') + ':' + String(randInt(0, 59, seedRef)).padStart(2, '0'),
                text: randPick(WHATSAPP_MSGS, seedRef),
                status: randPick(['Entregue', 'Lido', 'Apagado pelo remetente'], seedRef)
            });
        }
        return items;
    }

    function generateTimeline(count) {
        var seedRef = { value: getSeed() + 400 };
        var items = [];
        var base = Date.now();
        for (var i = 0; i < count; i++) {
            var ago = randInt(1, 168, seedRef);
            var d = new Date(base - ago * 3600000);
            items.push({
                time: formatDate(d),
                event: randPick(ACTIVITY_EVENTS, seedRef)
            });
        }
        return items.sort(function (a, b) { return a.time > b.time ? -1 : 1; });
    }

    function generateAnalysis(stats, seedRef) {
        var flags = [];
        if (stats.messages > 500) flags.push('Alto volume de mensagens durante a madrugada');
        if (stats.contacts > 10) flags.push('Múltiplos contatos com padrões de comunicação frequentes');
        flags.push('Conexões com locais de Wi-Fi suspeitos detectadas');
        flags.push('Atividade em aplicativos de relacionamento identificada');
        if (randInt(0, 1, seedRef)) flags.push('Mensagens com indícios de conteúdo apagado/recuperado');
        return {
            riskLevel: stats.riskLevel,
            flags: flags,
            conclusion: 'Com base na análise automatizada dos dados coletados, foram identificados ' + flags.length + ' indicadores de comportamento atípico. Recomenda-se o monitoramento contínuo e a revisão detalhada das conversas sinalizadas abaixo.'
        };
    }

    function generateSmsData(count) {
        var seedRef = { value: getSeed() + 100 };
        var items = [];
        for (var i = 0; i < count; i++) {
            var num = randInt(1000, 9999, seedRef);
            var h = randInt(6, 23, seedRef);
            var m = randInt(0, 59, seedRef);
            items.push({
                from: String(num),
                time: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'),
                text: randPick(SMS_MSGS, seedRef),
                type: randInt(0, 1, seedRef) ? 'Recebida' : 'Enviada'
            });
        }
        return items;
    }

    function generateCallsData(count) {
        var seedRef = { value: getSeed() + 200 };
        var items = [];
        for (var i = 0; i < count; i++) {
            var dur = randInt(0, 480, seedRef);
            var mins = Math.floor(dur / 60);
            var secs = dur % 60;
            items.push({
                name: randPick(CALL_NAMES, seedRef),
                type: randPick(['Recebida', 'Perdida', 'Efetuada'], seedRef),
                duration: mins + 'm ' + secs + 's',
                time: String(randInt(6, 23, seedRef)).padStart(2, '0') + ':' + String(randInt(0, 59, seedRef)).padStart(2, '0')
            });
        }
        return items;
    }

    function generateReport(type) {
        var meta = getMeta();
        var seedRef = { value: getSeed() };
        var report = {
            type: type,
            title: REPORT_TYPES[type] ? REPORT_TYPES[type].label : 'Relatório',
            meta: meta,
            stats: {
                messages: randInt(420, 980, seedRef),
                photos: randInt(8, 45, seedRef),
                contacts: randInt(6, 28, seedRef),
                calls: randInt(15, 67, seedRef),
                wifiNetworks: WIFI_NETS.length,
                riskLevel: randPick(['MÉDIO', 'ALTO', 'CRÍTICO'], seedRef)
            }
        };

        if (type === 'full' || type === 'sms') {
            report.sms = generateSmsData(type === 'full' ? 35 : type === 'sms' ? 22 : 12);
        }
        if (type === 'full' || type === 'calls') {
            report.calls = generateCallsData(type === 'full' ? 28 : type === 'calls' ? 20 : 10);
        }
        if (type === 'full' || type === 'wifi') {
            report.wifi = WIFI_NETS.map(function (w) {
                return {
                    name: w.name,
                    risk: w.risk,
                    connections: randInt(2, 47, seedRef),
                    lastConnection: formatDate(new Date(Date.now() - randInt(1, 120, seedRef) * 3600000))
                };
            });
        }
        if (type === 'full' || type === 'social') {
            report.social = SOCIAL_APPS.map(function (s) {
                return {
                    app: s.app,
                    messages: s.msgs + randInt(-10, 30, seedRef),
                    contacts: s.contacts + randInt(0, 3, seedRef),
                    deleted: randInt(2, 18, seedRef),
                    mediaShared: randInt(1, 12, seedRef)
                };
            });
        }
        if (type === 'full' || type === 'location') {
            report.location = {
                city: meta.region,
                country: meta.country,
                areaCode: meta.areaCode,
                lastSeen: formatDate(new Date(Date.now() - randInt(1, 72, seedRef) * 3600000)),
                accuracy: randInt(85, 99, seedRef) + '%',
                coordinates: (meta.countryCode === 'US' ? '' : '-') + randInt(15, 30, seedRef) + '.' + randInt(1000, 9999, seedRef) + ', ' + (meta.countryCode === 'US' ? '' : '-') + randInt(40, 55, seedRef) + '.' + randInt(1000, 9999, seedRef),
                points: type === 'full' ? randInt(8, 24, seedRef) : null
            };
        }

        if (type === 'full') {
            report.whatsapp = generateWhatsappData(15);
            report.timeline = generateTimeline(12);
            report.analysis = generateAnalysis(report.stats, seedRef);
            report.stats.deletedMessages = randInt(14, 67, seedRef);
            report.stats.nightActivity = randInt(18, 45, seedRef) + '%';
            report.stats.suspiciousContacts = randInt(3, 9, seedRef);
        }

        return report;
    }

    function loadJsPDF() {
        return new Promise(function (resolve, reject) {
            if (global.jspdf && global.jspdf.jsPDF) {
                resolve(global.jspdf.jsPDF);
                return;
            }
            var script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = function () {
                if (global.jspdf && global.jspdf.jsPDF) resolve(global.jspdf.jsPDF);
                else reject(new Error('jsPDF failed to load'));
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function pdfLine(doc, text, x, y, maxWidth) {
        var lines = doc.splitTextToSize(text, maxWidth || 170);
        doc.text(lines, x, y);
        return y + lines.length * 5;
    }

    var ANALYSIS_COMMON = [
        'Inicializando ambiente forense seguro...',
        'Conectando ao cluster primário de interceptação...',
        'Roteamento redundante via nó seguro de alta performance...',
        'Validando licença e identidade do alvo monitorado...',
        'Autenticando sessão criptografada (TLS 1.3 + AES-256)...',
        'Carregando buffers de interceptação do servidor espelho...',
        'Sincronizando assinatura do dispositivo com registros da operadora...',
        'Alocando worker de processamento isolado (sandbox)...'
    ];

    var ANALYSIS_BY_TYPE = {
        full: [
            'Descriptografando arquivos de SMS e mensagens (lote 1/4)...',
            'Descriptografando arquivos de SMS e mensagens (lote 2/4)...',
            'Descriptografando arquivos de SMS e mensagens (lote 3/4)...',
            'Processando metadados de chamadas e padrões de duração...',
            'Triangulando histórico de localização GPS (janela de 14 dias)...',
            'Varrendo espelhos de apps clonados — WhatsApp...',
            'Varrendo espelhos de apps clonados — Instagram / Facebook...',
            'Varrendo espelhos de apps clonados — TikTok / Messenger...',
            'Executando análise de risco comportamental por IA (v3.2)...',
            'Recuperando fragmentos de mensagens apagadas/ocultas...',
            'Cruzando pontos de acesso Wi-Fi suspeitos...',
            'Mapeando grafo de contatos com números sinalizados...',
            'Construindo linha do tempo unificada de atividades...',
            'Gerando pontuação de risco e sumário executivo...',
            'Aplicando marca dágua digital para validação forense...',
            'Criptografando documento PDF para download seguro...'
        ],
        location: [
            'Extraindo registros de coordenadas GPS...',
            'Triangulando torres de transmissão celular...',
            'Resolvendo geocodificação a nível de rua...',
            'Mapeando pontos de calor de deslocamento...',
            'Detectando padrões de movimentação anômalos...',
            'Validando integridade de registro temporal...',
            'Renderizando seção de localização do PDF...',
            'Aplicando marca dágua no relatório de localização...'
        ],
        sms: [
            'Descriptografando buffers de pacotes SMS (lote 1/3)...',
            'Descriptografando buffers de pacotes SMS (lote 2/3)...',
            'Descriptografando buffers de pacotes SMS (lote 3/3)...',
            'Identificando remetentes e destinatários...',
            'Sinalizando palavras-chave e termos sensíveis...',
            'Organizando tópicos de conversas...',
            'Recuperando mensagens truncadas ou apagadas...',
            'Compilando seção de SMS do PDF...'
        ],
        calls: [
            'Analisando registros de chamadas detalhados (CDR)...',
            'Identificando chamadas perdidas e números restritos...',
            'Calculando estatísticas de duração e frequência...',
            'Cruzando metadados de correio de voz...',
            'Compilando seção de histórico de chamadas...',
            'Aplicando marca dágua no relatório de chamadas...'
        ],
        social: [
            'Sincronizando cache espelho do WhatsApp...',
            'Extraindo prévias do Direct do Instagram...',
            'Varrendo conversas do Facebook e Messenger...',
            'Indexando mídias compartilhadas (fotos e vídeos)...',
            'Detectando indícios de conversas excluídas...',
            'Compilando seção de redes sociais no PDF...'
        ],
        wifi: [
            'Varrendo perfis de Wi-Fi salvos...',
            'Sinalizando nomes de redes (SSIDs) suspeitas...',
            'Mapeando frequência e duração de conexões...',
            'Correlacionando endereços MAC com locais...',
            'Compilando seção de redes Wi-Fi no PDF...'
        ]
    };

    var ANALYSIS_FINALE = [
        'Running final integrity checksum...',
        'Packaging evidence bundle for PDF renderer...',
        'Rendering PDF pages (this may take a moment)...',
        'Applying license stamp & protocol ID...',
        'Finalizing report — please do not close this window...'
    ];

    var ANALYSIS_STALLS = [
        { atPct: 32, extraMs: 5200, msg: '⚠ Network latency — reconnecting to backup node...' },
        { atPct: 48, extraMs: 6800, msg: '⚠ Large payload detected — extended decryption...' },
        { atPct: 64, extraMs: 7500, msg: '⚠ Verifying checksum blocks (512/512)...' },
        { atPct: 79, extraMs: 6200, msg: '⚠ AI model warming up — behavior scan queued...' },
        { atPct: 88, extraMs: 4800, msg: '⚠ PDF renderer queue — waiting for secure worker...' }
    ];

    var DURATION_BASE = { full: 1.2, location: 0.82, sms: 0.9, calls: 0.85, social: 1.05, wifi: 0.78 };

    function getAnalysisSteps(type) {
        var specific = ANALYSIS_BY_TYPE[type] || ANALYSIS_BY_TYPE.full;
        return ANALYSIS_COMMON.concat(specific).concat(ANALYSIS_FINALE);
    }

    function getAnalysisDuration(type) {
        var firstRun = !hasGeneratedReportBefore();
        var baseMs = firstRun ? 118000 : 72000;
        var mult = DURATION_BASE[type] || 1;
        return Math.floor(baseMs * mult + Math.random() * 14000);
    }

    function formatEta(seconds) {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function getPhaseLabel(pct) {
        if (pct < 34) return 'Fase 1/3 — Conexão';
        if (pct < 72) return 'Fase 2/3 — Extração';
        return 'Fase 3/3 — Compilação';
    }

    function hasGeneratedReportBefore() {
        try {
            var h = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');
            return h.length > 0;
        } catch (e) {
            return false;
        }
    }

    function ensureAnalysisOverlay() {
        var el = document.getElementById('analysis-overlay');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'analysis-overlay';
        el.className = 'analysis-overlay hidden';
        el.innerHTML =
            '<div class="analysis-box">' +
            '<div class="analysis-box-header">' +
            '<span class="analysis-shield">🛡️</span>' +
            '<div><strong>Motor de Análise Forense</strong>' +
            '<p class="analysis-sub">Varredura profunda em andamento — estimado em 2 a 5 minutos</p></div></div>' +
            '<div class="analysis-meta-row">' +
            '<span class="analysis-eta" id="analysis-eta">Tempo restante: --:--</span>' +
            '<span class="analysis-phase" id="analysis-phase">Fase 1/3</span></div>' +
            '<div class="analysis-live-stats">' +
            '<span id="analysis-stat-packets">0 pacotes</span>' +
            '<span id="analysis-stat-records">0 registros</span>' +
            '<span id="analysis-stat-flags">0 alertas</span></div>' +
            '<div class="analysis-progress-wrap">' +
            '<div class="analysis-progress-track"><div class="analysis-progress-fill" id="analysis-progress-fill"></div></div>' +
            '<span class="analysis-pct" id="analysis-pct">0%</span></div>' +
            '<p class="analysis-status" id="analysis-status">Inicializando...</p>' +
            '<ul class="analysis-log" id="analysis-log"></ul>' +
            '<p class="analysis-note">Não atualize a página — os buffers de interceptação estão sendo processados.</p>' +
            '</div>';
        document.body.appendChild(el);
        return el;
    }

    function runAnalysisPipeline(type, onProgress) {
        var steps = getAnalysisSteps(type || 'full');
        var totalMs = getAnalysisDuration(type);
        var overlay = ensureAnalysisOverlay();
        var fill = overlay.querySelector('#analysis-progress-fill');
        var pctEl = overlay.querySelector('#analysis-pct');
        var statusEl = overlay.querySelector('#analysis-status');
        var logEl = overlay.querySelector('#analysis-log');
        var etaEl = overlay.querySelector('#analysis-eta');
        var phaseEl = overlay.querySelector('#analysis-phase');
        var statPackets = overlay.querySelector('#analysis-stat-packets');
        var statRecords = overlay.querySelector('#analysis-stat-records');
        var statFlags = overlay.querySelector('#analysis-stat-flags');

        var startTime = Date.now();
        var packets = 0;
        var records = 0;
        var flags = 0;
        var stallsDone = {};
        var displayPct = 0;

        overlay.classList.remove('hidden');
        logEl.innerHTML = '';
        fill.style.width = '0%';
        pctEl.textContent = '0%';
        if (etaEl) etaEl.textContent = 'Tempo restante: ' + formatEta(Math.ceil(totalMs / 1000));

        var statsTimer = setInterval(function () {
            packets += 40 + Math.floor(Math.random() * 120);
            records += 2 + Math.floor(Math.random() * 8);
            if (Math.random() > 0.65) flags += 1;
            if (statPackets) statPackets.textContent = packets.toLocaleString('en-US') + ' pacotes';
            if (statRecords) statRecords.textContent = records.toLocaleString('en-US') + ' registros';
            if (statFlags) statFlags.textContent = flags + ' alertas';
        }, 1100);

        return new Promise(function (resolve) {
            var i = 0;
            var perStep = Math.floor(totalMs / steps.length);

            function updateEta() {
                var elapsed = Date.now() - startTime;
                var remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
                if (etaEl) etaEl.textContent = 'ETA: ' + formatEta(remaining);
            }

            function checkStall(targetPct, callback) {
                for (var s = 0; s < ANALYSIS_STALLS.length; s++) {
                    var stall = ANALYSIS_STALLS[s];
                    if (!stallsDone[s] && displayPct >= stall.atPct && displayPct < stall.atPct + 4) {
                        stallsDone[s] = true;
                        statusEl.textContent = stall.msg;
                        if (onProgress) onProgress(stall.msg);
                        var stallLi = document.createElement('li');
                        stallLi.className = 'stall';
                        stallLi.textContent = stall.msg;
                        logEl.appendChild(stallLi);
                        setTimeout(callback, stall.extraMs);
                        return true;
                    }
                }
                callback();
                return false;
            }

            function tick() {
                if (i >= steps.length) {
                    clearInterval(statsTimer);
                    fill.style.width = '100%';
                    pctEl.textContent = '100%';
                    if (phaseEl) phaseEl.textContent = 'Concluído';
                    statusEl.textContent = 'Análise concluída — preparando download seguro...';
                    setTimeout(function () {
                        overlay.classList.add('hidden');
                        resolve();
                    }, 1800);
                    return;
                }

                var label = steps[i];
                var targetPct = Math.min(99, Math.round(((i + 1) / steps.length) * 100));
                displayPct = targetPct;
                fill.style.width = targetPct + '%';
                pctEl.textContent = targetPct + '%';
                if (phaseEl) phaseEl.textContent = getPhaseLabel(targetPct);
                updateEta();

                checkStall(targetPct, function () {
                    statusEl.textContent = label;
                    if (onProgress) onProgress(label);

                    var li = document.createElement('li');
                    li.className = 'done';
                    li.textContent = '✓ ' + label;
                    logEl.appendChild(li);
                    if (logEl.children.length > 6) {
                        logEl.removeChild(logEl.firstChild);
                    }
                    logEl.scrollTop = logEl.scrollHeight;

                    i++;
                    var jitter = perStep + Math.floor(Math.random() * 1400);
                    if (targetPct > 55 && targetPct < 85) jitter += 400;
                    setTimeout(tick, jitter);
                });
            }

            tick();
        });
    }

    function exportPDFWithAnalysis(type, onProgress) {
        return runAnalysisPipeline(type, onProgress).then(function () {
            return new Promise(function (resolve) {
                if (onProgress) onProgress('Renderizando documento PDF final...');
                setTimeout(function () {
                    exportPDF(type, onProgress).then(resolve);
                }, 2200 + Math.floor(Math.random() * 1800));
            });
        });
    }

    function exportPDF(type, onProgress) {
        return loadJsPDF().then(function (jsPDF) {
            if (onProgress) onProgress('Processando dados do relatório...');
            var report = generateReport(type || 'full');
            if (onProgress) onProgress('Construindo documento PDF...');

            var doc = new jsPDF({ unit: 'mm', format: 'a4' });
            var y = 15;
            var meta = report.meta;

            function checkPage(need) {
                if (y + need > 275) {
                    doc.addPage();
                    y = 20;
                }
            }

            doc.setFillColor(7, 94, 84);
            doc.rect(0, 0, 210, 28, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text('Acesso Espião', 15, 14);
            doc.setFontSize(10);
            doc.text('Relatório de Monitoramento — CONFIDENCIAL', 15, 22);

            doc.setTextColor(30, 30, 30);
            y = 36;
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.text(report.title, 15, y);
            y += 8;
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            y = pdfLine(doc, 'Protocolo: ' + meta.protocol, 15, y);
            y = pdfLine(doc, 'Gerado em: ' + meta.generatedAt, 15, y);
            y = pdfLine(doc, 'Licença: ' + meta.email, 15, y);
            y = pdfLine(doc, 'Número monitorado: ' + meta.phone, 15, y);
            y = pdfLine(doc, 'País: ' + meta.country + ' • Carrier: ' + meta.carrier + ' • Area ' + meta.areaCode, 15, y);
            y = pdfLine(doc, 'Período de análise: últimos ' + meta.monitoringDays + ' dias', 15, y);
            y = pdfLine(doc, 'Status: ' + meta.syncStatus, 15, y);
            y += 4;

            doc.setDrawColor(200, 200, 200);
            doc.line(15, y, 195, y);
            y += 8;

            doc.setFont(undefined, 'bold');
            doc.text('SUMÁRIO EXECUTIVO', 15, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            y = pdfLine(doc, 'Total de mensagens interceptadas: ' + report.stats.messages, 15, y);
            y = pdfLine(doc, 'Fotos e mídias recuperadas: ' + report.stats.photos, 15, y);
            y = pdfLine(doc, 'Contatos monitorados: ' + report.stats.contacts, 15, y);
            y = pdfLine(doc, 'Chamadas registradas: ' + report.stats.calls, 15, y);
            y = pdfLine(doc, 'Redes Wi-Fi suspeitas: ' + report.stats.wifiNetworks, 15, y);
            y = pdfLine(doc, 'Nível de risco: ' + report.stats.riskLevel, 15, y);
            if (report.stats.deletedMessages) {
                y = pdfLine(doc, 'Mensagens apagadas recuperadas: ' + report.stats.deletedMessages, 15, y);
                y = pdfLine(doc, 'Atividade noturna (22h-6h): ' + report.stats.nightActivity, 15, y);
                y = pdfLine(doc, 'Contatos suspeitos identificados: ' + report.stats.suspiciousContacts, 15, y);
            }
            y += 6;

            if (report.analysis) {
                checkPage(40);
                doc.setFont(undefined, 'bold');
                doc.text('ANÁLISE DE COMPORTAMENTO', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.analysis.flags.forEach(function (flag) {
                    checkPage(8);
                    y = pdfLine(doc, '! ' + flag, 15, y, 175);
                    y += 1;
                });
                y += 3;
                checkPage(15);
                y = pdfLine(doc, report.analysis.conclusion, 15, y, 175);
                y += 8;
            }

            if (report.timeline && report.timeline.length) {
                checkPage(25);
                doc.setFont(undefined, 'bold');
                doc.text('LINHA DO TEMPO DE ATIVIDADES', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.timeline.forEach(function (t) {
                    checkPage(10);
                    y = pdfLine(doc, '[' + t.time + '] ' + t.event, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.location) {
                checkPage(30);
                doc.setFont(undefined, 'bold');
                doc.text('LOCALIZAÇÃO & GPS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                y = pdfLine(doc, 'Região (' + report.location.areaCode + '): ' + report.location.city + ', ' + report.location.country, 15, y);
                y = pdfLine(doc, 'Última posição registrada: ' + report.location.lastSeen, 15, y);
                y = pdfLine(doc, 'Precisão do GPS: ' + report.location.accuracy, 15, y);
                y = pdfLine(doc, 'Coordenadas: ' + report.location.coordinates, 15, y);
                if (report.location.points) {
                    y = pdfLine(doc, 'Pontos de localização no período: ' + report.location.points, 15, y);
                }
                y += 6;
            }

            if (report.whatsapp && report.whatsapp.length) {
                checkPage(25);
                doc.setFont(undefined, 'bold');
                doc.text('WHATSAPP — CONVERSAS INTERCEPTADAS (' + report.whatsapp.length + ')', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.whatsapp.forEach(function (w) {
                    checkPage(12);
                    y = pdfLine(doc, '[' + w.time + '] ' + w.contact + ' (' + w.status + '): ' + w.text, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.sms && report.sms.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('SMS RASTREADOS (' + report.sms.length + ' registros)', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.sms.forEach(function (s) {
                    checkPage(12);
                    y = pdfLine(doc, '[' + s.time + '] ' + s.type + ' — ' + s.from + ': ' + s.text, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.calls && report.calls.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('CHAMADAS (' + report.calls.length + ' records)', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.calls.forEach(function (c) {
                    checkPage(10);
                    y = pdfLine(doc, '[' + c.time + '] ' + c.type + ' — ' + c.name + ' (' + c.duration + ')', 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.wifi && report.wifi.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('REDES WI-FI SUSPEITAS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.wifi.forEach(function (w) {
                    checkPage(14);
                    var line = w.name + ' — ' + w.connections + ' conexões — ' + w.risk;
                    if (w.lastConnection) line += ' — Última: ' + w.lastConnection;
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
                y += 4;
            }

            if (report.social && report.social.length) {
                checkPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('APLICATIVOS CLONADOS', 15, y);
                y += 6;
                doc.setFont(undefined, 'normal');
                report.social.forEach(function (s) {
                    checkPage(10);
                    var line = s.app + ': ' + s.messages + ' mensagens, ' + s.contacts + ' contatos';
                    if (s.deleted) line += ', ' + s.deleted + ' apagadas recuperadas';
                    if (s.mediaShared) line += ', ' + s.mediaShared + ' arquivos de mídia';
                    y = pdfLine(doc, line, 15, y, 175);
                    y += 2;
                });
            }

            var pageCount = doc.internal.getNumberOfPages();
            for (var p = 1; p <= pageCount; p++) {
                doc.setPage(p);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text('Documento gerado automaticamente por Acesso Espião. Uso exclusivo do titular da licença.', 15, 290);
                doc.text('Página ' + p + ' de ' + pageCount, 180, 290);
            }

            var filename = 'report-' + (type || 'full') + '-' + meta.phone.replace(/\D/g, '') + '.pdf';
            if (onProgress) onProgress('Baixando PDF...');
            doc.save(filename);

            var history = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');
            history.unshift({ type: type, protocol: meta.protocol, date: meta.generatedAt });
            localStorage.setItem('areaspy_reports', JSON.stringify(history.slice(0, 20)));
            try {
                window.dispatchEvent(new CustomEvent('areaspy:report-generated'));
            } catch (e) {}
            if (window.ZappEmail) {
                ZappEmail.reportReady();
            }

            return { filename: filename, protocol: meta.protocol, report: report };
        });
    }

    function renderReportCenter(container) {
        if (!container) return;
        var history = JSON.parse(localStorage.getItem('areaspy_reports') || '[]');

        var innerHtml =
            '<div class="report-center">' +
            '<div class="report-center-header">' +
            '<span>Report Center</span>' +
            '<span class="report-badge">ACTIVE</span></div>' +
            '<p class="report-center-desc">Forensic PDF export — deep analysis required (2–5 min on first export).</p>' +
            '<div class="report-type-grid">';

        Object.keys(REPORT_TYPES).forEach(function (key) {
            var t = REPORT_TYPES[key];
            innerHtml += '<button type="button" class="report-type-btn" data-report-type="' + key + '">' +
                '<span class="report-type-icon">' + t.icon + '</span>' +
                '<span class="report-type-label">' + t.label + '</span>' +
                '<span class="report-type-action">PDF</span></button>';
        });

        innerHtml += '</div>' +
            '<div class="report-generating hidden" id="report-generating">' +
            '<div class="spinner-border spinner-border-sm text-success"></div>' +
            '<span id="report-gen-status">Preparing...</span></div>';

        if (history.length) {
            innerHtml += '<div class="report-history"><p class="report-history-title">Recent</p><ul>';
            history.slice(0, 2).forEach(function (h) {
                innerHtml += '<li>#' + h.protocol + ' — ' + h.date + '</li>';
            });
            innerHtml += '</ul></div>';
        }

        innerHtml += '</div>';

        container.innerHTML =
            '<div class="report-center-wrap">' +
            '<button type="button" class="report-center-toggle" aria-expanded="false">' +
            '<i class="fa fa-chevron-down"></i> Export reports</button>' +
            '<div class="report-center-body">' + innerHtml + '</div></div>';

        var wrap = container.querySelector('.report-center-wrap');
        var toggle = container.querySelector('.report-center-toggle');
        toggle.addEventListener('click', function () {
            var open = wrap.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        container.querySelectorAll('[data-report-type]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var rtype = btn.getAttribute('data-report-type');
                var genEl = container.querySelector('#report-generating');
                var statusEl = container.querySelector('#report-gen-status');
                genEl.classList.remove('hidden');
                btn.disabled = true;

                exportPDFWithAnalysis(rtype, function (msg) {
                    if (statusEl) statusEl.textContent = msg;
                }).then(function () {
                    genEl.classList.add('hidden');
                    btn.disabled = false;
                    renderReportCenter(container);
                }).catch(function () {
                    if (statusEl) statusEl.textContent = 'Error generating. Please try again.';
                    setTimeout(function () { genEl.classList.add('hidden'); btn.disabled = false; }, 2000);
                });
            });
        });
    }

    function getDashboardSnapshot() {
        var meta = getMeta();
        var seedRef = { value: getSeed() + 900 };
        var devices = ['iPhone 14 Pro', 'iPhone 13', 'Samsung Galaxy S23', 'Google Pixel 7', 'iPhone 12', 'Galaxy A54'];
        var osList = ['iOS 17.4', 'iOS 16.6', 'Android 14', 'Android 13', 'iOS 17.2'];
        var networks = ['5G', '4G LTE', 'Wi-Fi + Cellular', 'LTE'];
        var riskLevels = ['MEDIUM', 'HIGH', 'CRITICAL'];
        var riskLevel = randPick(['HIGH', 'CRITICAL', 'CRITICAL'], seedRef);
        var riskScore = riskLevel === 'CRITICAL' ? randInt(79, 94, seedRef) : randInt(64, 78, seedRef);
        var battery = randInt(28, 91, seedRef);
        var lastSeenMins = randInt(1, 38, seedRef);
        var timeline = generateTimeline(8);
        var flags = [];
        if (riskScore > 75) flags.push('Late-night messaging spike detected');
        flags.push('Suspicious Wi-Fi handoff logged');
        flags.push('Dating app mirror activity');
        if (randInt(0, 1, seedRef)) flags.push('Deleted message recovery flagged');

        var moduleSync = {
            ligacoes: randInt(58, 76, seedRef),
            sms: randInt(62, 84, seedRef),
            wifi: randInt(71, 88, seedRef),
            whatsapp: randInt(54, 72, seedRef),
            instagram: randInt(48, 68, seedRef),
            facebook: randInt(45, 65, seedRef),
            messenger: randInt(50, 70, seedRef),
            tiktok: randInt(42, 62, seedRef),
            tinder: randInt(38, 58, seedRef)
        };

        return {
            meta: meta,
            battery: battery,
            lastSeenMins: lastSeenMins,
            deviceModel: randPick(devices, seedRef),
            os: randPick(osList, seedRef),
            network: randPick(networks, seedRef),
            plan: 'Premium License',
            riskLevel: riskLevel,
            riskScore: riskScore,
            flags: flags.slice(0, 3),
            timeline: timeline,
            moduleSync: moduleSync,
            activityPool: ACTIVITY_EVENTS.slice()
        };
    }

    global.AreaspyReport = {
        types: REPORT_TYPES,
        generate: generateReport,
        exportPDF: exportPDFWithAnalysis,
        exportPDFCore: exportPDF,
        runAnalysis: runAnalysisPipeline,
        renderCenter: renderReportCenter,
        getMeta: getMeta,
        getDashboard: getDashboardSnapshot,
        activityEvents: ACTIVITY_EVENTS
    };
})(typeof window !== 'undefined' ? window : this);
