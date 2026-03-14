import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { testConnection } from '../lib/api';
import { Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { apiKey, setApiKey, baseUrl, setBaseUrl } = useAppContext();
  const [keyInput, setKeyInput] = useState(apiKey);
  const [urlInput, setUrlInput] = useState(baseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(keyInput);
    setBaseUrl(urlInput);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await testConnection(urlInput, keyInput);
      setTestResult({
        success: result.success,
        message: result.success ? 'Connection successful!' : `Connection failed: ${result.error}`
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">API Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your WAKita API credentials here.
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-700">
                API Base URL
              </label>
              <input
                type="url"
                id="baseUrl"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border py-2 px-3"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="-ml-1 mr-2 h-5 w-5" />
                Save Settings
              </button>
              
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !keyInput || !urlInput}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <RefreshCw className={`-ml-1 mr-2 h-5 w-5 ${isTesting ? 'animate-spin' : ''}`} />
                Test Connection
              </button>
            </div>

            {saveStatus && (
              <p className="text-sm text-green-600 font-medium">{saveStatus}</p>
            )}

            {testResult && (
              <div className={`p-4 rounded-md flex items-start ${
                testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
