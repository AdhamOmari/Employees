// import { useStore } from "@/lib/mock-data";
// import { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useLocation } from "wouter";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { ScanLine, UserCheck, Users, LogOut, AlertCircle, ShieldCheck, QrCode } from "lucide-react";
// import LanguageToggle from '@/components/ui/language-toggle';
// import { motion, AnimatePresence } from "framer-motion";
// import { QRCodeSVG } from "qrcode.react";
// import lobbyBg from "@/assets/lobby-bg.png";

// export default function KioskPage() {
//   const { t } = useTranslation();
//   const store = useStore();
//   const [name, setName] = useState("");
//   const [feedback, setFeedback] = useState<{ message: string; type: 'IN' | 'OUT' | 'DENIED' } | null>(null);
//   const [showQR, setShowQR] = useState(false);
//   const [, setLocation] = useLocation();

//   const handleScan = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim()) return;
    
//     const result = store.scan(name);
//     setFeedback({ message: result.message, type: result.type });
//     setName("");

//     // Clear feedback after 3 seconds
//     setTimeout(() => setFeedback(null), 3000);
//   };

//   const count = store.getCount();
//   const capacity = store.CAPACITY;
//   const isFull = count >= capacity;

//   const { i18n } = useTranslation();
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 relative overflow-hidden font-sans">
//       {/* Background with Overlay */}
//       <div 
//         className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
//         style={{ backgroundImage: `url(${lobbyBg})` }}
//       />
//       <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/40" />

//       {/* Main Content */}
//       <div className="relative z-10 w-full max-w-md px-4">
//         <div className="mb-8 text-center space-y-2">
//           <div className="inline-flex items-center gap-2 text-white/90 mb-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
//             <ShieldCheck className="w-4 h-4 text-emerald-400" />
//             <span className="text-md font-medium tracking-wide uppercase">{t('secureAccess', 'Secure Access Control')}</span>
//           </div>
//           <h2 className="text-lg font-bold text-white tracking-tight break-words whitespace-pre-line mt-2">{t('welcome')}</h2>
//           <p className="text-zinc-400 text-lg">{t('scanToAccess', 'Scan to access the room')}</p>
//         </div>

//         <Card className="bg-white/95 backdrop-blur-xl border-zinc-200 shadow-2xl overflow-hidden">
//           <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-6">
//             {/* <div className="flex justify-between items-center">
//               <div className="space-y-1">
//                 <CardTitle className="text-xl font-semibold text-zinc-900">{t('occupancyStatus', 'Occupancy Status')}</CardTitle>
//                 <div className="flex items-center gap-2 text-sm text-zinc-500">
//                   <Users className="w-4 h-4" />
//                   <span>Room Capacity</span>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className={`text-3xl font-bold font-mono ${isFull ? 'text-red-600' : 'text-emerald-600'}`}>
//                   {count}<span className="text-zinc-400 text-lg">/{capacity}</span>
//                 </div>
//               </div>
//             </div> */}
            
//             {/* Progress Bar */}
//             {/* <div className="mt-4 h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
//               <motion.div 
//                 className={`h-full ${isFull ? 'bg-red-500' : 'bg-emerald-500'}`}
//                 initial={{ width: 0 }}
//                 animate={{ width: `${(count / capacity) * 100}%` }}
//                 transition={{ duration: 0.5, ease: "easeOut" }}
//               />
//             </div> */}
//           </CardHeader>

//           <CardContent className="pt-8 pb-8">
//             {!showQR ? (
//               <form onSubmit={handleScan} className="space-y-6">
//                 <div className="space-y-2">
//                   <div className="relative">
//                     <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
//                     <Input 
//                       autoFocus
//                       value={name}
//                       onChange={(e) => setName(e.target.value)}
//                       placeholder={t('enterEmployee', 'Enter Employee Name...')}
//                       className="pl-12 h-14 text-lg bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
//                       data-testid="input-scanner"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 gap-4">
//                   <Button 
//                     type="submit" 
//                     className="h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
//                     disabled={!name.trim()}
//                     data-testid="button-scan"
//                   >
//                     {t('checkInOut', 'Check In/Out')}
//                   </Button>
//                   {/* <Button 
//                     type="button"
//                     variant="outline"
//                     onClick={() => setShowQR(true)}
//                     className="font-medium border-zinc-200" style={{ fontSize: '0.7rem' }}
//                     data-testid="button-show-qr"
//                   >
//                   <QrCode className="w-4 h-4 mr-2" />                    
//                       {t('showQR', 'Show QR')}
//                   </Button> */}
//                 </div>
//               </form>
//             ) : (
//               <div className="flex flex-col items-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
//                 <div className="p-6 bg-white rounded-2xl shadow-inner border-2 border-zinc-100">
//                   <QRCodeSVG value={window.location.origin} size={200} />
//                 </div>
//                 <div className="text-center space-y-2">
//                   <p className="text-zinc-900 font-semibold text-lg">Scan this QR Code</p>
//                   <p className="text-zinc-500 text-sm">Open this URL on your phone to scan in</p>
//                 </div>
//                 <Button 
//                   variant="ghost" 
//                   onClick={() => setShowQR(false)}
//                   className="text-zinc-400 hover:text-zinc-900"
//                 >
//                   Back to Name Entry
//                 </Button>
//               </div>
//             )}

//             <AnimatePresence mode="wait">
//               {feedback && (
//                 <motion.div 
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   className={`mt-6 p-4 rounded-lg flex items-center gap-3 border ${
//                     feedback.type === 'IN' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
//                     feedback.type === 'OUT' ? 'bg-blue-50 border-blue-100 text-blue-800' :
//                     'bg-red-50 border-red-100 text-red-800'
//                   }`}
//                 >
//                   {feedback.type === 'IN' && <UserCheck className="w-5 h-5 shrink-0" />}
//                   {feedback.type === 'OUT' && <LogOut className="w-5 h-5 shrink-0" />}
//                   {feedback.type === 'DENIED' && <AlertCircle className="w-5 h-5 shrink-0" />}
//                   <span className="font-medium">{feedback.message}</span>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </CardContent>
//         </Card>

//         <div className="mt-8 flex items-center justify-center gap-4">
//           <LanguageToggle size="md" />
//           <Button 
//             variant="ghost" 
//             className="text-white/50 hover:text-white hover:bg-white/10"
//             onClick={() => setLocation('/login')}
//             data-testid="link-admin"
//           >
//             {t('accessAdmin', 'Access Admin Dashboard')}
//             <LogOut className="w-4 h-4 ml-2" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
