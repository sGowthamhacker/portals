import React from 'react';
import { User, TaskbarPosition } from '../types';
import LogoutIcon from './icons/LogoutIcon';
import SettingsIcon from './icons/SettingsIcon';
import { getCloudinaryUrl } from '../utils/imageService';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onOpenSettings: (e: React.MouseEvent<HTMLButtonElement>) => void;
  position: TaskbarPosition;
  isClosing: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, onOpenSettings, position, isClosing }) => {
  const positionClasses: Record<TaskbarPosition, string> = {
    top: 'top-full mt-2',
    bottom: 'bottom-full mb-2',
    left: 'left-full ml-2',
    right: 'right-full mr-2'
  };

  const alignmentClass = (position === 'left' || position === 'right') ? 'top-0' : 'right-0';
  
  return (
    <div className={`absolute ${positionClasses[position]} ${alignmentClass} w-72 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-[10000] overflow-hidden ${isClosing ? 'animate-slide-down-and-fade' : 'animate-slide-up'}`}>
      <div className="flex flex-col items-center text-center p-6 border-b border-slate-200 dark:border-slate-700/50">
        <img src={getCloudinaryUrl(user.avatar, { width: 80, height: 80, radius: 'max' })} alt={user.name} className="w-20 h-20 rounded-full flex-shrink-0 mb-4 ring-2 ring-offset-2 ring-indigo-500 ring-offset-slate-100 dark:ring-offset-slate-800" />
        <div className="min-w-0">
          <div className="flex items-center justify-center gap-1.5">
            <p className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{user.name}</p>
            {user.role === 'admin' && <img src={getCloudinaryUrl("https://gowthamsportfolio.netlify.app/assets/img/tick.gif", { width: 18, height: 18 })} alt="Admin verified" className="w-4.5 h-4.5" />}
          </div>
          <p className="text-sm font-medium capitalize text-slate-500 dark:text-slate-400 mt-1">{user.role}</p>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <button onClick={onOpenSettings} className="w-full flex items-center gap-4 text-left p-3 text-sm rounded-lg transition-colors text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/70">
          <SettingsIcon className="w-6 h-6 text-slate-500 dark:text-slate-400 flex-shrink-0" />
          <div>
            <p className="font-semibold">Settings</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage account & preferences</p>
          </div>
        </button>
      </div>
      <div className="p-2 border-t border-slate-200 dark:border-slate-700/50">
        <button onClick={onLogout} className="w-full flex items-center gap-4 text-left p-3 text-sm rounded-lg transition-colors group text-slate-700 dark:text-slate-200 hover:bg-red-500/10 dark:hover:bg-red-500/10">
          <LogoutIcon className="w-6 h-6 text-red-500/80 dark:text-red-400/80 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors flex-shrink-0" />
          <span className="font-semibold group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenu;