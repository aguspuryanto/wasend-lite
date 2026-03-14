import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Reports() {
  const { reports } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Message Reports</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            History of all sent messages and broadcasts.
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <li className="px-4 py-8 text-center text-gray-500">
              No messages sent yet.
            </li>
          ) : (
            reports.map((report) => (
              <li key={report.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {report.status === 'sent' ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      ) : report.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500 mr-3" />
                      )}
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {report.recipient}
                      </p>
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {report.type}
                      </span>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        report.status === 'sent' ? 'bg-green-100 text-green-800' :
                        report.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {report.message}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
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
