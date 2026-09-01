package ai.erythro;

final class A44Copy {

    final String diagTitleHtml;
    final String diagSub;
    final String strip;
    final String findingHead;
    final String recTitle;
    final String recImproveTitle;
    final String recChip;
    final String recCopy;
    final String pagesChecked;
    final String chartSpeed;
    final String chartSeo;
    final String chartLead;
    final String chartSec;
    final String chartAi;
    final String unlockOverlaySub;
    final String unlockRecsBtn;

    private A44Copy(
            String diagTitleHtml, String diagSub, String strip, String findingHead,
            String recTitle, String recImproveTitle, String recChip, String recCopy, String pagesChecked,
            String chartSpeed, String chartSeo, String chartLead, String chartSec, String chartAi,
            String unlockOverlaySub, String unlockRecsBtn
    ) {
        this.diagTitleHtml = diagTitleHtml;
        this.diagSub = diagSub;
        this.strip = strip;
        this.findingHead = findingHead;
        this.recTitle = recTitle;
        this.recImproveTitle = recImproveTitle;
        this.recChip = recChip;
        this.recCopy = recCopy;
        this.pagesChecked = pagesChecked;
        this.chartSpeed = chartSpeed;
        this.chartSeo = chartSeo;
        this.chartLead = chartLead;
        this.chartSec = chartSec;
        this.chartAi = chartAi;
        this.unlockOverlaySub = unlockOverlaySub;
        this.unlockRecsBtn = unlockRecsBtn;
    }

    static A44Copy of(String lang, A44Tier tier) {
        String t = lang == null ? "ru" : lang.trim().toLowerCase();
        return switch (t) {
            case "en" -> en(tier);
            case "he" -> he(tier);
            default -> ru(tier);
        };
    }

    private static String stripFor(A44Tier tier, String pro, String diagnostic, String free) {
        return switch (tier) {
            case PRO -> pro;
            case DIAGNOSTIC -> diagnostic;
            case FREE -> free;
        };
    }

    private static A44Copy ru(A44Tier tier) {
        return new A44Copy(
                "<span>Р</span>езультаты диагностики",
                "основные показатели",
                stripFor(tier, "FULL · Аудит конверсии", "DIAGNOSTIC · Аудит конверсии", "PREVIEW · Бесплатный аудит"),
                "Уязвимость конверсии",
                "Рекомендации по исправлению ошибок",
                "Рекомендации по улучшению",
                "code",
                "copy",
                "Проверено страниц: %d",
                "Скорость и Мобильный UX",
                "Seo и Видимость",
                "Лидогенерация и Формы",
                "Безопасность и Стабильность",
                "AI Visibility & Brand Discovery",
                "Полный чеклист 60+ проверок, обход воронки и план исправления — в полном отчёте",
                "Разблокировать полный список результатов и рекомендаций с пакетом PRO"
        );
    }

    private static A44Copy en(A44Tier tier) {
        return new A44Copy(
                "<span>D</span>iagnostic results",
                "key metrics",
                stripFor(tier, "FULL · Conversion audit", "DIAGNOSTIC · Conversion audit", "PREVIEW · Free audit"),
                "Conversion vulnerability",
                "Recommendations to fix issues",
                "Recommendations for improvement",
                "code",
                "copy",
                "Pages checked: %d",
                "Speed & Mobile UX",
                "SEO & Visibility",
                "Lead gen & Forms",
                "Security & Stability",
                "AI Visibility & Brand Discovery",
                "Full 60+ check checklist, funnel crawl and the fix plan — in the full report",
                "Unlock the full list of results and recommendations with the PRO pack"
        );
    }

    private static A44Copy he(A44Tier tier) {
        return new A44Copy(
                "<span>ת</span>וצאות האבחון",
                "מדדים עיקריים",
                stripFor(tier, "FULL · אודיט קונברסיה", "DIAGNOSTIC · אודיט קונברסיה", "PREVIEW · אודיט חינם"),
                "פגיעות קונברסיה",
                "המלצות לתיקון שגיאות",
                "המלצות לשיפור",
                "code",
                "copy",
                "עמודים שנבדקו: %d",
                "מהירות ו-UX מובייל",
                "SEO ונראות",
                "לידים וטפסים",
                "אבטחה ויציבות",
                "נראות AI וגילוי מותג",
                "רשימת 60+ בדיקות מלאה, סריקת משפך ותוכנית תיקון — בדוח המלא",
                "שחררו את הרשימה המלאה של תוצאות והמלצות עם חבילת PRO"
        );
    }
}
