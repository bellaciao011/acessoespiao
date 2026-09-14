(function (global) {
    'use strict';

    var ANALYSIS_START_KEY = 'areaspy_analysis_start';
    var ANALYSIS_MIN_DAYS = 10;
    var ANALYSIS_MAX_DAYS = 20;

    var COPY = {
        headline: 'Análise profunda em andamento',
        lead: 'A análise profunda está em execução — o primeiro relatório pode levar de 2 a 5 minutos. Enviamos atualizações diárias por e-mail.',
        window: '10 a 20 dias',
        windowShort: '10 a 20 dias',
        note: 'Devido à alta demanda de dados neste dispositivo, o processamento leva mais tempo. Aplicativos sociais clonados são liberados após o período indicado. SMS, chamadas e Wi-Fi permanecem disponíveis imediatamente.',
        warning: '⚠️ Por favor, não cancele nem solicite reembolso antes do término do processo, ou todo o progresso será perdido. ⚠️',
        modal: 'Devido à alta demanda de dados, conclusão estimada: 10 a 20 dias a partir da ativação da licença.',
        emailLead: 'Devido à alta demanda de dados no dispositivo monitorado, a análise de clonagem profunda levará alguns dias para ser concluída.'
    };

    function getAnalysisStartDate() {
        var raw = localStorage.getItem(ANALYSIS_START_KEY);
        if (!raw) {
            raw = new Date().toISOString();
            localStorage.setItem(ANALYSIS_START_KEY, raw);
        }
        return new Date(raw);
    }

    function setStartDate(iso) {
        if (!iso) return;
        var incoming = new Date(iso);
        if (isNaN(incoming.getTime())) return;
        var raw = localStorage.getItem(ANALYSIS_START_KEY);
        if (!raw) {
            localStorage.setItem(ANALYSIS_START_KEY, incoming.toISOString());
            return;
        }
        var current = new Date(raw);
        if (isNaN(current.getTime()) || incoming < current) {
            localStorage.setItem(ANALYSIS_START_KEY, incoming.toISOString());
        }
    }

    function getDeepAnalysisState() {
        var start = getAnalysisStartDate();
        var elapsedMs = Date.now() - start.getTime();
        var dayNum = Math.max(1, Math.floor(elapsedMs / 86400000) + 1);
        var span = Math.max(1, ANALYSIS_MAX_DAYS - 1);
        var pct = Math.min(85, Math.max(3, Math.round(3 + ((dayNum - 1) / span) * 80)));

        var remainingMax = Math.max(1, ANALYSIS_MAX_DAYS - dayNum + 1);
        var remainingMin = Math.max(1, ANALYSIS_MIN_DAYS - dayNum + 1);
        if (remainingMin > remainingMax) {
            remainingMin = remainingMax;
        }
        var daysLeftLabel = remainingMin === remainingMax
            ? remainingMin + ' dias'
            : remainingMin + '–' + remainingMax + ' dias';

        return {
            pct: pct,
            dayNum: dayNum,
            daysLeftLabel: daysLeftLabel,
            remainingMin: remainingMin,
            remainingMax: remainingMax
        };
    }

    global.AreaspyAnalysis = {
        getState: getDeepAnalysisState,
        getStartDate: getAnalysisStartDate,
        setStartDate: setStartDate,
        MIN_DAYS: ANALYSIS_MIN_DAYS,
        MAX_DAYS: ANALYSIS_MAX_DAYS,
        COPY: COPY
    };
})(window);
