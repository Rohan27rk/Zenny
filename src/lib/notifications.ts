// Zenny Push Notifications — Gen Z finance nudges
// Uses Web Notifications API (works in PWA on Android, limited on iOS)

const STORAGE_KEY = 'zenny_notif';
const MAX_PER_DAY = 10;

interface NotifState {
    date: string;       // yyyy-mm-dd
    count: number;      // sent today
    lastIdx: number;    // last notification index used
}

// Gen Z finance notifications — funny, relatable, engaging
const NOTIFICATIONS = [
    { title: '💸 Your wallet called', body: "It said it's feeling lonely. Maybe check your expenses?" },
    { title: '📈 SIP reminder', body: "Your future self is begging you to not skip this month's SIP." },
    { title: '🧾 Adulting check', body: "Did you log today's expenses? No? That's what we thought." },
    { title: '💳 Credit card alert', body: "Your due date is coming. Don't be that person who pays interest." },
    { title: '🎯 Savings goal', body: "You're this close to your goal. Don't ghost it now." },
    { title: '☕ Latte factor', body: "That ₹200 coffee every day = ₹73,000/year. Just saying." },
    { title: '📊 Weekly recap', body: "Your money has been busy. Come see where it went." },
    { title: '🚀 Wealth check', body: "Millionaires check their finances daily. You're welcome." },
    { title: '💰 Money tip', body: "Invest before you spend. Not the other way around. Trust." },
    { title: '🔔 Zenny says hi', body: "Your finances won't manage themselves. 5 mins is all it takes." },
    { title: '😤 Inflation is real', body: "₹100 today = ₹85 next year. Invest or lose. Your call." },
    { title: '🏦 SIP > Savings account', body: "FD at 6% vs Nifty at 12%. One of these is not like the other." },
    { title: '🎉 You got this', body: "Checking your finances = adulting level 100. Open Zenny!" },
    { title: '📱 Quick check', body: "30 seconds. That's all it takes to log today's expenses." },
    { title: '💡 Did you know?', body: "₹1,000/month SIP for 20 years = ₹9.9 lakhs at 12% returns." },
    { title: '🛍️ Impulse buy check', body: "Before that purchase — do you NEED it or just WANT it?" },
    { title: '🌙 End of day', body: "Log today's expenses before you forget. Future you says thanks." },
    { title: '☀️ Morning money check', body: "Good morning! Quick finance check before the day gets crazy?" },
    { title: '🎯 Goal unlocked?', body: "How close are you to your savings goal this month?" },
    { title: '💸 Payday soon?', body: "Plan where your salary goes BEFORE it arrives. Budget first." },
    { title: '🤑 Compound interest', body: "Einstein called it the 8th wonder. Are you using it?" },
    { title: '📉 Market dip?', body: "Don't panic. SIP investors love dips. More units for same ₹!" },
    { title: '🏠 Dream big', body: "That house/car/trip won't fund itself. What's your plan?" },
    { title: '⚡ Quick win', body: "Cancel one unused subscription today. That's free money." },
    { title: '🧠 Finance IQ', body: "Ask Zenny AI anything about money. It won't judge you." },
];

function getState(): NotifState {
    const today = new Date().toISOString().split('T')[0];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const state: NotifState = JSON.parse(raw);
            if (state.date === today) return state;
        }
    } catch { /* ignore */ }
    return { date: today, count: 0, lastIdx: -1 };
}

function saveState(state: NotifState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getNextNotif(lastIdx: number): { title: string; body: string; idx: number } {
    const idx = (lastIdx + 1) % NOTIFICATIONS.length;
    return { ...NOTIFICATIONS[idx], idx };
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function sendNotification(title: string, body: string) {
    if (Notification.permission !== 'granted') return;
    try {
        const n = new Notification(title, {
            body,
            icon: '/zenny-favicon.svg',
            badge: '/zenny-favicon.svg',
            tag: 'zenny-nudge',
            renotify: true,
        });
        n.onclick = () => { window.focus(); n.close(); };
    } catch { /* ignore */ }
}

export function scheduleNotificationsForToday(userName?: string) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const state = getState();
    if (state.count >= MAX_PER_DAY) return;

    const remaining = MAX_PER_DAY - state.count;
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(22, 0, 0, 0);

    const msLeft = endOfDay.getTime() - now.getTime();
    if (msLeft <= 0) return;

    // Spread remaining notifications evenly across the rest of the day
    const interval = Math.floor(msLeft / remaining);

    for (let i = 0; i < remaining; i++) {
        const delay = interval * (i + 1) + Math.random() * 10 * 60 * 1000; // add up to 10min randomness
        setTimeout(() => {
            const currentState = getState();
            if (currentState.count >= MAX_PER_DAY) return;
            const notif = getNextNotif(currentState.lastIdx);
            // Personalise first notification of the day
            const body = currentState.count === 0 && userName
                ? `Hey ${userName}! ${notif.body}`
                : notif.body;
            sendNotification(notif.title, body);
            saveState({ ...currentState, count: currentState.count + 1, lastIdx: notif.idx });
        }, delay);
    }
}

export function initNotifications(userName?: string) {
    requestNotificationPermission().then(granted => {
        if (granted) scheduleNotificationsForToday(userName);
    });
}
