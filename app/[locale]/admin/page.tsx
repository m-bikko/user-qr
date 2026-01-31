import { useTranslations } from 'next-intl';

export default function AdminDashboard() {
    const t = useTranslations('Admin');
    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">{t('dashboard_title')}</h1>
            <p>{t('welcome_message')}</p>
        </div>
    );
}
