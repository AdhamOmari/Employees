import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2 } from 'lucide-react';
import { uploadUsersToRealtimeDB, deleteAllUploadedUsersRealtime, fetchUploadedUsersRealtime } from '@/lib/realtime-upload';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';

export interface UploadedUser {
  id: string;
  name: string;
  status: 'IN' | 'OUT';
  loginTime?: number | null;
  logoutTime?: number | null;
}

export default function ExcelUpload({ onData }: { onData: (users: UploadedUser[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) return;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
      // Find header row
      const header = data[0];
      const idIdx = header.findIndex(h => h.toLowerCase() === 'id');
      const nameIdx = header.findIndex(h => h.toLowerCase() === 'name');
      if (idIdx === -1 || nameIdx === -1) return;
      const users: UploadedUser[] = data.slice(1)
        .filter(row => row[idIdx] && row[nameIdx])
        .map(row => ({
          id: String(row[idIdx]),
          name: String(row[nameIdx]),
          status: 'OUT', // Default to OUT
          loginTime: null,
          logoutTime: null,
        }));
      setLoading(true);
      try {
        await uploadUsersToRealtimeDB(users);
        const fresh = await fetchUploadedUsersRealtime();
        onData(fresh as UploadedUser[]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteAllUploadedUsersRealtime();
      onData(null as any); // Set to null so parent hides the table
      setConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div dir={dir} className="flex gap-4 items-center">
      <input
        type="file"
        accept=".xlsx,.xls"
        ref={inputRef}
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 flex items-center gap-2"
        dir={dir}
        disabled={loading}
      >
        <Upload className="w-5 h-5" />
        {loading ? t('uploading', 'Uploading...') : t('uploadExcelFile', 'Upload Excel File')}
      </button>
      {loading && (
        <span className="flex items-center gap-2 text-blue-600 font-medium">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          {t('uploading', 'Uploading...')}
        </span>
      )}
<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
  <AlertDialogTrigger asChild>
    <button
      type="button"
      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
      dir={dir}
      disabled={deleteLoading}
    >
      <Trash2  />
      <span>{deleteLoading ? t('deleting', 'Deleting...') : t('deleteUploadedData', 'Delete Uploaded Data')}</span>
    </button>
  </AlertDialogTrigger>
  
  <AlertDialogContent dir={dir} className={dir === 'rtl' ? 'text-right' : 'text-left'}>
    <AlertDialogHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
      <AlertDialogTitle className={dir === 'rtl' ? 'text-right' : 'text-left'}>
        {t('confirmDeleteTitle', 'Delete All Uploaded Data?')}
      </AlertDialogTitle>
      <AlertDialogDescription className={`text-sm text-zinc-600 mt-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        {t('confirmDeleteDesc', 'Are you sure you want to delete all uploaded users? This action cannot be undone.')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    
    <AlertDialogFooter 
      className={`flex gap-2 mt-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
      dir={dir}
    >
      <AlertDialogCancel 
        className="px-4 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
      >
        {t('cancel', 'Cancel')}
      </AlertDialogCancel>
      
      <AlertDialogAction asChild>
        <button 
          onClick={handleDelete} 
          disabled={deleteLoading} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {deleteLoading && (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{deleteLoading ? t('deleting', 'Deleting...') : t('confirm', 'Yes, Delete')}</span>
        </button>
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </div>
  );
}
