export default function NotFound() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-600">The page you’re looking for doesn’t exist.</p>
        <a href="/" className="mt-4 inline-block px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium">Go home</a>
      </div>
    </div>
  );
}
