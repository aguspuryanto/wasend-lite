import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Users, Send, CheckCircle, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { reports, broadcastLists } = useAppContext();

  const totalSent = reports.length;
  const successful = reports.filter(r => r.status === 'sent').length;
  const failed = reports.filter(r => r.status === 'failed').length;
  const totalContacts = broadcastLists.reduce((acc, list) => acc + list.contacts.length, 0);

  const stats = [
    { name: 'Total Messages Sent', value: totalSent, icon: Send, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Successful Deliveries', value: successful, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Failed Deliveries', value: failed, icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
    { name: 'Total Contacts', value: totalContacts, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-xl">
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 rounded-md p-3 ${item.bg}`}>
                    <Icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd>
                        <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {reports.slice(0, 5).length > 0 ? (
            reports.slice(0, 5).map((report) => (
              <div key={report.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {report.recipient}
                  </p>
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
                    <p className="flex items-center text-sm text-gray-500 truncate max-w-md">
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
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
