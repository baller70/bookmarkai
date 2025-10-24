import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            404 - Page Not Found
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The page you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
        <div className="space-y-4">
          <Link
            href="/"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go back home
          </Link>
          <Link
            href="/dashboard"
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
} 