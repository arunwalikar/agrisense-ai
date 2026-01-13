import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('common.appName', 'FarmAI')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              {t('auth.subtitle', 'Your intelligent farming assistant')}
            </p>
          </div>
          
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#22c55e',
                    brandAccent: '#16a34a',
                    brandButtonText: 'white',
                    inputBorder: '#e5e7eb',
                    inputBorderFocus: '#22c55e',
                    inputBorderHover: '#22c55e',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              },
            }}
            providers={['google']}
            redirectTo={window.location.origin}
            localization={{
              variables: {
                sign_in: {
                  email_label: t('auth.email', 'Email'),
                  password_label: t('auth.password', 'Password'),
                  button_label: t('auth.signIn', 'Sign in'),
                  link_text: t('auth.noAccount', "Don't have an account? Sign up"),
                },
                sign_up: {
                  email_label: t('auth.email', 'Email'),
                  password_label: t('auth.password', 'Password'),
                  button_label: t('auth.signUp', 'Sign up'),
                  link_text: t('auth.hasAccount', 'Already have an account? Sign in'),
                },
              },
            }}
          />
        </div>
        
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {t('auth.terms', 'By signing in, you agree to our Terms of Service and Privacy Policy')}
        </p>
      </div>
    </div>
  );
};

export default Login;
