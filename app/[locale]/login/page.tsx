import { useTranslations } from 'next-intl';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    const t = useTranslations('Index'); // Using Index for now, or create Auth namespace later

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Admin Access</h1>
                    <p className="text-muted-foreground">Enter your credentials to manage the menu.</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
