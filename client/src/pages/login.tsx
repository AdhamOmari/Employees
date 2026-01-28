// Fix for window.uploadedUsers type error
declare global {
  interface Window {
    uploadedUsers?: Array<{ id: string | number; name: string }>;
  }
}
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mock-data";
import ExcelUpload, { UploadedUser } from '@/components/ui/excel-upload';
import { updateUserStatusRealtime, fetchUploadedUsersRealtime } from '@/lib/realtime-upload';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import LanguageToggle from '@/components/ui/language-toggle';
import { motion } from "framer-motion";

export default function LoginPage() {
  // Handler for admin login form (uses Firebase Authentication)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      // Only allow the specific admin email
        const allowedAdminEmail = "adhamomarics@gmail.com"; // <-- fixed admin email
      if (email.trim().toLowerCase() !== allowedAdminEmail) {
        setError(t('invalidLogin', 'Only the authorized admin can log in.'));
        return;
      }
      const auth = getAuth(app);
      console.log("Entered email:", email.trim().toLowerCase());
console.log("Allowed email:", allowedAdminEmail);
      await signInWithEmailAndPassword(auth, email, password);
      setError("");
      setLocation("/admin");
    } catch (err: any) {
      setError(t('invalidLogin', 'Invalid email or password.'));
    }
  };

  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<"in" | "out" | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const store = useStore();
  const [location, setLocation] = useLocation();

  // Handler for QR check-in/out
  const handleQRAction = async () => {
    if (!userId) return;
    setQrLoading(true);
    try {
      // Fetch users from realtime DB
      const users = await fetchUploadedUsersRealtime();
      const user = users.find((u: any) => String(u.id) === String(userId));
      if (!user || typeof user !== 'object') {
        setMessage(t('notFound', 'User not found.'));
        setQrLoading(false);
        return;
      }
      let newStatus: 'IN' | 'OUT';
      let loginTime = (user as any).loginTime || null;
      let logoutTime = (user as any).logoutTime || null;
      if ((user as any).status === 'IN') {
        newStatus = 'OUT';
        logoutTime = Date.now();
      } else {
        newStatus = 'IN';
        loginTime = Date.now();
        logoutTime = null;
      }
      await updateUserStatusRealtime(userId, newStatus, loginTime, logoutTime);
      setUserStatus(newStatus === 'IN' ? 'in' : 'out');
      setMessage(
        newStatus === 'IN'
          ? t('loggedIn', 'You are logged in.')
          : t('loggedOut', 'You are logged out.')
      );
    } catch (err) {
      setMessage(t('error', 'An error occurred.'));
    } finally {
      setQrLoading(false);
    }
  };

  // Parse id from URL and always fetch latest status from Firebase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setUserId(id);
      setInitialLoading(true);
      fetchUploadedUsersRealtime().then((users) => {
        const user = users.find((u: any) => String(u.id) === String(id));
        setUserName(user && typeof (user as any).name === 'string' ? (user as any).name : null);
        setUserStatus(user && (user as any).status === 'IN' ? 'in' : 'out');
        setInitialLoading(false);
      });
    }
  }, [location]);

  if (userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 relative overflow-hidden font-sans">
        {/* Background with Overlay (reuse from kiosk) */}
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
          style={{ backgroundImage: `url(/src/assets/lobby-bg.png)` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />

        {/* Language Toggle */}
        <div className="absolute top-6 right-6 z-20">
          {/* @ts-ignore */}
          <LanguageToggle size="md" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-md px-4">
          <div className="mb-8 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-white/90 mb-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              <ShieldCheck className="w-15 h-15 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight break-words whitespace-pre-line mt-2">{t('userLogin', 'User Login')}</h2>
          </div>
          <Card className="bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl overflow-hidden">
              <CardContent className="pt-8 pb-8">
                <div className="space-y-4 text-center">
                  {userName && (
                    <div className="text-xl font-semibold text-black mt-2">{userName}</div>
                  )}
                  {initialLoading ? (
                    <span className="flex items-center justify-center gap-2 text-zinc-500">
                      <svg className="animate-spin h-5 w-5 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                      {t('loading', 'Loading...')}
                    </span>
                  ) : (
                    <>
                      <div className={userStatus === 'in' ? 'text-emerald-600 font-bold' : 'text-zinc-500 font-bold'}>
                        {userStatus === 'in' ? t('loggedIn', 'You are logged in.') : t('notLoggedIn', 'You are not logged in.')}
                      </div>
                      <div className="text-zinc-500 text-sm mb-2">{message}</div>
                      <Button onClick={handleQRAction} className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-lg" disabled={qrLoading}>
                        {qrLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                            </svg>
                            {t('loading', 'Loading...')}
                          </span>
                        ) : (
                          userStatus === 'in' ? t('checkOut', 'Check Out') : t('checkIn', 'Check In')
                        )}
                      </Button>
                      <div className="text-zinc-800 text-xs mt-4">
                        {t('qrInstruction', 'Scan your QR code to check in or out.')}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
          </Card>
          <div className="mt-8 text-center">
            {/* <Button 
              variant="ghost" 
              className="text-white/50 hover:text-white hover:bg-white/10"
              onClick={() => setLocation('/')}> 
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToKiosk', 'Back to Kiosk')}
            </Button> */}
          </div>
        </div>
      </div>
    );
  }

  // Default: admin login
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 relative overflow-hidden font-sans">
      {/* Background with Overlay (reuse from kiosk) */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(/src/assets/lobby-bg.png)` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />

      {/* Language Toggle */}
      <div className="absolute top-6 right-6 z-20">
        {/* @ts-ignore */}
        <LanguageToggle size="md" />
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 text-white rounded-xl mb-4 shadow-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('adminLogin', 'Admin Login')}</h1>
        </div>
        <Card className="bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl overflow-hidden">
    
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t('emailAddress', 'Email Address')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <Input 
                    id="email"
                    type="email"
                    className="pl-10 h-12 border-zinc-200 focus:ring-zinc-900"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password', 'Password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                  <Input 
                    id="password"
                    type="password"
                    className="pl-10 h-12 border-zinc-200 focus:ring-zinc-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-lg">
                {t('signInDashboard', 'Sign In to Dashboard')}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-8 text-center">
          {/* Optionally add a back button here if needed */}
        </div>
      </motion.div>
    </div>
  );
}
