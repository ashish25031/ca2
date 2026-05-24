import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, FileText, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const SharedFileAccess = () => {
    const { token } = useParams();
    const [fileInfo, setFileInfo] = useState(null);
    const [password, setPassword] = useState('');
    const [requirePassword, setRequirePassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAccess();
    }, [token]);

    const checkAccess = async (pwd = '') => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/share/${token}`, { password: pwd });
            setFileInfo(res.data);
            setRequirePassword(false);
        } catch (err) {
            if (err.response?.status === 401 && err.response?.data?.requirePassword) {
                setRequirePassword(true);
            } else {
                setError(err.response?.data?.message || 'Invalid or expired link');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        checkAccess(password);
    };

    const handleDownload = () => {
        if (!fileInfo) return;
        const url = `${API_URL}/share/download/${token}?pwd=${encodeURIComponent(password)}`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileInfo.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return (
            <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                <div className="text-red-500 mb-4"><FileText className="w-16 h-16 mx-auto opacity-50" /></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
            </div>
        );
    }

    if (requirePassword) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-center mb-6">
                    <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Protected File</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This shared file is password protected.</p>
                </div>
                <form onSubmit={handlePasswordSubmit}>
                    <input
                        type="password"
                        required
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 px-4 py-3 mb-4 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition shadow-sm"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center border border-gray-100 dark:border-gray-700">
            <FileText className="w-16 h-16 text-blue-500 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 break-all">{fileInfo?.filename}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{formatSize(fileInfo?.filesize)}</p>
            <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none transition shadow-sm"
            >
                <Download className="w-5 h-5 mr-2" />
                Download File
            </button>
        </div>
    );
};

export default SharedFileAccess;
