(function () {
    'use strict';

    var messagesEl = document.getElementById('chat-messages');
    var optionsEl = document.getElementById('chat-options');
    var typingEl = document.getElementById('chat-typing');
    var refundBar = document.getElementById('refund-bar');
    var refundAttempts = parseInt(localStorage.getItem('areaspy_refund_attempts') || '0', 10);
    var refundRequested = localStorage.getItem('areaspy_refund_done') === '1';

    var ACKS = ['Entendi.', 'Claro.', 'Um momento…', 'Deixe-me verificar…', 'Boa pergunta.'];

    function apiBase() {
        var path = window.location.pathname || '/';
        return path.replace(/\/chat.*$/, '').replace(/\/$/, '');
    }

    function getUserEmail() {
        if (window.ZappEmail && ZappEmail.getUserEmail) {
            var fromZapp = ZappEmail.getUserEmail();
            if (fromZapp) return fromZapp;
        }
        try {
            var stored = localStorage.getItem('areaspy_user_email');
            if (stored && stored.indexOf('@') > 0) return stored;
        } catch (e) {}
        return '';
    }

    function getAnalysisState() {
        if (window.AreaspyAnalysis && AreaspyAnalysis.getState) {
            return AreaspyAnalysis.getState();
        }
        return { pct: 3, dayNum: 1, daysLeftLabel: '10–20 days' };
    }

    function notifyRefundToServer(email, reason, protocol) {
        if (!email) return;
        fetch(apiBase() + '/api/mark-refund.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, reason: reason, protocol: protocol, action: 'refund' })
        }).catch(function () {});
    }

    function notifyRefundAttempt(step) {
        var email = getUserEmail();
        if (!email) return;
        fetch(apiBase() + '/api/mark-refund.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, step: step, action: 'attempt', source: 'chat' })
        }).catch(function () {});
    }

    function now() {
        var d = new Date();
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function scrollBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pickAck() {
        return ACKS[rand(0, ACKS.length - 1)];
    }

    function showTyping(ms) {
        return new Promise(function (resolve) {
            messagesEl.appendChild(typingEl);
            typingEl.style.display = 'block';
            scrollBottom();
            setTimeout(function () {
                typingEl.style.display = 'none';
                resolve();
            }, ms || rand(900, 1800));
        });
    }

    function containsHtml(text) {
        return typeof text === 'string' && /<[a-z][^>]*>/i.test(text);
    }

    function addMessage(text, type, html) {
        var wrap = document.createElement('div');
        wrap.className = 'chat-msg ' + (type || 'bot');
        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        if (html) bubble.innerHTML = text;
        else bubble.textContent = text;
        var time = document.createElement('div');
        time.className = 'chat-time';
        time.textContent = now();
        wrap.appendChild(bubble);
        wrap.appendChild(time);
        messagesEl.appendChild(wrap);
        scrollBottom();
    }

    function addUserMessage(text) {
        addMessage(text, 'user');
    }

    function clearOptions() {
        optionsEl.innerHTML = '';
    }

    function showOptions(buttons) {
        clearOptions();
        buttons.forEach(function (btn) {
            var el = document.createElement('button');
            el.type = 'button';
            el.className = 'chat-option-btn' +
                (btn.danger ? ' danger' : '') +
                (btn.primary ? ' primary' : '');
            el.textContent = btn.label;
            el.addEventListener('click', function () {
                clearOptions();
                if (btn.userText) addUserMessage(btn.userText);
                setTimeout(btn.action, rand(350, 550));
            });
            optionsEl.appendChild(el);
        });
    }

    function delay(ms) {
        return Promise.resolve().then(function () {
            return new Promise(function (r) { setTimeout(r, ms || rand(400, 900)); });
        });
    }

    async function botSay(text, wait, html) {
        await showTyping(wait);
        addMessage(text, 'bot', html || containsHtml(text));
    }

    async function botSayLines(lines) {
        for (var i = 0; i < lines.length; i++) {
            if (i > 0) await delay(rand(500, 1100));
            await botSay(lines[i]);
        }
    }

    function generateProtocol() {
        var d = new Date();
        return 'RF' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0') + '-' + Math.floor(100000 + Math.random() * 900000);
    }

    function buildRefundSuccessHtml(protocol, last4) {
        return '<div class="refund-success">' +
            '<i class="fa fa-check-circle"></i>' +
            '<h3>✅ Reembolso processado com sucesso</h3>' +
            '<p>Sua solicitação de estorno foi enviada à administradora do cartão de final <strong>' + last4 + '</strong>.</p>' +
            '<p style="margin-top:0.75rem"><strong>💳 Extrato da fatura:</strong> pode levar de <strong>30 a 60 dias</strong> para constar no seu extrato, de acordo com as normas da sua emissora.</p>' +
            '<p style="margin-top:0.5rem;font-size:0.8rem">Guarde seu número de protocolo: <strong>#' + protocol + '</strong></p>' +
            '<p style="margin-top:0.5rem;font-size:0.75rem;opacity:0.8">Seu acesso foi encerrado conforme nossa política de reembolso.</p>' +
            '</div>';
    }

    function showRefundDone() {
        var protocol = localStorage.getItem('areaspy_refund_protocol') || generateProtocol();
        var last4 = localStorage.getItem('areaspy_refund_last4') || '****';
        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);
    }

    function analysisStatusText() {
        var s = getAnalysisState();
        return 'Você está atualmente no <strong>Dia ' + s.dayNum + '</strong> da análise (' + s.pct + '%). ' +
            'Tempo restante estimado: <strong>' + s.daysLeftLabel + '</strong>.';
    }

    async function startFlow() {
        if (refundRequested) {
            await botSay('Olá! Localizei seu protocolo de reembolso em nosso sistema.');
            showRefundDone();
            showOptions([
                { label: 'Outra dúvida', userText: 'Tenho outra dúvida', action: mainMenu, primary: true },
                { label: 'Encerrar chat', userText: 'Obrigado(a)', action: endChat }
            ]);
            return;
        }

        await botSay('Olá! 👋 Sou a <strong>Ana</strong> do suporte do <strong>Acesso Espião</strong>.');
        await delay();
        await botSay('Estou online agora e posso te ajudar com acesso, rastreamento ou status da análise forense.');
        await delay();
        await botSay(
            '💡 <strong>Important:</strong> cloned apps (WhatsApp, Instagram, etc.) run a <strong>10 to 20 day</strong> deep forensic analysis due to high data demand. ' +
            'The first report may take <strong>2 to 5 minutes</strong>. We email you <strong>daily progress updates</strong>. SMS, calls and Wi-Fi are available in your panel now.'
        );

        showOptions([
            { label: '⏳ Analysis status', userText: 'What is my analysis status?', action: flowAnalysis, primary: true },
            { label: '🔐 Access issue', userText: 'I can\'t access my panel', action: flowAccess },
            { label: '📍 Rastreamento', userText: 'Dúvida sobre o rastreamento', action: flowTracking },
            { label: '📱 Aplicativo não abre', userText: 'O aplicativo não está abrindo', action: flowApps },
            { label: '💳 Reembolso', userText: 'Quero reembolso', action: flowRefundGate, danger: true }
        ]);
    }

    function mainMenu() {
        showOptions([
            { label: '⏳ Analysis status', userText: 'Analysis status', action: flowAnalysis, primary: true },
            { label: '🔐 Access', userText: 'Access problem', action: flowAccess },
            { label: '📍 Rastreamento', userText: 'Rastreamento', action: flowTracking },
            { label: '📱 Apps clonados', userText: 'Apps não abrem', action: flowApps },
            { label: '📧 E-mails diários', userText: 'Sobre os e-mails diários', action: flowEmails },
            { label: '💳 Reembolso', userText: 'Reembolso', action: flowRefundGate, danger: true }
        ]);
    }

    async function flowEmails() {
        await botSay(pickAck());
        await delay();
        await botSayLines([
            'Assim que você cadastra seu e-mail e número de telefone, nosso sistema passa a enviar <strong>atualizações diárias</strong> com o progresso da análise forense.',
            'Você também recebe alertas quando novos eventos são detectados no número monitorado. Lembre-se de conferir sua caixa de entrada e pasta de spam.',
            analysisStatusText()
        ]);
        stallAndReturn();
    }

    async function flowAnalysis() {
        await botSay(pickAck() + ' Veja como está o progresso da sua análise:');
        await delay();
        await botSayLines([
            'Os aplicativos clonados são descriptografados em nosso cluster seguro. Devido ao grande volume de dados, o espelhamento completo leva de <strong>10 a 20 dias</strong>.',
            analysisStatusText(),
            'Enquanto isso, <strong>SMS, chamadas, Wi-Fi e localização</strong> já estão disponíveis no seu painel. Os aplicativos clonados exibem prévias parciais até a conclusão da análise.'
        ]);
        showOptions([
            { label: '📱 Abrir painel', userText: 'Abrir painel', action: goDashboard, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowAccess() {
        await botSay('Vamos resolver isso. Você está entrando com o <strong>mesmo e-mail utilizado na compra</strong>?');
        showOptions([
            { label: 'Sim, o mesmo e-mail', userText: 'Sim, o mesmo e-mail', action: accessVerify, primary: true },
            { label: 'Não me lembro', userText: 'Não me lembro', action: accessEmailHelp }
        ]);
    }

    async function accessEmailHelp() {
        await botSay('No problem — check your purchase confirmation email (including spam). Access usually syncs within 15 minutes.');
        stallAndReturn();
    }

    async function accessVerify() {
        await botSay('One moment, checking your license…');
        await showTyping(rand(2200, 3400));
        await botSay('✅ Sua licença consta como <strong>ativa</strong> em nossos servidores. Recomendamos limpar o cache do navegador (Ctrl+F5) e tentar novamente.');
        stallAndReturn();
    }

    async function flowTracking() {
        await botSay('O primeiro rastreamento leva de <strong>2 a 5 minutos</strong>. Você aguardou a barra de progresso atingir 100%?');
        showOptions([
            { label: 'Sim, aguardei', userText: 'Aguardei até o fim', action: trackingVerify, primary: true },
            { label: 'Saí antes de terminar', userText: 'Saí antes de terminar', action: trackingWait }
        ]);
    }

    async function trackingWait() {
        await botSay('É necessário deixar o processo concluir. Volte à tela de rastreamento, aguarde a barra atingir 100% e depois acesse seu painel.');
        stallAndReturn();
    }

    async function trackingVerify() {
        await botSay('Checking our servers…');
        await showTyping(rand(2500, 3800));
        await botSay('✅ Rastreamento concluído com sucesso em nossos servidores! Acesse seu painel para visualizar SMS, chamadas, localização e redes Wi-Fi.');
        showOptions([
            { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
            { label: '← Menu', userText: 'Menu', action: mainMenu }
        ]);
    }

    async function flowApps() {
        await botSay('Tap the app icon and wait 5–10 seconds. If it freezes, refresh with Ctrl+F5.');
        await showTyping(rand(1800, 2600));
        await botSay('All 9 modules are online. Cloned social apps show buffered previews until deep analysis completes — that is expected.');
        stallAndReturn();
    }

    function goDashboard() {
        window.location.href = '../app/applications/';
    }

    async function stallAndReturn() {
        await delay(200);
        showOptions([
            { label: '⏳ Analysis status', userText: 'Analysis status', action: flowAnalysis, primary: true },
            { label: 'Outro assunto', userText: 'Outro assunto', action: mainMenu },
            { label: 'End chat', userText: 'Thanks', action: endChat }
        ]);
    }

    async function flowRefundGate() {
        refundAttempts++;
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);

        if (refundAttempts === 1) {
            await botSay('Entendo sua preocupação. Você já conferiu o <strong>status da análise</strong> no seu painel?');
            await delay();
            await botSay(
                'Deep analysis takes <strong>10 to 20 days</strong> and we send <strong>daily progress by email</strong>. ' +
                'SMS, calls and Wi-Fi are available in your panel right now.'
            );
            showOptions([
                { label: '⏳ Check analysis status', userText: 'Check analysis status', action: flowAnalysis, primary: true },
                { label: 'Me ajude com o acesso', userText: 'Preciso de ajuda com o acesso', action: mainMenu },
                { label: 'Continuar com reembolso', userText: 'Quero continuar com o reembolso', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 2) {
            await botSay('⚠️ Most customers who explore the panel (SMS, calls, location) find what they need while social apps finish analysis.');
            await delay();
            await botSay('I can help you open the panel now — it takes less than 2 minutes.');
            showOptions([
                { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
                { label: 'Continue with refund', userText: 'Continue with refund', action: flowRefundGate, danger: true }
            ]);
            return;
        }

        if (refundAttempts === 3) {
            await botSay('Tudo bem. Por favor, confirme se você concluiu <strong>todas</strong> estas etapas:');
            showRefundChecklist();
            return;
        }

        await flowRefundWarning();
    }

    function showRefundChecklist() {
        addMessage(
            '<div class="chat-checklist" id="refund-checklist">' +
            '<label><input type="checkbox" id="ck1"> Fiz login com o e-mail da compra</label>' +
            '<label><input type="checkbox" id="ck2"> Digitei o número de telefone com o DDD correto</label>' +
            '<label><input type="checkbox" id="ck3"> Aguardei o rastreamento atingir 100%</label>' +
            '<label><input type="checkbox" id="ck4"> Abri os aplicativos no painel</label>' +
            '<button type="button" id="checklist-submit" class="chat-option-btn primary" style="width:100%;margin-top:8px;border-radius:6px">Continuar</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('checklist-submit').addEventListener('click', onChecklistSubmit);
    }

    async function onChecklistSubmit() {
        var all = ['ck1', 'ck2', 'ck3', 'ck4'].every(function (id) {
            return document.getElementById(id).checked;
        });
        var checklist = document.getElementById('refund-checklist');
        if (checklist) checklist.closest('.chat-msg').remove();

        if (!all) {
            addUserMessage('Não completei todas as etapas');
            await botSay('I recommend finishing the full flow and exploring SMS, calls and location — most customers find what they need that way 😊');
            showOptions([
                { label: '📱 Open panel', userText: 'Open panel', action: goDashboard, primary: true },
                { label: 'Me guie passo a passo', userText: 'Me ajude passo a passo', action: mainMenu },
                { label: 'Quero reembolso mesmo assim', userText: 'Reembolso mesmo assim', action: forceRefundWarning, danger: true }
            ]);
            return;
        }

        addUserMessage('Completei todas as etapas');
        await botSay('Perfeito. Se você já visualizou os dados no painel, o serviço foi entregue conforme contratado.');
        await delay();
        await botSay('Tem certeza de que deseja solicitar o reembolso? O acesso será cancelado e os dados excluídos em até 24 horas.');
        showOptions([
            { label: '📱 Conferir painel primeiro', userText: 'Abrir painel', action: goDashboard, primary: true },
            { label: 'Confirmar reembolso', userText: 'Confirmo o reembolso', action: forceRefundWarning, danger: true }
        ]);
    }

    function forceRefundWarning() {
        refundAttempts = Math.max(refundAttempts, 4);
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));
        notifyRefundAttempt(refundAttempts);
        flowRefundWarning();
    }

    async function flowRefundWarning() {
        refundAttempts = Math.max(refundAttempts, 4);
        localStorage.setItem('areaspy_refund_attempts', String(refundAttempts));

        await botSay('⚠️ Aviso final sobre o reembolso:');
        addMessage(
            '<div class="alert-panel">' +
            '<strong>Atenção:</strong> ao confirmar o reembolso:<br>' +
            '• O acesso é cancelado <strong>permanentemente</strong><br>' +
            '• Os dados são excluídos dos servidores em 24h<br>' +
            '• Estorno na fatura: <strong>30 a 60 dias</strong> (prazo da administradora)</div>',
            'bot', true
        );
        await delay(400);
        showOptions([
            { label: 'Cancel — keep my access', userText: 'Keep using the service', action: mainMenu, primary: true },
            { label: 'Confirmar cancelamento e reembolso', userText: 'Confirmo o cancelamento', action: flowRefundForm, danger: true }
        ]);
    }

    async function flowRefundForm() {
        await botSay('Para localizar sua transação, preencha os dados abaixo:');
        await delay(200);

        var prefilled = getUserEmail();
        addMessage(
            '<div class="refund-form" id="refund-form">' +
            '<input type="email" id="refund-email" placeholder="E-mail utilizado na compra" required>' +
            '<input type="text" id="refund-last4" placeholder="Últimos 4 dígitos do cartão" maxlength="4" inputmode="numeric">' +
            '<select id="refund-reason">' +
            '<option value="">Motivo do reembolso</option>' +
            '<option value="nao_funciona">It didn\'t work</option>' +
            '<option value="comprou_errado">Comprei por engano</option>' +
            '<option value="arrependimento">Arrependimento da compra</option>' +
            '<option value="demora">A análise demorou muito</option>' +
            '</select>' +
            '<button type="button" id="refund-submit">Processar reembolso</button>' +
            '</div>',
            'bot', true
        );

        document.getElementById('refund-submit').addEventListener('click', processRefund);
        if (prefilled) {
            document.getElementById('refund-email').value = prefilled;
        }
    }

    async function processRefund() {
        var email = document.getElementById('refund-email').value.trim();
        var last4 = document.getElementById('refund-last4').value.trim();
        var reason = document.getElementById('refund-reason').value;
        var btn = document.getElementById('refund-submit');

        if (!email || !reason || last4.length !== 4 || !/^\d{4}$/.test(last4)) {
            await botSay('Por favor, informe seu e-mail, motivo e os <strong>4 últimos dígitos</strong> do cartão.');
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Processing…';
        addUserMessage('Solicitar reembolso');

        await botSay('Connecting to payment gateway…');
        await showTyping(rand(2400, 3200));
        await botSay('Locating transaction ending in ' + last4 + '…');
        await showTyping(rand(2800, 4000));
        await botSay('Transaction found. Submitting refund to card issuer…');
        await showTyping(rand(3200, 4800));
        await botSay('Reembolso confirmado com sucesso! ✅');

        var protocol = generateProtocol();
        localStorage.setItem('areaspy_refund_done', '1');
        localStorage.setItem('areaspy_refund_email', email);
        localStorage.setItem('areaspy_refund_date', new Date().toISOString());
        localStorage.setItem('areaspy_refund_protocol', protocol);
        localStorage.setItem('areaspy_refund_last4', last4);
        refundRequested = true;

        notifyRefundToServer(email, reason, protocol);

        var form = document.getElementById('refund-form');
        if (form) form.closest('.chat-msg').remove();

        addMessage(buildRefundSuccessHtml(protocol, last4), 'bot', true);

        if (refundBar) refundBar.style.display = 'none';
        showOptions([{ label: 'Entendido', userText: 'Obrigado(a)', action: endChat }]);
    }

    async function endChat() {
        await botSay('Thank you for contacting us! We\'re here 24/7 if you need anything else. 😊');
        clearOptions();
    }

    function openRefundDirect() {
        clearOptions();
        addUserMessage('Quero solicitar reembolso');
        flowRefundGate();
    }

    function openAnalysisFlow() {
        clearOptions();
        addUserMessage('Qual é o status da minha análise?');
        flowAnalysis();
    }

    if (refundBar) {
        refundBar.innerHTML = '<button type="button" class="refund-bar-subtle">Dúvidas sobre reembolso?</button>';
        refundBar.querySelector('button').addEventListener('click', openRefundDirect);
        if (refundRequested) refundBar.style.display = 'none';
    }

    var hash = window.location.hash;
    if (hash === '#reembolso') {
        setTimeout(openRefundDirect, 1000);
    } else if (hash === '#codigo' || hash === '#analise' || hash === '#relatorio') {
        setTimeout(openAnalysisFlow, 700);
    } else {
        startFlow();
    }
})();
