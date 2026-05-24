import { useState } from 'react';
import api from '../services/api';
import { X, Copy, Check } from 'lucide-react';

const ShareModal = ({ file, onClose }) => {
    const [password, setPassword] = useState('');
    const [expiry, setExpiry] = useState('');
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleShare = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await api.post(`/share/create/${file.id}`, {
                password: password || undefined,
                expiryHours: expiry || undefined
            });
            setShareUrl(res.data.shareUrl);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create share link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Share "{file.filename}"</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="px-6 py-4">
                    {shareUrl ? (
                        <div className="space-y-4">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Link created successfully!</p>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={shareUrl}
                                    className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                >
                                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500 dark:text-gray-300" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleShare} className="space-y-4">
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password Protection (Optional)
                                </label>
                                <input
                                    type="text"
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                    placeholder="Leave blank for open access"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Expiry Time (Optional)
                                </label>
                                <select
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 dark:bg-gray-700 dark:text-white"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                >
                                    <option value="">Never expires</option>
                                    <option value="1">1 Hour</option>
                                    <option value="24">24 Hours</option>
                                    <option value="168">7 Days</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none transition disabled:opacity-50"
                                >
                                    {loading ? 'Generating...' : 'Generate Link'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
