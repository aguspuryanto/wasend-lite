import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/api';
import { Send, Users, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';

export default function SendWA() {
  const { baseUrl, apiKey, broadcastLists, addReport } = useAppContext();
  const [type, setType] = useState<'single' | 'broadcast'>('single');
  const [recipient, setRecipient] = useState('');
  const [selectedList, setSelectedList] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [recipientError, setRecipientError] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Combine all contacts from broadcast lists for the autocomplete
  const allContacts = useMemo(() => {
    const contacts: { id: string; label: string; phone: string; listName: string }[] = [];
    broadcastLists.forEach(list => {
      list.contacts.forEach(contact => {
        contacts.push({
          id: `${contact.id}-${list.id}`,
          label: `${contact.name} (${contact.phone})`,
          phone: contact.phone,
          listName: list.name
        });
      });
    });
    return contacts;
  }, [broadcastLists]);

  const filteredContacts = useMemo(() => {
    if (inputValue.length < 4) return [];
    return allContacts.filter(option =>
      option.phone.includes(inputValue) ||
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue, allContacts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleRecipientChange = (value: string) => {
    setInputValue(value);
    setRecipient(value);
    setRecipientError('');
    
    if (value.length > 0 && value.length < 4) {
      setRecipientError('Recipient must be at least 4 characters long');
      return;
    }
    
    if (value.length >= 4) {
      const matchedContacts: { contact: any, listName: string }[] = [];
      
      broadcastLists.forEach(list => {
        const foundContacts = list.contacts.filter(contact => 
          contact.phone.includes(value)
        );
        foundContacts.forEach(contact => {
          matchedContacts.push({ contact, listName: list.name });
        });
      });
      
      // if (matchedContacts.length > 0) {
      //   const contactNames = matchedContacts.map(mc => `${mc.contact.name} (${mc.listName})`).join(', ');
      //   setRecipientError(`Found ${matchedContacts.length} contact(s): ${contactNames}`);
      // }
    }
  };

  const handleAutocompleteSelect = (contact: any) => {
    setRecipient(contact.phone);
    setInputValue(contact.label);
    setRecipientError('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (inputValue.length >= 4) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    if (inputValue.length >= 4) {
      setIsOpen(!isOpen);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Number</label>
                <div className="relative" ref={autocompleteRef}>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={inputValue}
                      onChange={(e) => handleRecipientChange(e.target.value)}
                      onFocus={handleInputFocus}
                      onClick={handleInputClick}
                      placeholder="e.g., 6281234567890"
                      className={`w-full rounded-md shadow-sm sm:text-sm border py-2 px-3 pr-10 focus:ring-indigo-500 ${
                        recipientError && recipientError.includes('must be at least 4')
                          ? 'border-red-300 focus:border-red-500'
                          : recipientError && recipientError.includes('Found')
                          ? 'border-green-300 focus:border-green-500'
                          : 'border-gray-300 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleInputClick}
                      className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
                    >
                      <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </button>
                  </div>
                  
                  {isOpen && filteredContacts.length > 0 && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleAutocompleteSelect(contact)}
                          className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-600 hover:text-white"
                        >
                          <div className="flex flex-col">
                            <div className="block truncate font-medium">
                              {contact.label}
                            </div>
                            <div className="block truncate text-sm text-gray-500 hover:text-indigo-200">
                              {contact.listName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Include country code without + (e.g., 62 for Indonesia)</p>
                {recipientError && (
                  <p className={`mt-1 text-xs ${
                    recipientError.includes('must be at least 4')
                      ? 'text-red-500'
                      : 'text-green-600'
                  }`}>
                    {recipientError}
                  </p>
                )}
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
