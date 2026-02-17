import { useState } from 'react';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Mode = 'login' | 'signup' | 'forgot';

const Auth = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || 'ব্যবহারকারী' },
          },
        });
        if (error) throw error;
        toast({ title: 'সফল!', description: 'আপনার ইমেইল চেক করুন এবং অ্যাকাউন্ট নিশ্চিত করুন।' });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: 'ইমেইল পাঠানো হয়েছে', description: 'পাসওয়ার্ড রিসেটের লিংক আপনার ইমেইলে পাঠানো হয়েছে।' });
      }
    } catch (err: any) {
      toast({ title: 'ত্রুটি', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🌙</div>
          <CardTitle className="text-2xl">রমাদান ট্র্যাকার</CardTitle>
          <CardDescription>
            {mode === 'login' && 'আপনার অ্যাকাউন্টে লগইন করুন'}
            {mode === 'signup' && 'নতুন অ্যাকাউন্ট তৈরি করুন'}
            {mode === 'forgot' && 'পাসওয়ার্ড রিসেট করুন'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">নাম</Label>
                <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="আপনার নাম" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'অপেক্ষা করুন...' : mode === 'login' ? 'লগইন' : mode === 'signup' ? 'সাইন আপ' : 'রিসেট লিংক পাঠান'}
            </Button>
          </form>

          {mode !== 'forgot' && (
            <div className="mt-4">
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">অথবা</span></div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={loading}
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin },
                  });
                  if (error) toast({ title: 'ত্রুটি', description: error.message, variant: 'destructive' });
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google দিয়ে লগইন
              </Button>
            </div>
          )}
          <div className="mt-4 text-center text-sm space-y-1">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-primary hover:underline block mx-auto">পাসওয়ার্ড ভুলে গেছেন?</button>
                <p className="text-muted-foreground">অ্যাকাউন্ট নেই? <button onClick={() => setMode('signup')} className="text-primary hover:underline">সাইন আপ করুন</button></p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-muted-foreground">ইতিমধ্যে অ্যাকাউন্ট আছে? <button onClick={() => setMode('login')} className="text-primary hover:underline">লগইন করুন</button></p>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-primary hover:underline">লগইনে ফিরে যান</button>
            )}
          </div>
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
};

export default Auth;
