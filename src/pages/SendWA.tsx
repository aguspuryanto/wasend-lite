import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/api';
import { Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SendWA() {
  const { baseUrl, apiKey, broadcastLists, addReport } = useAppContext();
  const [type, setType] = useState<'single' | 'broadcast'>('single');
  const [recipient, setRecipient] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setProgress(null);

    try {
      if (type === 'single') {
        if (!recipient) throw new Error('Recipient number is required');
        
        const res = await sendMessage(baseUrl, apiKey, recipient, message);
        
        addReport({
          id: Date.now().toString(),
          recipient,
          message,
          status: res.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString(),
          type: 'single'
        });

        if (res.success) {
          setStatus({ type: 'success', message: 'Message sent successfully!' });
          setRecipient('');
          setMessage('');
        } else {
          setStatus({ type: 'error', message: res.error || 'Failed to send message' });
        }
      } else {
        if (!selectedList) throw new Error('Please select a broadcast list');
        
        const list = broadcastLists.find(l => l.id === selectedList);
        if (!list || list.contacts.length === 0) throw new Error('Selected list is empty');

        let successCount = 0;
        let failCount = 0;
        const totalContacts = list.contacts.length;

        setProgress({ current: 0, total: totalContacts });

        for (let i = 0; i < totalContacts; i++) {
          const contact = list.contacts[i];
          
          // Replace placeholders if any (e.g., {{name}})
          const personalizedMessage = message.replace(/\{\{name\}\}/gi, contact.name);

          const res = await sendMessage(baseUrl, apiKey, contact.phone, personalizedMessage);
          
          addReport({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            recipient: contact.phone,
            message: personalizedMessage,
            status: res.success ? 'sent' : 'failed',
            timestamp: new Date().toISOString(),
            type: 'broadcast',
            listId: list.id
          });

          if (res.success) successCount++;
          else failCount++;

          setProgress({ current: i + 1, total: totalContacts });
          
          // Optional: Add a small delay between messages to prevent rate limiting
          if (i < totalContacts - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        setStatus({ 
          type: 'success', 
          message: `Broadcast completed. Sent: ${successCount}, Failed: ${failCount}` 
        });
        setMessage('');
        setProgress(null);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'An error occurred' });
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Send WhatsApp Message</h3>
        </div>
        
        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setType('single')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center border-2 transition-colors ${
                type === 'single' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 text-gray-600 hover:border-indigo-200'
              }`}
            >
              <Send className="w-5 h-5 mr-2" />
              Single Message
            </button>
            <button
              onClick={() => setType('broadcast')}
              className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center border-2 transition-colors ${
                type === 'broadcast' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-200 text-gray-600 hover:border-indigo-200'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Broadcast
            </button>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            {type === 'single' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient Number</label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g., 6281234567890"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
                />
                <p className="mt-1 text-xs text-gray-500">Include country code without + (e.g., 62 for Indonesia)</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700">Broadcast List</label>
                <select
                  required
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
                >
                  <option value="">Select a list...</option>
                  {broadcastLists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name} ({list.contacts.length} contacts)
                    </option>
                  ))}
                </select>
                {broadcastLists.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">No broadcast lists available. Create one first.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            {status && (
              <div className={`p-4 rounded-md flex items-start ${
                status.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span className="text-sm">{status.message}</span>
              </div>
            )}

            {progress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Sending broadcast...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || (type === 'broadcast' && broadcastLists.length === 0)}
                className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
