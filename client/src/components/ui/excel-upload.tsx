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
  Iqama: string; // Primary identifier now
  name: string;
  Passport: string;
  Nationality: string;
  status: 'IN' | 'OUT';
  loginTime?: number | null;
  logoutTime?: number | null;
}

export default function ExcelUpload({ onData }: { onData: (users: UploadedUser[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState({ title: '', description: '' });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    
    const file = e.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      if (!bstr) {
        setLoading(false);
        return;
      }
      
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      
      // Convert to JSON with headers
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
      
      // Find header row (could be row 0 or 1 based on your Excel)
      let headerRowIndex = 0;
      
      // Try to find the header row by checking for key column names
      for (let i = 0; i < Math.min(3, data.length); i++) {
        const row = data[i];
        if (row && row.some(cell => 
          cell && typeof cell === 'string' && 
          (cell.toLowerCase().includes('iqama') || 
           cell.toLowerCase().includes('name') ||
           cell.toLowerCase().includes('نامه') || // Arabic name
           cell.toLowerCase().includes('nationality'))
        )) {
          headerRowIndex = i;
          break;
        }
      }
      
      const header = data[headerRowIndex];
      
      // Debug: Log the headers found with their actual types and values
   
      
      // Find column indices - check for both Arabic and English headers
      const iqamaIdx = header.findIndex(h => 
        h && typeof h === 'string' && (
          h.toLowerCase().trim() === 'iqama' || 
          h.toLowerCase().trim() === 'iqama number' ||
          h.toLowerCase().trim().includes('iqama')
        )
      );
      
      const nameIdx = header.findIndex(h => 
        h && typeof h === 'string' && (
          h.toLowerCase().trim() === 'name' ||
          h.trim() === 'نامه' || // Arabic "Name"
          h.toLowerCase().trim().includes('name')
        )
      );
      
      const passportIdx = header.findIndex(h => {
        if (!h) return false;
        const val = String(h).toLowerCase().trim();
        return val === 'passport' ||
          val === 'passport number' ||
          val === 'جواز' || // Arabic "Passport"
          val === 'جواز السفر' || // Arabic "Passport"
          val.includes('passport') ||
          val.includes('جواز');
      });
      
      const nationalityIdx = header.findIndex(h => 
        h && typeof h === 'string' && (
          h.toLowerCase().trim() === 'nationality' ||
          h.toLowerCase().trim() === 'جنسية' || // Arabic "Nationality"
          h.toLowerCase().trim().includes('nationality')
        )
      );
      
      // Debug: Log column indices

      
      // Iqama is required
      if (iqamaIdx === -1) {
        setErrorMessage({
          title: t('missingColumnsTitle', 'Missing Required Column'),
          description: t('missingIqamaColumn', 'Excel file must contain "Iqama" column. Please check your file and try again.')
        });
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      
      if (nameIdx === -1) {
        setErrorMessage({
          title: t('missingColumnsTitle', 'Missing Required Column'),
          description: t('missingNameColumn', 'Excel file must contain "Name" column. Please check your file and try again.')
        });
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      
      const users: UploadedUser[] = [];
      
      // Start from row after header
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const iqama = row[iqamaIdx];
        const name = row[nameIdx];
        
        // Skip if Iqama or Name is empty
        if (!iqama && !name) continue;
        
        const user: UploadedUser = {
          Iqama: String(iqama || '').trim(),
          name: String(name || '').trim(),
          Passport: passportIdx !== -1 && row[passportIdx] ? String(row[passportIdx]).trim() : '',
          Nationality: nationalityIdx !== -1 && row[nationalityIdx] ? String(row[nationalityIdx]).trim() : '',
          status: 'OUT',
          loginTime: null,
          logoutTime: null,
        };
        
        // Debug: Log first few users to verify data extraction
  
        
        // Only add if Iqama is not empty
        if (user.Iqama) {
          users.push(user);
        }
      }
      
      
      // Check for duplicate Iqama numbers
      const iqamaSet = new Set();
      const duplicates: string[] = [];
      users.forEach(user => {
        if (iqamaSet.has(user.Iqama)) {
          duplicates.push(user.Iqama);
        } else {
          iqamaSet.add(user.Iqama);
        }
      });
      
      if (duplicates.length > 0) {
        setErrorMessage({
          title: t('duplicateIqamaTitle', 'Duplicate Entries Found'),
          description: t('duplicateIqama', `The following Iqama numbers appear more than once: ${duplicates.join(', ')}. Please remove duplicates and try again.`)
        });
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      
      if (users.length === 0) {
        setErrorMessage({
          title: t('noDataFoundTitle', 'No Data Found'),
          description: t('noDataFound', 'No valid user data found in the Excel file. Please check your file format and try again.')
        });
        setErrorDialogOpen(true);
        setLoading(false);
        return;
      }
      
 
      
      setLoading(true);
      try {
        await uploadUsersToRealtimeDB(users);
        const fresh = await fetchUploadedUsersRealtime();
        onData(fresh as UploadedUser[]);
      } catch (error) {
        console.error('Upload error:', error);
        setErrorMessage({
          title: t('uploadErrorTitle', 'Upload Failed'),
          description: t('uploadError', 'Error uploading data: ' + (error as Error).message)
        });
        setErrorDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = (error) => {
      console.error('File reading error:', error);
      setErrorMessage({
        title: t('fileReadErrorTitle', 'File Read Error'),
        description: t('fileReadError', 'Unable to read the file. Please make sure it\'s a valid Excel file and try again.')
      });
      setErrorDialogOpen(true);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteAllUploadedUsersRealtime();
      onData([]); // Clear the data
      if (inputRef.current) inputRef.current.value = '';
      setConfirmOpen(false);
    } catch (error) {
      console.error('Delete error:', error);
      setErrorMessage({
        title: t('deleteErrorTitle', 'Delete Failed'),
        description: t('deleteError', 'Error deleting data. Please try again.')
      });
      setErrorDialogOpen(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div dir={dir} className="flex gap-4 items-center flex-wrap">
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={inputRef}
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        dir={dir}
        disabled={loading || deleteLoading}
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
            disabled={deleteLoading || loading}
          >
            <Trash2 className="w-5 h-5" />
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
              disabled={deleteLoading}
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

      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent dir={dir} className={`${dir === 'rtl' ? 'text-right' : 'text-left'} max-w-md`}>
          <AlertDialogHeader className={dir === 'rtl' ? 'text-right' : 'text-left'}>
            <AlertDialogTitle className={`text-red-600 font-semibold text-lg ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {errorMessage.title}
            </AlertDialogTitle>
            <AlertDialogDescription className={`text-zinc-700 mt-3 leading-relaxed ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {errorMessage.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter 
            className={`flex gap-2 mt-6 ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'}`}
            dir={dir}
          >
            <AlertDialogAction 
              onClick={() => setErrorDialogOpen(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
            >
              {t('ok', 'OK')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
