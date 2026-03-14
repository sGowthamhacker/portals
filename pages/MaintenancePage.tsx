import React, { useState, useEffect } from 'react';
import { GlobalSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { HammerIcon, ClockIcon, CalendarIcon, ShieldAlertIcon, RefreshCwIcon } from 'lucide-react';

interface MaintenancePageProps {
  settings: GlobalSettings | null;
}

const MaintenancePage: React.FC<MaintenancePageProps> = ({ settings }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!settings?.maintenanceEndTime) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(settings.maintenanceEndTime!) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, [settings?.maintenanceEndTime]);

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return null;
    try {
      return new Date(dateTimeStr).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-6 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center border-b border-white/5 bg-white/5 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">System Status: Maintenance Mode</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          NODE_ID: HTW-INFRA-01 // {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center text-center max-w-3xl w-full"
      >
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="mb-10 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <ShieldAlertIcon className="w-16 h-16 text-indigo-500" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic">
          System <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Offline</span>
        </h1>
        
        <div className="h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-8" />

        <p className="text-xl md:text-2xl text-slate-400 mb-12 font-light max-w-2xl leading-relaxed">
          {settings?.maintenanceMessage || "We're currently upgrading our infrastructure to provide you with a better experience."}
        </p>

        {timeLeft && (
          <div className="flex gap-4 md:gap-8 mb-12">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes },
              { label: 'Secs', value: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-2 backdrop-blur-sm">
                  <span className="text-2xl md:text-4xl font-bold font-mono text-indigo-400">
                    {String(item.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-500 font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          {settings?.maintenanceStartTime && (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4 text-left backdrop-blur-sm group hover:bg-white/10 transition-colors">
              <CalendarIcon className="w-6 h-6 text-indigo-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Scheduled Start</p>
                <p className="text-sm text-slate-200 font-medium">{formatDateTime(settings.maintenanceStartTime)}</p>
              </div>
            </div>
          )}
          {settings?.maintenanceEndTime && (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-4 text-left backdrop-blur-sm group hover:bg-white/10 transition-colors">
              <ClockIcon className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estimated Return</p>
                <p className="text-sm text-slate-200 font-medium">{formatDateTime(settings.maintenanceEndTime)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => window.location.reload()}
            className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300"
          >
            <RefreshCwIcon className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-sm font-bold tracking-widest uppercase">Check System Status</span>
          </button>
          
          <div className="h-1.5 w-64 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="h-full w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-10 text-slate-700 text-[10px] uppercase tracking-[0.2em] font-bold">
        &copy; {new Date().getFullYear()} HackToWriteToHack Security Infrastructure
      </div>
    </div>
  );
};

export default MaintenancePage;
