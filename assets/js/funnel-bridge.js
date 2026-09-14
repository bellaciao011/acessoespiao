(function () {
    'use strict';

    var CHAT_BASE = '../../chat/';
    var REFUND_ATTEMPTS_KEY = 'areaspy_refund_attempts';

    function injectSupportHub() {
        var mount = document.getElementById('panel-support-mount');
        if (!mount || document.getElementById('panel-support-hub')) return;

        var hub = document.createElement('div');
        hub.id = 'panel-support-hub';
        hub.className = 'panel-support-hub';
        hub.innerHTML =
            '<div class="panel-support-head">' +
            '<span><i class="fa fa-headphones"></i> Ana — Suporte 24/7</span>' +
            '<span class="live-badge" style="font-size:0.6rem">ONLINE</span></div>' +
            '<p class="panel-support-desc">Precisa de ajuda? A Ana pode verificar o status da análise (10 a 20 dias), acesso ou rastreamento em poucos minutos.</p>' +
            '<div class="panel-support-actions">' +
            '<a href="' + CHAT_BASE + '#analise" class="btn-support-action primary"><i class="fa fa-hourglass-half"></i> Status da análise</a>' +
            '<a href="' + CHAT_BASE + '" class="btn-support-action"><i class="fa fa-comments"></i> Abrir chat</a>' +
            '<a href="' + CHAT_BASE + '#reembolso" class="btn-support-action"><i class="fa fa-credit-card"></i> Ajuda com reembolso</a>' +
            '</div>';

        mount.appendChild(hub);
    }

    function injectChatFab() {
        if (document.getElementById('panel-chat-fab')) return;
        var fab = document.createElement('a');
        fab.id = 'panel-chat-fab';
        fab.className = 'panel-chat-fab';
        fab.href = CHAT_BASE;
        fab.title = 'Suporte 24/7';
        fab.innerHTML = '<i class="fa fa-comments"></i>';
        document.body.appendChild(fab);
    }

    function injectRefundSoftGate() {
        var attempts = parseInt(localStorage.getItem(REFUND_ATTEMPTS_KEY) || '0', 10);
        if (attempts > 0) return;

        var topbar = document.querySelector('.panel-topbar-actions a[href*="reembolso"]');
        if (!topbar) return;

        topbar.addEventListener('click', function (e) {
            if (sessionStorage.getItem('zapp_refund_gate_seen')) return;
            sessionStorage.setItem('zapp_refund_gate_seen', '1');
            if (!confirm('Nossa equipe de suporte pode ajudar com o status da análise ou acesso antes de processar qualquer solicitação.\n\nClique em OK para falar com o suporte.')) {
                e.preventDefault();
                window.location.href = CHAT_BASE;
            }
        });
    }

    function onDashboardReady() {
        injectSupportHub();
        injectChatFab();
        injectRefundSoftGate();

        if (window.ZappEmail) {
            ZappEmail.dashboardReady();
            ZappEmail.supportIntro();
            ZappEmail.scheduleFunnelEmails();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('panel-device-card')) {
            onDashboardReady();
        }
    });

    window.ZappFunnel = {
        chatUrl: CHAT_BASE
    };
})();
