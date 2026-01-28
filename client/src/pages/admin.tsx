import { useStore } from "@/lib/mock-data";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ArrowLeft, Download, Users, Activity, Clock } from "lucide-react";
import ExcelUpload, { UploadedUser } from '@/components/ui/excel-upload';
import { fetchUploadedUsersRealtime } from '@/lib/realtime-upload';
import { useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from '@/lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/ui/language-toggle";

function AdminPage() {
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");
    // QR Dialog state and handlers
    const [qrUser, setQRUser] = useState<UploadedUser | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);
    const handleOpenQR = (user: UploadedUser) => setQRUser(user);
    const handleCloseQR = () => setQRUser(null);
    // Convert SVG to PNG using a canvas
    const svgToPngDataUrl = (svgElement, width = 256, height = 256) => {
      return new Promise((resolve, reject) => {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const img = new window.Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
      });
    };

    // Loading state for download actions
    const [qrLoading, setQrLoading] = useState<'none' | 'pdf' | 'img'>('none');

    // Save as PDF (SVG to PNG to PDF)
    const handleSavePDF = async () => {
      if (!qrRef.current || !qrUser) return;
      setQrLoading('pdf');
      try {
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;
        // Dynamically import heavy libraries only when needed
        const jsPDF = (await import('jspdf')).default;
        // html2canvas is only needed if you use it elsewhere, otherwise remove this import
        // const html2canvas = (await import('html2canvas')).default;
        const imgData = await svgToPngDataUrl(svg, 180, 180);
        const pdf = new jsPDF();
        pdf.addImage(imgData, 'PNG', 10, 10, 60, 60);
        pdf.text(`ID: ${qrUser.id}`, 10, 80);
        pdf.text(`Name: ${qrUser.name}`, 10, 90);
        pdf.save(`${qrUser.name || 'user'}-qr.pdf`);
      } finally {
        setQrLoading('none');
      }
    };

    // Download QR as PNG (SVG to PNG)
    const handleDownloadQR = async () => {
      if (!qrRef.current || !qrUser) return;
      setQrLoading('img');
      try {
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;
        const imgData = await svgToPngDataUrl(svg, 180, 180);
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `${qrUser.name || 'user'}-qr.png`;
        a.click();
      } finally {
        setQrLoading('none');
      }
    };
  const { t, i18n } = useTranslation();
  const store = useStore();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");


  // Uploaded users state
  const [uploadedUsers, setUploadedUsers] = useState<UploadedUser[] | null>(null);
  // Auth and data fetch logic
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setIsAdmin(true);
        setAuthChecked(true);
        setAuthError("");
      } else {
        setIsAdmin(false);
        setAuthChecked(true);
        setAuthError("You must be logged in as an authorized admin to access the admin dashboard.");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch uploaded users only if admin
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const fetchAndSet = async () => {
      try {
        const users = await fetchUploadedUsersRealtime();
        if (active) setUploadedUsers(users as UploadedUser[]);
      } catch (err) {
        if (active) setAuthError("Permission denied. Please make sure you are logged in as Admin@employee.com.");
      }
    };
    fetchAndSet();
    const interval = setInterval(fetchAndSet, 2000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isAdmin]);

  // Employees and logs from uploadedUsers (Firebase)
  const employees = (uploadedUsers || []).filter(u => u.status === 'IN');
  // Build logs from login/logout times
  let logs: any[] = [];
  if (uploadedUsers) {
    uploadedUsers.forEach(u => {
      if (u.loginTime) {
        logs.push({
          id: u.id + '-login',
          name: u.name,
          action: 'IN',
          timestamp: u.loginTime
        });
      }
      if (u.logoutTime) {
        logs.push({
          id: u.id + '-logout',
          name: u.name,
          action: 'OUT',
          timestamp: u.logoutTime
        });
      }
    });
    // Sort logs by timestamp descending
    logs = logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Stats from uploadedUsers
  const currentOccupancy = employees.length;
  const totalEntriesToday = logs.filter(l => l.action === 'IN').length;
  const refusalsFull = 0; // Not tracked in Firebase logic yet

  const filteredEmployees = employees.filter((e: any) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter((l: any) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  if (!authChecked) {
    return (
<div className="min-h-screen flex items-center justify-center bg-black text-white" dir={dir}>
  <div className="flex flex-col items-center gap-6">
    {/* Loading Spinner */}
    <div className="relative">
      <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
    </div>
    
    {/* Loading Text */}
    <div className="text-center space-y-2">
      <h2 className="text-xl font-semibold text-white">
        {t('loadingAuthentication', 'Loading authentication...')}
      </h2>
      <p className="text-sm text-zinc-400">
        {t('pleaseWait', 'Please wait a moment')}
      </p>
    </div>
    
    {/* Animated Dots */}
    <div className="flex gap-2">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
</div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-900">
        <div className="bg-white p-8 rounded shadow text-center">
          <div className="text-red-600 font-bold mb-4">{authError}</div>
          <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen bg-zinc-50 font-sans text-zinc-900`} dir={dir}>
      {/* Top Navigation */}
<header className="bg-white border-b border-zinc-200 sticky top-0 z-50" dir={dir}>
  <div className="container mx-auto px-6 h-16 flex items-center justify-between" dir={dir}>
    {/* Title - appears on right in RTL, left in LTR */}
    <div className="flex items-center gap-4">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
          {t('adminDashboard', 'Admin Dashboard')}
        </h1>
      </div>
    </div>

    {/* Buttons - appears on left in RTL, right in LTR */}
    <div className="flex items-center gap-3">
      <LanguageToggle size="md" />
      
      <Button
        variant="outline"
        className="text-xs px-3 py-1 border-zinc-300"
        onClick={async () => {
          const auth = getAuth(app);
          await signOut(auth);
          setIsAdmin(false);
          setLocation('/login');
        }}
      >
        {t('logout', 'Logout')}
      </Button>
    </div>
  </div>
</header>
      <main className="container mx-auto px-6 py-8" dir={dir}>
        {/* Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${dir === 'rtl' ? 'text-right' : ''}`} dir={dir}>
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{t('currentOccupancy', 'Current Occupancy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900">{currentOccupancy}</span>
                <span className="text-sm text-zinc-400">/ {uploadedUsers ? uploadedUsers.length : 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{t('totalEntriesToday', 'Total Entries Today')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-emerald-600">
                {totalEntriesToday}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wide">{t('refusalsFull', 'Refusals (Full)')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-red-600">
                {refusalsFull}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className={`space-y-6 ${dir === 'rtl' ? 'text-right' : ''}`} dir={dir}>
          {/* Excel Upload and Uploaded Users Table */}
          <div className="mb-8">
            <ExcelUpload onData={setUploadedUsers} />
          </div>
          {uploadedUsers && (
            <Card className="shadow-sm border-zinc-200 mb-8">
              <CardHeader>
                <CardTitle>{t('uploadedUsers', 'Uploaded Users')}</CardTitle>
                <CardDescription>{t('uploadedUsersDesc', 'Table of users from uploaded Excel file. Click QR to view and download.')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={dir === 'rtl' ? 'text-right' : 'text-left'}>{t('id', 'ID')}</TableHead>
                      <TableHead className="text-center">{t('name', 'Name')}</TableHead>
                      <TableHead className="text-center">{t('status', 'Status')}</TableHead>
                      <TableHead className="text-center">{t('loginTime', 'Login Time')}</TableHead>
                      <TableHead className="text-center">{t('logoutTime', 'Logout Time')}</TableHead>
                      <TableHead className={dir === 'rtl' ? 'text-left' : 'text-right'}>{t('qr', 'QR')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className={dir === 'rtl' ? 'text-right' : 'text-left'}>{user.id}</TableCell>
                        <TableCell className="text-center">{user.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={user.status === 'IN' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}>
                            {t(user.status === 'IN' ? 'inside' : 'outside', user.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-zinc-500">
                          {user.loginTime ? format(new Date(user.loginTime), 'PPp') : '-'}
                        </TableCell>
                        <TableCell className="text-center text-xs text-zinc-500">
                          {user.logoutTime ? format(new Date(user.logoutTime), 'PPp') : '-'}
                        </TableCell>
                        <TableCell className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                          <Button size="sm" variant="outline" onClick={() => handleOpenQR(user)}>
                            {t('qr', 'QR')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
                  {/* QR Dialog */}
                  {qrUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir={dir}>
  <div className="bg-white rounded-lg shadow-lg p-8 relative w-full max-w-xs flex flex-col items-center">
    {/* Close button - positioned correctly for RTL/LTR */}
    <button 
      onClick={handleCloseQR} 
      className={`absolute top-2 ${dir === 'rtl' ? 'left-2' : 'right-2'} text-zinc-400 hover:text-zinc-900 text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 transition-colors`}
    >
      ✕
    </button>
    
    {/* QR Code and Info */}
      <div ref={qrRef} className="flex flex-col items-center mb-6">
        {qrUser && qrUser.id && (
          <QRCodeSVG 
            value={`${window.location.origin}/login?id=${encodeURIComponent(String(qrUser.id))}`}
            size={180} 
          />
        )}
        <div className="mt-4 text-center">
          <div className="font-bold text-lg text-zinc-900">{qrUser.name}</div>
          <div className="text-sm text-zinc-600 mt-1">
            {t('userId', 'ID')}: {qrUser.id}
          </div>

        </div>
      </div>
    
            {/* Action Buttons */}
            <div className="flex gap-2 w-full">
              <Button 
                className="flex-1 flex items-center justify-center gap-2" 
                onClick={handleSavePDF}
                disabled={qrLoading === 'pdf'}
              >
                {qrLoading === 'pdf' ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                {t('saveAsPDF', 'Save as PDF')}
              </Button>
              <Button 
                className="flex-1 flex items-center justify-center gap-2" 
                variant="outline" 
                onClick={handleDownloadQR}
                disabled={qrLoading === 'img'}
              >
                {qrLoading === 'img' ? (
                  <svg className="animate-spin h-5 w-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                ) : null}
                {t('download', 'Download')}
              </Button>
            </div>
          </div>
        </div>
                  )}
          <div className={`flex items-center justify-between ${dir === 'rtl' ? 'flex-row-reverse' : ''}`} dir={dir}>
            <div className="relative w-72" dir={dir}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input 
                placeholder={t('searchEmployees', 'Search employees...')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-zinc-200"
              />
            </div>
            {/* Export Report button removed */}
          </div>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="bg-white border border-zinc-200 p-1 mb-6">
              <TabsTrigger value="current" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                <Users className="w-4 h-4 mr-2" />
                {t('currentlyInside', 'Currently Inside')}
                <Badge variant="secondary" className="ml-2 bg-zinc-200 text-zinc-700 hover:bg-zinc-200">{filteredEmployees.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                <Clock className="w-4 h-4 mr-2" />
                {t('accessLogs', 'Access Logs')}
                <Badge variant="secondary" className="ml-2 bg-zinc-200 text-zinc-700 hover:bg-zinc-200">{filteredLogs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              <Card className="shadow-sm border-zinc-200">
                <CardHeader>
                  <CardTitle>{t('activePersonnel', 'Active Personnel')}</CardTitle>
                  <CardDescription>{t('activePersonnelDesc', 'List of employees currently checked into the secure room.')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-zinc-50 border-zinc-100">
                        <TableHead className={dir === 'rtl' ? 'text-right w-[300px]' : 'text-left w-[300px]'}>{t('employeeName', 'Employee Name')}</TableHead>
                        <TableHead className={dir === 'rtl' ? 'text-left' : 'text-right'}>{t('status', 'Status')}</TableHead>
                        <TableHead className="text-center">{t('checkinTime', 'Check-in Time')}</TableHead>
                        <TableHead className="text-center">{t('duration', 'Duration')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                            {t('noEmployeesInside', 'No employees currently inside.')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <TableRow key={employee.name} className="hover:bg-zinc-50 border-zinc-100">
                            <TableCell className={dir === 'rtl' ? 'text-right font-medium text-zinc-900' : 'text-left font-medium text-zinc-900'}>{employee.name}</TableCell>
                            <TableCell className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">{t('inside', 'Inside')}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-zinc-500">
                              {employee.loginTime ? format(new Date(employee.loginTime), "PPp") : '-'}
                            </TableCell>
                            <TableCell className="text-center text-zinc-500 font-mono text-xs">
                              {/* Simple duration placeholder - in real app would be a live ticker */}
                              {t('active', 'ACTIVE')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card className="shadow-sm border-zinc-200">
                <CardHeader>
                  <CardTitle>{t('accessHistory', 'Access History')}</CardTitle>
                  <CardDescription>{t('accessHistoryDesc', 'Complete log of all entry and exit events.')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-zinc-50 border-zinc-100">
                        <TableHead>{t('timestamp', 'Timestamp')}</TableHead>
                        <TableHead>{t('employeeName', 'Employee Name')}</TableHead>
                        <TableHead>{t('eventType', 'Event Type')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-zinc-50 border-zinc-100">
                          <TableCell className="font-mono text-xs text-zinc-500">
                            {format(new Date(log.timestamp), "PPp")}
                          </TableCell>
                          <TableCell className="font-medium text-zinc-900">{log.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`
                              ${log.action === 'IN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                              ${log.action === 'OUT' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                              ${log.action === 'DENIED' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            `}>
                              {typeof log.action === 'string' ? t(log.action.toLowerCase(), log.action) : log.action}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
