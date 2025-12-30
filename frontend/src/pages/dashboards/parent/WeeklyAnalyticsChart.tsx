
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { processLogsForWeeklyAnalysis, WeeklyAnalyticsData } from '../../../utils/analyticsHelper';
import parentService, { CharacterLog } from '../../../services/parentService';
import Spinner from '../student/components/Spinner';
import { AlertTriangle } from 'lucide-react';

const WeeklyAnalyticsChart: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<WeeklyAnalyticsData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            try {
                // Ambil seluruh riwayat log
                const allLogs: CharacterLog[] = await parentService.getLogHistory();
                if (allLogs.length === 0) {
                    setAnalyticsData([]); // Tidak ada data untuk ditampilkan
                    return;
                }
                // Proses data untuk grafik
                const processedData = processLogsForWeeklyAnalysis(allLogs, 4); // Analisis 4 minggu terakhir
                setAnalyticsData(processedData);
            } catch (err) {
                setError('Gagal memuat data untuk analisis.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner />
                <span className="ml-2 text-gray-500">Memuat Analisis...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-red-600">
                <AlertTriangle size={32} />
                <p className="mt-2 font-semibold">{error}</p>
            </div>
        );
    }
    
    if (analyticsData.length === 0) {
         return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <p>Belum ada data yang cukup untuk ditampilkan dalam grafik analisis.</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={analyticsData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="weekLabel" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{ fill: 'rgba(230, 240, 255, 0.5)' }}
                        contentStyle={{ 
                            backgroundColor: 'white',
                            borderRadius: '0.75rem', 
                            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                        }} 
                    />
                    <Legend 
                        iconSize={10} 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                    />
                    <Bar dataKey="bangunPagi" name="Bangun Pagi" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tidurMalam" name="Tidur Teratur" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="olahraga" name="Olahraga" fill="#ffc658" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="belajar" name="Belajar" fill="#ff8042" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeeklyAnalyticsChart;
