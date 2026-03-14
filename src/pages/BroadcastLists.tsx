import React, { useState, useRef } from 'react';
import { useAppContext, BroadcastList, Contact } from '../context/AppContext';
import { Plus, Upload, Trash2, Edit2, Users, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';

export default function BroadcastLists() {
  const { broadcastLists, addBroadcastList, updateBroadcastList, deleteBroadcastList } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<BroadcastList | null>(null);
  const [listName, setListName] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openForm = (list?: BroadcastList) => {
    if (list) {
      setEditingList(list);
      setListName(list.name);
      setContacts([...list.contacts]);
    } else {
      setEditingList(null);
      setListName('');
      setContacts([]);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingList(null);
    setListName('');
    setContacts([]);
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleAddContact = () => {
    if (!newContactName || !newContactPhone) return;
    setContacts([...contacts, { id: Date.now().toString(), name: newContactName, phone: newContactPhone }]);
    setNewContactName('');
    setNewContactPhone('');
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newContacts: Contact[] = results.data.map((row: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: row.name || row.Name || 'Unknown',
          phone: row.phone || row.Phone || row.number || row.Number || ''
        })).filter(c => c.phone);
        
        setContacts(prev => [...prev, ...newContacts]);
      }
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveList = () => {
    if (!listName.trim()) return;

    if (editingList) {
      updateBroadcastList(editingList.id, { name: listName, contacts });
    } else {
      addBroadcastList({
        id: Date.now().toString(),
        name: listName,
        contacts,
        createdAt: new Date().toISOString()
      });
    }
    closeForm();
  };

  if (isFormOpen) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={closeForm}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {editingList ? 'Edit Broadcast List' : 'Create Broadcast List'}
          </h2>
        </div>

        <div className="bg-white shadow rounded-xl overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">List Name</label>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., VIP Customers"
              />
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Add Contacts</h4>
              
              {/* Manual Add */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Name"
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <input
                  type="text"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  placeholder="Phone (e.g., 628...)"
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </button>
              </div>

              {/* CSV Upload */}
              <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FileSpreadsheet className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                  Import CSV
                </button>
                <div className="text-sm text-gray-500">
                  <p>Upload a CSV file to bulk import contacts.</p>
                  <p className="text-xs">Required columns: <code className="bg-gray-200 px-1 rounded">name</code>, <code className="bg-gray-200 px-1 rounded">phone</code></p>
                </div>
              </div>
            </div>

            {/* Contacts List */}
            <div className="mt-6 border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Contacts ({contacts.length})</span>
                {contacts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setContacts([])}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {contacts.length === 0 ? (
                  <li className="px-4 py-8 text-sm text-gray-500 text-center">No contacts added yet. Add manually or import from CSV.</li>
                ) : (
                  contacts.map((contact) => (
                    <li key={contact.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                        <p className="text-sm text-gray-500">{contact.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(contact.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveList}
                disabled={!listName.trim() || contacts.length === 0}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Broadcast List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Broadcast Lists</h2>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create List
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-xl">
        <ul className="divide-y divide-gray-200">
          {broadcastLists.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No broadcast lists</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new list.</p>
              <div className="mt-6">
                <button
                  onClick={() => openForm()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create List
                </button>
              </div>
            </li>
          ) : (
            broadcastLists.map((list) => (
              <li key={list.id}>
                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-indigo-600 truncate text-lg">{list.name}</p>
                      </div>
                      <div className="mt-2 flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{list.contacts.length} contacts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-5 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => openForm(list)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Edit List"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => deleteBroadcastList(list.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete List"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
