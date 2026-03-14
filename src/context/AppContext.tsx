import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  contacts: Contact[];
  createdAt: string;
}

export interface MessageReport {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: string;
  type: 'single' | 'broadcast';
  listId?: string;
}

interface AppContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  broadcastLists: BroadcastList[];
  addBroadcastList: (list: BroadcastList) => void;
  updateBroadcastList: (id: string, list: Partial<BroadcastList>) => void;
  deleteBroadcastList: (id: string) => void;
  reports: MessageReport[];
  addReport: (report: MessageReport) => void;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [baseUrl, setBaseUrlState] = useState<string>('https://wa.kitabill.site/api');
  const [broadcastLists, setBroadcastLists] = useState<BroadcastList[]>([]);
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('wa_logged_in') === 'true');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch if Supabase URL is configured
      if (!import.meta.env.VITE_SUPABASE_URL) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'default')
          .single();
          
        if (settingsData) {
          if (settingsData.api_key) setApiKeyState(settingsData.api_key);
          if (settingsData.base_url) setBaseUrlState(settingsData.base_url);
        }

        // Fetch Broadcast Lists with Contacts
        const { data: listsData } = await supabase
          .from('broadcast_lists')
          .select('*, contacts(*)');
          
        if (listsData) {
          const formattedLists: BroadcastList[] = listsData.map(list => ({
            id: list.id,
            name: list.name,
            createdAt: list.created_at,
            contacts: list.contacts ? list.contacts.map((c: any) => ({
              id: c.id,
              name: c.name,
              phone: c.phone
            })) : []
          }));
          setBroadcastLists(formattedLists);
        }

        // Fetch Reports
        const { data: reportsData } = await supabase
          .from('reports')
          .select('*')
          .order('timestamp', { ascending: false });
          
        if (reportsData) {
          const formattedReports: MessageReport[] = reportsData.map(r => ({
            id: r.id,
            recipient: r.recipient,
            message: r.message,
            status: r.status as any,
            timestamp: r.timestamp,
            type: r.type as any,
            listId: r.list_id
          }));
          setReports(formattedReports);
        }
      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const setApiKey = async (key: string) => {
    setApiKeyState(key);
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('settings').upsert({ id: 'default', api_key: key, base_url: baseUrl });
    }
  };

  const setBaseUrl = async (url: string) => {
    setBaseUrlState(url);
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('settings').upsert({ id: 'default', api_key: apiKey, base_url: url });
    }
  };

  const login = (email: string, pass: string) => {
    if (email === 'admin@admin.com' && pass === 'admin123') {
      setIsLoggedIn(true);
      localStorage.setItem('wa_logged_in', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('wa_logged_in');
  };

  const addBroadcastList = async (list: BroadcastList) => {
    setBroadcastLists(prev => [...prev, list]);
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      const { error: listError } = await supabase
        .from('broadcast_lists')
        .insert({ id: list.id, name: list.name, created_at: list.createdAt });
        
      if (!listError && list.contacts.length > 0) {
        const contactsToInsert = list.contacts.map(c => ({
          id: c.id,
          list_id: list.id,
          name: c.name,
          phone: c.phone
        }));
        await supabase.from('contacts').insert(contactsToInsert);
      }
    }
  };

  const updateBroadcastList = async (id: string, updates: Partial<BroadcastList>) => {
    setBroadcastLists(prev => prev.map(list => list.id === id ? { ...list, ...updates } : list));
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      if (updates.name) {
        await supabase.from('broadcast_lists').update({ name: updates.name }).eq('id', id);
      }
      
      if (updates.contacts) {
        await supabase.from('contacts').delete().eq('list_id', id);
        if (updates.contacts.length > 0) {
          const contactsToInsert = updates.contacts.map(c => ({
            id: c.id,
            list_id: id,
            name: c.name,
            phone: c.phone
          }));
          await supabase.from('contacts').insert(contactsToInsert);
        }
      }
    }
  };

  const deleteBroadcastList = async (id: string) => {
    setBroadcastLists(prev => prev.filter(list => list.id !== id));
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('broadcast_lists').delete().eq('id', id);
    }
  };

  const addReport = async (report: MessageReport) => {
    setReports(prev => [report, ...prev]);
    
    if (import.meta.env.VITE_SUPABASE_URL) {
      await supabase.from('reports').insert({
        id: report.id,
        recipient: report.recipient,
        message: report.message,
        status: report.status,
        timestamp: report.timestamp,
        type: report.type,
        list_id: report.listId
      });
    }
  };

  const isAuthenticated = isLoggedIn;

  return (
    <AppContext.Provider value={{
      apiKey, setApiKey,
      baseUrl, setBaseUrl,
      broadcastLists, addBroadcastList, updateBroadcastList, deleteBroadcastList,
      reports, addReport,
      isAuthenticated, login, logout,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
