
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
// FIX: Import `Comment` type to resolve type ambiguity with React's global `Comment` DOM interface.
import { User, AppDefinition, WindowInstance, TaskbarPosition, Post, DesktopIconSize, WidgetState, ChatMessage, Comment, Notification } from '../types';
import SettingsIcon from '../components/icons/SettingsIcon';
import PowerIcon from '../components/icons/PowerIcon';
import SearchIcon from '../components/icons/SearchIcon';
import HomePage from './HomePage';
import WriteupPage from './WriteupPage';
import ChatPage from './ChatPage';
import SettingsPage from './SettingsPage';
import SearchPage from './SearchPage';
import NotesPage from './NotesPage';
import TodolistPage from './TodolistPage';
import Window from '../components/Window';
import DesktopIcon from '../components/DesktopIcon';
import HomeIcon from '../components/icons/HomeIcon';
import WriteupIcon from '../components/icons/WriteupIcon';
import ChatIcon from '../components/icons/ChatIcon';
import BlogIcon from '../components/icons/BlogIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import useLocalStorage from '../hooks/useLocalStorage';
import Taskbar from '../components/Taskbar';
import { useNotificationState } from '../contexts/NotificationContext';
import DesktopWidgets from '../components/DesktopWidgets';
import AdminIcon from '../components/icons/AdminIcon';
// FIX: Changed to a named import to resolve module loading error.
import { AdminDashboardPage } from './AdminDashboardPage';
import InstallPWAButton from '../components/InstallPWAButton';
import BlogPage from './BlogPage';
import NotificationCenterPage from './NotificationCenterPage';
import NotificationBellIcon from '../components/icons/NotificationBellIcon';
import { useTheme } from '../contexts/ThemeContext';
import { getCloudinaryUrl } from '../utils/imageService';
import { getChatMessages, addChatMessage, updateChatMessage, deleteChatMessage, clearChatMessages, isUsingMockData } from '../services/database';
import ClockIcon from '../components/icons/ClockIcon';
import ConfirmationModal from '../components/ConfirmationModal';
import PlusIcon from '../components/icons/PlusIcon';
import NotesIcon from '../components/icons/NotesIcon';
import TodolistIcon from '../components/icons/TodolistIcon';
import CheckIcon from '../components/icons/CheckIcon';
import PencilIcon from '../components/icons/PencilIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import SpinnerIcon from '../components/icons/SpinnerIcon';
import NotFoundPage from './NotFoundPage';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import MyWorkPage from './MyWorkPage';
import SleepModeSwitch from '../components/SleepModeSwitch';
import SleepScreen from '../components/SleepScreen';
import ResourcesIcon from '../components/icons/ResourcesIcon';
import ResourcesPage from './ResourcesPage';
import KaliIcon from '../components/icons/KaliIcon';
import KaliPage from './KaliPage';
import DocIcon from '../components/icons/DocIcon';
import DocPage from './DocPage';
import ScaleIcon from '../components/icons/ScaleIcon';
import CopyrightPage from './CopyrightPage';
import UserCircleIcon from '../components/icons/UserCircleIcon';
import HabitTrackerIcon from '../components/icons/HabitTrackerIcon';
import HabitTrackerPage from './HabitTrackerPage';
import ResumeAIPage from './ResumeAIPage';


/*
== Supabase Migration for 2FA & Persistent Desktop ==

-- 1. Enable 2FA
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Add backup codes
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS backup_codes TEXT[];

-- 3. Fix for "column users.wallpaper does not exist"
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wallpaper TEXT;

-- 4. Persistent Desktop Placement
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS desktop_preferences JSONB DEFAULT '{}'::jsonb;

-- 5. Helper for backup codes (Optional but good for backfilling)
CREATE OR REPLACE FUNCTION generate_alphanumeric_code(length INTEGER)
RETURNS TEXT AS $$
DECLARE
  chars TEXT[] := '{A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,0,1,2,3,4,5,6,7,8,9}';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  IF length < 1 THEN
      RAISE EXCEPTION 'Invalid length';
  END IF;
  FOR i IN 1..length LOOP
      result := result || chars[1+floor(random() * 36)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
*/

const GUEST_USER: User = { 
  id: 'guest',
  name: 'Guest User', 
  email: 'guest@example.com', 
  role: 'user', 
  avatar: `https://i.pravatar.cc/150?u=guest`, 
  writeup_access: 'none',
  status: 'unverified',
  created_at: '2024-01-01T00:00:00.000Z',
  admin_verified: false,
};

// New component for Start Menu content
const StartMenuContent: React.FC<{
    onSearch: (query: string) => void;
    pinnedAppIds: string[];
    setPinnedAppIds: (ids: string[] | ((val: string[]) => string[])) => void;
    allApps: AppDefinition[];
    onOpenApp: (appId: string, e?: React.MouseEvent<HTMLButtonElement>) => void;
    user: User;
    onLogout: () => void;
    onClose: () => void;
    searchablePosts: Post[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    isWorkMode: boolean;
    onToggleWorkMode: () => void;
}> = React.memo(({ onSearch, pinnedAppIds, setPinnedAppIds, allApps, onOpenApp, user, onLogout, onClose, searchablePosts, addNotification, isWorkMode, onToggleWorkMode }) => {
    const [query, setQuery] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    
    const handleAppClick = (appId: string, e: React.MouseEvent<HTMLButtonElement>) => {
        onOpenApp(appId, e);
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };
    
    const normalizedQuery = query.toLowerCase().trim();
    const filteredApps = normalizedQuery ? allApps.filter(app => app.name.toLowerCase().includes(normalizedQuery)) : [];
    const filteredPosts = normalizedQuery ? searchablePosts.filter(post => post.title.toLowerCase().includes(normalizedQuery) || post.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))) : [];
    const hasResults = filteredApps.length > 0 || filteredPosts.length > 0;

    const pinnedApps = useMemo(() => allApps.filter(app => pinnedAppIds.includes(app.id)), [allApps, pinnedAppIds]);

    return (
        <div className="flex flex-col h-full bg-slate-200/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden">
            <div className="p-4 flex-shrink-0">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 dark:text-slate-400" />
                    <input 
                        type="search" 
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            if (isEditMode) setIsEditMode(false);
                        }}
                        placeholder="Type here to search" 
                        className="w-full bg-black/5 dark:bg-white/5 rounded-full h-12 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/10 dark:focus:bg-white/10" 
                        autoFocus
                    />
                </form>
            </div>
            <div className="flex-1 px-4 sm:px-6 pb-4 overflow-y-auto">
                {normalizedQuery ? (
                    <div className="animate-fade-in">
                        {hasResults ? (
                            <div className="space-y-6">
                                {filteredApps.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 px-1">Applications</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                            {filteredApps.map(app => (
                                                <button key={app.id} onClick={(e) => handleAppClick(app.id, e)} className="flex items-center gap-4 p-3 rounded-lg text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-300 dark:bg-slate-700">
                                                        {React.cloneElement(app.icon, {className: 'w-5 h-5'})}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{app.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {filteredPosts.length > 0 && (
                                    <section>
                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 px-1">Writeups</h3>
                                        <div className="space-y-1">
                                            {filteredPosts.slice(0, 5).map(post => (
                                                <button key={post.id} onClick={(e) => handleAppClick('writeup', e)} className="w-full text-left p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{post.title}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">By {post.author.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500 dark:text-slate-400">No results for "{query}"</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3 px-1">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pinned</h3>
                                <button onClick={() => setIsEditMode(!isEditMode)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors">
                                    <PencilIcon className="w-3 h-3" />
                                    <span>{isEditMode ? 'Done' : 'Edit'}</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-4">
                                {pinnedApps.map(app => (
                                    <div key={app.id} className="relative">
                                        <button 
                                            onClick={(e) => { if (!isEditMode) handleAppClick(app.id, e); }} 
                                            className={`flex flex-col items-center justify-start text-center p-2 rounded-lg transition-colors group aspect-square w-full ${isEditMode ? 'cursor-default' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                        >
                                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 shadow-md mb-2">
                                                {React.cloneElement(app.icon, {className: 'w-7 h-7'})}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 mt-1 break-words leading-tight">{app.name}</span>
                                        </button>
                                        {isEditMode && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPinnedAppIds(ids => ids.filter(id => id !== app.id));
                                                }}
                                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md transform transition-transform hover:scale-110 animate-pop-in"
                                                title={`Unpin ${app.name}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 px-1">All Apps</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {allApps.map(app => {
                                    const isPinned = pinnedAppIds.includes(app.id);
                                    return (
                                        <div key={app.id} className="relative">
                                            <button 
                                                onClick={(e) => { if (!isEditMode) handleAppClick(app.id, e); }} 
                                                className={`w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors ${isEditMode ? 'cursor-default' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                            >
                                                <div className="w-8 h-8 rounded-md flex items-center justify-center bg-slate-300 dark:bg-slate-700">
                                                    {React.cloneElement(app.icon, {className: 'w-5 h-5'})}
                                                </div>
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{app.name}</span>
                                            </button>
                                             {isEditMode && (
                                                <>
                                                    {!isPinned ? (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (pinnedAppIds.length >= 12) {
                                                                    addNotification({ title: 'Limit Reached', message: 'You can pin a maximum of 12 apps.', type: 'warning' });
                                                                    return;
                                                                }
                                                                setPinnedAppIds(ids => [...ids, app.id]);
                                                            }}
                                                            className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md transform transition-transform hover:scale-110 animate-pop-in"
                                                            title={`Pin ${app.name}`}
                                                        >
                                                            <PlusIcon className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <div className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 bg-slate-400 dark:bg-slate-600 text-white rounded-full flex items-center justify-center shadow-md animate-pop-in" title="Pinned">
                                                            <CheckIcon className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
            <div className="mt-auto p-3 border-t border-slate-300/50 dark:border-slate-700/50 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <button onClick={(e) => handleAppClick('settings', e)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-left group" title="Settings">
                        <img src={getCloudinaryUrl(user.avatar, { width: 44, height: 44, radius: 'max' })} alt={user.name} className="w-11 h-11 rounded-full transition-transform group-hover:scale-105" />
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-base text-slate-800 dark:text-slate-100 leading-none">{user.name}</span>
                            {user.role === 'admin' && <img src={getCloudinaryUrl("https://gowthamsportfolio.netlify.app/assets/img/tick.gif", { width: 16, height: 16 })} alt="Admin verified" className="w-4 h-4" />}
                        </div>
                    </button>

                    <div className="flex items-center gap-3">
                        <SleepModeSwitch isWorkMode={isWorkMode} onToggle={onToggleWorkMode} scale={0.25} />
                        <button onClick={onLogout} className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-300/70 dark:bg-slate-700/50 hover:bg-red-500 group transition-colors" title="Sign out">
                            <PowerIcon className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// FIX: Define helper function to get icon size in pixels.
const getIconSizePixels = (size: DesktopIconSize): number => {
    switch (size) {
        case 'small': return 80;
        case 'medium': return 96;
        case 'large': return 112;
        default: return 96;
    }
};

interface DashboardPageProps {
  user: User | null;
  allUsers: User[];
  writeups: Post[];
  blogPosts: Post[];
  setAllUsers: (value: User[] | ((val: User[]) => User[])) => void; // Kept for Admin for now
  onLogout: () => void;
  onSendFriendRequest: (fromUser: User, toUserEmail: string) => Promise<void>;
  onAcceptFriendRequest: (requestor: { email: string; name: string; }) => Promise<void>;
  onRejectFriendRequest: (requestor: { email: string; name: string; }) => Promise<void>;
  onRemoveFriend: (friendToRemove: { email: string; name: string; }) => Promise<void>;
  onProfileUpdate: (email: string, updatedData: Partial<User>, silent?: boolean) => Promise<void>;
  onSavePost: (post: Post | Omit<Post, 'id' | 'created_at' | 'author' | 'comments' | 'liked_by'>, type: 'writeup' | 'blog') => Promise<Post | null>;
  onDeletePost: (postId: string, type: 'writeup' | 'blog') => Promise<void>;
  onLikePost: (post: Post, liker: User) => Promise<void>;
  onAddCommentToPost: (post: Post, commentText: string) => Promise<void>;
  onDeleteCommentFromPost: (post: Post, commentId: string) => Promise<void>;
  onRequestWriteupAccess: () => void;
  onApproveWriteupAccess: (requestor: { email: string; name: string; }) => Promise<void>;
  onRejectWriteupAccess: (requestor: { email: string; name: string; }) => Promise<void>;
  onDeleteAccount: () => Promise<string | void>;
  onVerifyPassword: (password: string) => Promise<boolean>;
  onEmailChange: (newEmail: string) => Promise<string | void>;
  isSyncingProfile: boolean;
}

const baseApps: AppDefinition[] = [
  { id: 'home', name: 'Home', icon: <HomeIcon />, component: HomePage, bgColorClass: 'bg-sky-500', accentColor: '#0ea5e9' },
  { id: 'mywork', name: 'My Work', icon: <BriefcaseIcon />, component: MyWorkPage, bgColorClass: 'bg-pink-500', accentColor: '#ec4899' },
  { id: 'writeup', name: 'Writeups', icon: <WriteupIcon />, component: WriteupPage, bgColorClass: 'bg-indigo-500', accentColor: '#6366f1' },
  { id: 'blog', name: 'Blog', icon: <BlogIcon />, component: BlogPage, bgColorClass: 'bg-cyan-500', accentColor: '#06b6d4' },
  { id: 'consistency', name: 'Consistency', icon: <HabitTrackerIcon />, component: HabitTrackerPage, bgColorClass: 'bg-emerald-500', accentColor: '#10b981' },
  { id: 'resumeai', name: 'Resume AI', icon: <SparklesIcon />, component: ResumeAIPage, bgColorClass: 'bg-purple-500', accentColor: '#a855f7' },
  { id: 'resources', name: 'Resources', icon: <ResourcesIcon />, component: ResourcesPage, bgColorClass: 'bg-orange-500', accentColor: '#f97316' },
  { id: 'kali', name: 'Kali Linux', icon: <KaliIcon />, component: KaliPage, bgColorClass: 'bg-slate-900', accentColor: '#000000' },
  { id: 'chat', name: 'Community Chat', icon: <ChatIcon />, component: ChatPage, bgColorClass: 'bg-emerald-500', accentColor: '#10b981' },
  { id: 'notes', name: 'Notes', icon: <NotesIcon />, component: NotesPage, bgColorClass: 'bg-amber-500', accentColor: '#f59e0b' },
  { id: 'todolist', name: 'To-Do List', icon: <TodolistIcon />, component: TodolistPage, bgColorClass: 'bg-lime-500', accentColor: '#84cc16' },
  { id: 'settings', name: 'Settings', icon: <SettingsIcon />, component: SettingsPage, bgColorClass: 'bg-slate-600', accentColor: '#475569' },
  { id: 'docs', name: 'Docs', icon: <DocIcon />, component: DocPage, bgColorClass: 'bg-slate-200', accentColor: '#94a3b8' },
];

const internalApps: AppDefinition[] = [
    { id: 'search', name: 'Search', icon: <SearchIcon className="text-gray-500"/>, component: SearchPage, bgColorClass: 'bg-slate-500', accentColor: '#64748b' },
    { id: 'start', name: 'Start Menu', icon: <SparklesIcon />, component: StartMenuContent, bgColorClass: 'bg-slate-800', accentColor: '#1e293b' },
    { id: 'admin', name: 'Admin Panel', icon: <AdminIcon />, component: AdminDashboardPage, bgColorClass: 'bg-amber-500', accentColor: '#f59e0b' },
    { id: 'notifications', name: 'Notifications', icon: <NotificationBellIcon />, component: NotificationCenterPage, bgColorClass: 'bg-blue-500', accentColor: '#3b82f6' },
    { id: 'copyright', name: 'Legal', icon: <ScaleIcon />, component: CopyrightPage, bgColorClass: 'bg-slate-200', accentColor: '#475569' },
    { id: 'about', name: 'Profile', icon: <UserCircleIcon />, component: MyWorkPage, bgColorClass: 'bg-indigo-500', accentColor: '#6366f1' },
];

const defaultPinnedApps = ['home', 'mywork', 'consistency', 'resumeai', 'writeup', 'blog', 'resources', 'kali', 'chat', 'notes', 'todolist', 'docs'];

const parseHash = (hash: string): { appId: string | null; deepLinkInfo: string | null } => {
    // Remove # and optional leading /
    const cleanPath = hash.replace(/^#\/?/, ''); 
    if (!cleanPath) return { appId: null, deepLinkInfo: null };

    const [appId, ...rest] = cleanPath.split('/');
    const deepLinkInfo = rest.join('/');

    return { appId: appId || null, deepLinkInfo: deepLinkInfo || null };
};


const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const { 
        user, allUsers, writeups, blogPosts, setAllUsers, onLogout, 
        onSendFriendRequest, onAcceptFriendRequest, onRejectFriendRequest, onRemoveFriend, 
        onProfileUpdate,
        onSavePost, onDeletePost, onLikePost, onAddCommentToPost, onDeleteCommentFromPost,
        onRequestWriteupAccess, onApproveWriteupAccess, onRejectWriteupAccess,
        onDeleteAccount, onVerifyPassword, onEmailChange,
        isSyncingProfile
    } = props;

    const currentUser = user || GUEST_USER;
    const { themeStyle } = useTheme();
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [isRestored, setIsRestored] = useState(false);
    const nextZIndex = useRef(10);
    const boundsRef = useRef<HTMLDivElement>(null);
    const startButtonRef = useRef<HTMLButtonElement>(null);
    
    const [isWorkMode, setIsWorkMode] = useState(true);

    // --- Separate Desktop/Mobile Icon Positions ---
    // We use two separate states for positions to avoid layout conflicts
    const [desktopIconPositions, setDesktopIconPositions] = useLocalStorage<Record<string, { x: number, y: number }>>(`desktop-icon-positions-${currentUser.id}`, {});
    const [mobileIconPositions, setMobileIconPositions] = useLocalStorage<Record<string, { x: number, y: number }>>(`mobile-icon-positions-${currentUser.id}`, {});
    
    const [activeIconId, setActiveIconId] = useState<string | null>(null);

    const [taskbarPosition, setTaskbarPosition] = useLocalStorage<TaskbarPosition>('taskbarPosition', 'bottom');
    const [pinnedAppIds, setPinnedAppIds] = useLocalStorage<string[]>(`pinnedAppIds-${currentUser.id}`, defaultPinnedApps);
    
    // Ensure resumeai is pinned for existing users who might have saved their layout before it was added
    useEffect(() => {
        if (!pinnedAppIds.includes('resumeai')) {
            setPinnedAppIds(prev => [...prev, 'resumeai']);
        }
    }, [pinnedAppIds, setPinnedAppIds]);

    const [desktopIconSize, setDesktopIconSize] = useLocalStorage<DesktopIconSize>('desktopIconSize', 'medium');
    
    const [desktopWidgetState, setDesktopWidgetState] = useLocalStorage<WidgetState | null>(`desktopWidgetState-${currentUser.id}`, null);
    const [mobileWidgetState, setMobileWidgetState] = useLocalStorage<WidgetState | null>(`mobileWidgetState-${currentUser.id}`, null);
    
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [liveUsers, setLiveUsers] = useState<any[]>([]);

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isPendingBannerVisible, setIsPendingBannerVisible] = useState(true);
    const [isBannerClosing, setIsBannerClosing] = useState(false);
    
    const [desktopDimensions, setDesktopDimensions] = useState({ width: 0, height: 0 });
    
    // Create refs for states needed in saveDesktopPreferences to stabilize its dependencies
    const desktopIconPositionsRef = useRef(desktopIconPositions);
    desktopIconPositionsRef.current = desktopIconPositions;
    const mobileIconPositionsRef = useRef(mobileIconPositions);
    mobileIconPositionsRef.current = mobileIconPositions;
    const pinnedAppIdsRef = useRef(pinnedAppIds);
    pinnedAppIdsRef.current = pinnedAppIds;
    const desktopWidgetStateRef = useRef(desktopWidgetState);
    desktopWidgetStateRef.current = desktopWidgetState;
    const mobileWidgetStateRef = useRef(mobileWidgetState);
    mobileWidgetStateRef.current = mobileWidgetState;
    const currentUserRef = useRef(currentUser);
    currentUserRef.current = currentUser;
    const onProfileUpdateRef = useRef(onProfileUpdate);
    onProfileUpdateRef.current = onProfileUpdate;
    
    const isMobile = desktopDimensions.width > 0 && desktopDimensions.width <= 768;
    const wasMobile = useRef(isMobile);
    
    // Select appropriate state based on current view mode
    const widgetState = isMobile ? mobileWidgetState : desktopWidgetState;
    const setWidgetState = isMobile ? setMobileWidgetState : setDesktopWidgetState;
    
    const currentIconPositions = isMobile ? mobileIconPositions : desktopIconPositions;
    const setIconPositions = isMobile ? setMobileIconPositions : setDesktopIconPositions;

    const isPending = currentUser.status === 'pending';

    const [urlState, setUrlState] = useState(parseHash(window.location.hash));

    const isStartMenuOpen = urlState.appId === 'start';
    
    const activeWindow = useMemo(() => {
        const topWindow = windows
            .filter(w => !w.isMinimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0];
        return topWindow || null;
    }, [windows]);
    
    const activeWindowId = activeWindow?.id || null;

    const isAnyWindowMaximized = useMemo(() => {
        return !!activeWindow && activeWindow.isMaximized;
    }, [activeWindow]);

    const apps = useMemo(() => {
        let allAvailableApps = [...baseApps, ...internalApps];

        if (currentUser.role !== 'admin') {
            allAvailableApps = allAvailableApps.filter(app => app.id !== 'admin');
        }

        if (isPending) {
            const restrictedAppIds = ['writeup', 'chat'];
            allAvailableApps = allAvailableApps.filter(app => !restrictedAppIds.includes(app.id));
        }
        return allAvailableApps;
    }, [currentUser.role, isPending]);

    const userApps = useMemo(() => apps.filter(app => !['search', 'start', 'blog-viewer'].includes(app.id)), [apps]);
    
    const { addNotification, notifications } = useNotificationState();
    
    const handleNavigate = useCallback((path: string) => {
        // Ensure path doesn't start with # or / for composition
        const cleanPath = path.replace(/^#\/?/, '');
        const newHash = `#/${cleanPath}`;
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        } else {
             setUrlState(parseHash(window.location.hash));
        }
    }, []);

    const closeWindow = useCallback((id: string) => {
        setWindows(prevWindows => {
            const windowToClose = prevWindows.find(w => w.id === id);
            if (!windowToClose) return prevWindows;
    
            const wasActive = activeWindowId === id;
    
            // Set closing animation
            const windowsWithClosing = prevWindows.map(w => (w.id === id ? { ...w, isClosing: true } : w));
    
            // After animation, remove window and update URL if necessary
            setTimeout(() => {
                setWindows(currentWindows => {
                    const remainingWindows = currentWindows.filter(w => w.id !== id);
    
                    if (wasActive) {
                        const nextTopWindow = remainingWindows
                            .filter(w => !w.isMinimized)
                            .sort((a, b) => b.zIndex - a.zIndex)[0];
                        
                        handleNavigate(nextTopWindow ? nextTopWindow.appId : '');
                    }
                    
                    return remainingWindows;
                });
            }, 250);
    
            return windowsWithClosing;
        });
    }, [activeWindowId, handleNavigate]);
    
    const handleOpenAppFromWindow = useCallback((appId: string, props: Record<string, any> = {}, e?: React.MouseEvent<HTMLElement>) => {
        let path = appId;
        if ((appId === 'writeup' || appId === 'blog') && props.deepLinkInfo) {
            path = `${appId}/${props.deepLinkInfo}`;
        }
        if (appId === 'about' && props.profileUserEmail) {
            // Encode the email to be URL safe for the deep link
            // We use a custom separator or structure if needed, but simple appending works for now.
            // However, the `parseHash` logic might interpret email as deepLinkInfo.
            // Let's pass it via props in window state instead of URL to avoid complex routing for now, 
            // OR use a query param style if supported.
            // Current `handleNavigate` sets hash. Let's stick to using the window props for 'about' app context.
            // But `handleNavigate` changes the URL which triggers `useEffect` to open window.
            // So we need to encode state into URL or manage it via window props directly.
            
            // For 'about' app, let's use the URL: #/about/email
            path = `${appId}/${props.profileUserEmail}`;
        }
        handleNavigate(path);
    }, [handleNavigate]);

    const handleProfileUpdateForWindows = useCallback((email: string, data: Partial<User>) => {
        onProfileUpdate(email, data);
    }, [onProfileUpdate]);

    const handleSettingsProfileUpdate = useCallback((data: Partial<User>, silent?: boolean) => {
        onProfileUpdate(currentUser.email, data, silent);
    }, [onProfileUpdate, currentUser.email]);

    const handleSaveWriteup = useCallback((post: any) => onSavePost(post, 'writeup'), [onSavePost]);
    const handleSaveBlog = useCallback((post: any) => onSavePost(post, 'blog'), [onSavePost]);

    // --------------------------------------------------------------------------------
    // SYNC DESKTOP PREFERENCES LOGIC
    // --------------------------------------------------------------------------------
    
    const saveDesktopPreferences = useCallback((
        overrides: {
            desktopIcons?: Record<string, {x: number, y: number}>;
            mobileIcons?: Record<string, {x: number, y: number}>;
            desktopWidget?: WidgetState | null;
            mobileWidget?: WidgetState | null;
            pinned?: string[];
        } = {}
    ) => {
        const currentProfileUser = currentUserRef.current;
        const currentOnProfileUpdate = onProfileUpdateRef.current;

        if (!currentProfileUser || isUsingMockData()) return;
        
        const dIcons = overrides.desktopIcons || desktopIconPositionsRef.current;
        const mIcons = overrides.mobileIcons || mobileIconPositionsRef.current;
        const dWidget = overrides.desktopWidget !== undefined ? overrides.desktopWidget : desktopWidgetStateRef.current;
        const mWidget = overrides.mobileWidget !== undefined ? overrides.mobileWidget : mobileWidgetStateRef.current;
        const pinned = overrides.pinned || pinnedAppIdsRef.current;

        const newPrefs = {
            iconPositions: dIcons,
            mobileIconPositions: mIcons,
            widgetState: dWidget,
            mobileWidgetState: mWidget,
            pinnedAppIds: pinned
        };
        currentOnProfileUpdate(currentProfileUser.email, { desktop_preferences: newPrefs }, true);
    }, []);


    useEffect(() => {
        if (currentUser.desktop_preferences) {
            const prefs = currentUser.desktop_preferences;
            if (prefs.iconPositions) {
                setDesktopIconPositions(prev => ({ ...prev, ...prefs.iconPositions }));
            }
            if (prefs.mobileIconPositions) {
                setMobileIconPositions(prev => ({ ...prev, ...prefs.mobileIconPositions }));
            }
            if (prefs.widgetState) {
                setDesktopWidgetState(prefs.widgetState);
            }
            if (prefs.mobileWidgetState) {
                setMobileWidgetState(prefs.mobileWidgetState);
            }
            if (prefs.pinnedAppIds) {
                setPinnedAppIds(prefs.pinnedAppIds);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser.desktop_preferences]);


    const handleIconPositionChange = (appId: string, pos: { x: number, y: number }) => {
        if (isMobile) {
             setMobileIconPositions(prev => {
                const newPositions = { ...prev, [appId]: pos };
                saveDesktopPreferences({ mobileIcons: newPositions });
                return newPositions;
             });
        } else {
             setDesktopIconPositions(prev => {
                const newPositions = { ...prev, [appId]: pos };
                saveDesktopPreferences({ desktopIcons: newPositions });
                return newPositions;
             });
        }
    };

    const handleWidgetStateChange = (newState: WidgetState) => {
        if (isMobile) {
            setMobileWidgetState(newState);
            saveDesktopPreferences({ mobileWidget: newState });
        } else {
            setDesktopWidgetState(newState);
            saveDesktopPreferences({ desktopWidget: newState });
        }
    };
    
    const handleSetPinnedApps = useCallback((newIds: string[] | ((val: string[]) => string[])) => {
        setPinnedAppIds(prev => {
            const resolvedIds = typeof newIds === 'function' ? newIds(prev) : newIds;
            saveDesktopPreferences({ pinned: resolvedIds });
            return resolvedIds;
        });
    }, [setPinnedAppIds, saveDesktopPreferences]);

    // --------------------------------------------------------------------------------

    useEffect(() => {
        // Mock live users
        setLiveUsers([]);
    }, [currentUser]);

    useEffect(() => {
        const handleLocationChange = () => {
            setUrlState(parseHash(window.location.hash));
        };
        window.addEventListener('hashchange', handleLocationChange);
        handleLocationChange();
        
        return () => {
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []);

    useEffect(() => {
        try {
            const savedWindowsJSON = sessionStorage.getItem('htwth-open-windows');
            const savedZIndexJSON = sessionStorage.getItem('htwth-next-z-index');

            if (savedWindowsJSON) {
                const serializableWindows = JSON.parse(savedWindowsJSON);
                
                if (Array.isArray(serializableWindows)) {
                    const rehydratedWindows = serializableWindows.map((win: any) => {
                        const appDef = apps.find(app => app.id === win.appId);
                        if (!appDef) return null;
                        return {
                            ...win,
                            title: appDef.name,
                            icon: appDef.icon,
                            isClosing: false,
                            refreshKey: 0,
                        };
                    }).filter((w): w is WindowInstance => w !== null);
                    
                    setWindows(rehydratedWindows);

                    if (savedZIndexJSON) {
                        nextZIndex.current = JSON.parse(savedZIndexJSON);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to restore session state:", e);
            sessionStorage.removeItem('htwth-open-windows');
            sessionStorage.removeItem('htwth-next-z-index');
        }
        
        setIsRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apps]);

    useEffect(() => {
        if (isRestored) {
            const serializableWindows = windows.map(({ icon, ...rest }) => rest);
            sessionStorage.setItem('htwth-open-windows', JSON.stringify(serializableWindows));
            sessionStorage.setItem('htwth-next-z-index', JSON.stringify(nextZIndex.current));
        }
    }, [windows, isRestored]);

    useEffect(() => {
        if (!isRestored) return;

        const { appId: targetAppIdFromUrl, deepLinkInfo } = urlState;
        const targetAppId = targetAppIdFromUrl === 'dashboard' ? 'home' : targetAppIdFromUrl;
        const appDef = apps.find(app => app.id === targetAppId);

        if (targetAppId && !appDef) {
            return;
        }

        if (!targetAppId || !appDef) {
            return;
        }

        const existingWindow = windows.find(w => w.appId === targetAppId);

        if (existingWindow) {
            setWindows(currentWindows => 
                currentWindows.map(win => {
                    if (win.id === existingWindow.id) {
                        return {
                            ...win,
                            isMinimized: false,
                            zIndex: nextZIndex.current++,
                            props: { ...(win.props || {}), deepLinkInfo },
                            refreshKey: win.appId === 'search' ? win.refreshKey + 1 : win.refreshKey,
                        };
                    }
                    return win;
                })
            );
        } else {
            const parentEl = boundsRef.current;
            if (!parentEl) return;

            const { offsetWidth: availableWidth, offsetHeight: availableHeight } = parentEl;
            
            const isStartMenu = targetAppId === 'start';
            const isMobileSize = availableWidth <= 768;

            let defaultWidth = isStartMenu
                ? isMobileSize ? Math.min(availableWidth * 0.9, 450) : 550
                : Math.min(800, availableWidth * 0.8);

            // Start Menu height logic to ensure visibility
            let defaultHeight = isStartMenu
                ? isMobileSize ? Math.min(availableHeight * 0.8, 600) : 650 // Keep nice height but responsive
                : Math.min(600, availableHeight * 0.8);

            let defaultX = Math.max(0, (availableWidth - defaultWidth) / 2);
            let defaultY = Math.max(0, (availableHeight - defaultHeight) / 2);

            // Anchor Start Menu to bottom if taskbar is at bottom (improves mobile UX)
            if (isStartMenu && taskbarPosition === 'bottom') {
                const taskbarHeight = 60; // Approx height
                const margin = 16; // Increased margin for safety
                
                // Calculate maximum available height to avoid clipping
                // Crucial: Subtract margin twice (top/bottom) + taskbar
                const maxAvailableHeight = availableHeight - taskbarHeight - (margin * 2);
                
                // If the default height is taller than available space, constrain it
                if (defaultHeight > maxAvailableHeight) {
                    defaultHeight = Math.max(300, maxAvailableHeight);
                }

                // Position at bottom with margin from taskbar
                defaultY = availableHeight - defaultHeight - taskbarHeight - margin;
                
                // Ensure it doesn't go off top
                if (defaultY < margin) defaultY = margin;
            }

            const newWindow: WindowInstance = {
                id: `${targetAppId}-${Date.now()}`,
                appId: targetAppId,
                title: appDef.name,
                icon: appDef.icon,
                width: defaultWidth, height: defaultHeight,
                x: defaultX,
                y: defaultY,
                zIndex: nextZIndex.current++,
                isMinimized: false, isMaximized: false, isClosing: false,
                props: { deepLinkInfo },
                refreshKey: 0,
            };
            
            setWindows(currentWindows => [...currentWindows, newWindow]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlState, isRestored, apps, taskbarPosition]); // Added taskbarPosition dependency

    const openApp = useCallback((appId: string, props: Record<string, any> = {}, initialBounds?: DOMRect) => {
        if (appId === 'about' && props.profileUserEmail) {
            handleNavigate(`${appId}/${props.profileUserEmail}`);
        } else {
            handleNavigate(appId);
        }
    }, [handleNavigate]);

    useEffect(() => {
        const fetchAndSubscribe = async () => {
            const initialMessages = await getChatMessages();
            setChatMessages(initialMessages);

            if (isUsingMockData()) return;

            // Supabase real-time logic removed.
            // In a real Firebase app, you would use onSnapshot here.
        };

        fetchAndSubscribe();
    }, [allUsers]);

    const handleSendMessage = useCallback(async (text: string, replyToMessage?: ChatMessage) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: ChatMessage = {
            id: tempId,
            author: currentUser,
            text,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString(),
            status: 'sending',
            reply_to: replyToMessage ? {
                id: replyToMessage.id,
                authorName: replyToMessage.author.name,
                text: replyToMessage.text,
            } : undefined,
        };
    
        setChatMessages(prev => [...prev, optimisticMessage]);
    
        try {
            const messageForDb: Omit<ChatMessage, 'id' | 'created_at'> = {
                author: currentUser,
                text,
                timestamp: optimisticMessage.timestamp,
                status: 'sent',
                reply_to: optimisticMessage.reply_to,
            };
            
            const realMessage = await addChatMessage(messageForDb);
    
            if (realMessage) {
                setChatMessages(prev => prev.map(msg => (msg.id === tempId ? realMessage : msg)));
            } else {
                throw new Error("Message failed to send; server returned null.");
            }
    
        } catch (error) {
            console.error("Failed to send message:", error);
            setChatMessages(prev => prev.map(msg => msg.id === tempId ? { ...msg, status: 'failed' } : msg));
            addNotification({
                title: "Send Error",
                message: "Your message could not be sent. Please try again.",
                type: "error",
            });
        }
    }, [currentUser, addNotification]);

    const handleEditMessage = useCallback(async (messageId: string, newText: string) => {
        const newTimestamp = new Date().toISOString();
        const optimisticUpdate = { text: newText, edited_timestamp: newTimestamp };
    
        setChatMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, ...optimisticUpdate } : msg));
    
        const updatedMessage = await updateChatMessage(messageId, optimisticUpdate);
    
        if (!updatedMessage) {
            addNotification({ title: "Edit Failed", message: "Could not save your changes.", type: "error" });
        } else if (isUsingMockData()) {
            setChatMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        }
    }, [addNotification]);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        const originalMessages = chatMessages;
        setChatMessages(prev => prev.filter(msg => msg.id !== messageId));

        try {
            const success = await deleteChatMessage(messageId);
            if (!success) {
                throw new Error("Database deletion failed.");
            }
        } catch (error) {
            console.error("Failed to delete message, reverting UI.", error);
            addNotification({ title: "Delete Failed", message: "Could not delete the message.", type: "error" });
            setChatMessages(originalMessages);
        }
    }, [addNotification, chatMessages]);

    const handleReaction = useCallback(async (messageId: string, emoji: string) => {
        const originalMessage = chatMessages.find(m => m.id === messageId);
        if (!originalMessage) return;

        const newReactions: any = JSON.parse(JSON.stringify(originalMessage.reactions || {}));
        const castedReactions = newReactions as Record<string, string[]>;
        
        const reactedUsers = castedReactions[emoji] || [];
        const userHasReacted = reactedUsers.includes(currentUser.email);

        if (userHasReacted) {
            const updatedUsers = reactedUsers.filter((email) => email !== currentUser.email);
            if (updatedUsers.length === 0) {
                delete castedReactions[emoji];
            } else {
                castedReactions[emoji] = updatedUsers;
            }
        } else {
            castedReactions[emoji] = [...reactedUsers, currentUser.email];
        }

        setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: castedReactions } : m));
    
        const updatedMessage = await updateChatMessage(messageId, { reactions: castedReactions });
        
        if (!updatedMessage) {
            setChatMessages(prev => prev.map(m => m.id === messageId ? originalMessage : m));
            addNotification({
                title: 'Reaction Failed',
                message: 'Your reaction could not be saved.',
                type: 'error',
            });
        } else if (isUsingMockData()) {
            setChatMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
        }
    }, [currentUser.email, addNotification, chatMessages]);

    const handleClearChatMessages = useCallback(async () => {
        const success = await clearChatMessages();
        if (success) {
            setChatMessages([]);
            addNotification({ title: 'Chat Cleared', message: 'The entire chat history has been cleared.', type: 'success' });
        } else {
            addNotification({ title: 'Error', message: 'Failed to clear chat history. Check permissions.', type: 'error' });
        }
    }, [addNotification]);

    useEffect(() => {
        if (!boundsRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDesktopDimensions({ width, height });
            }
        });

        resizeObserver.observe(boundsRef.current);
        const { clientWidth, clientHeight } = boundsRef.current;
        setDesktopDimensions({
            width: clientWidth,
            height: clientHeight,
        });

        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        if (desktopDimensions.width === 0 || desktopDimensions.height === 0) return;

        const breakpointCrossed = wasMobile.current !== isMobile;

        setWindows(prevWindows => {
            let hasChanges = false;
            const newWindows = prevWindows.map(win => {
                let newWin = { ...win };
                let winChanged = false;

                const constrainRect = (r: { x: number; y: number; width: number; height: number; }) => {
                    let { x, y, width, height } = r;
                    const { width: screenW, height: screenH } = desktopDimensions;
                    
                    const taskbarHeight = 60;

                    if (width > screenW) width = screenW;
                    if (height > screenH - taskbarHeight) height = screenH - taskbarHeight;
                    if (x + width > screenW) x = Math.max(0, screenW - width);
                    if (y + height > screenH - taskbarHeight) y = Math.max(0, screenH - height - taskbarHeight);
                    
                    if (x < 0) x = 0;
                    if (y < 0) y = 0;

                    return { x, y, width, height };
                };

                // NEW: Reset all non-start menu windows to a default, centered layout when crossing the mobile/desktop breakpoint.
                if (breakpointCrossed && win.appId !== 'start') {
                    const defaultWidth = Math.min(800, desktopDimensions.width * 0.8);
                    const defaultHeight = Math.min(600, desktopDimensions.height * 0.8);
                    const defaultX = Math.max(0, (desktopDimensions.width - defaultWidth) / 2);
                    const defaultY = Math.max(0, (desktopDimensions.height - defaultHeight) / 2);

                    newWin = { ...newWin, isMaximized: false, preMaximizedState: undefined, width: defaultWidth, height: defaultHeight, x: defaultX, y: defaultY };
                    winChanged = true;
                }
                // Automatically resize and center/anchor the Start Menu window on ANY viewport change
                else if (win.appId === 'start') {
                    const isMobileSize = desktopDimensions.width <= 768;
                    const availableWidth = desktopDimensions.width;
                    const availableHeight = desktopDimensions.height;
                    
                    // Taskbar metrics
                    const taskbarHeight = 60; // Approximate height including padding/border
                    const margin = 16; // Increased margin for safe spacing
                    
                    const targetWidth = isMobileSize ? Math.min(availableWidth * 0.95, 420) : 550;
                    
                    // Default ideal height
                    let targetHeight = isMobileSize ? Math.min(availableHeight * 0.8, 600) : 650;
                    
                    // Center X
                    let targetX = Math.max(0, (availableWidth - targetWidth) / 2);
                    let targetY = Math.max(0, (availableHeight - targetHeight) / 2);
                    
                    // Anchor to taskbar if at bottom
                    if (taskbarPosition === 'bottom') {
                        // Max height available above taskbar with margins
                        const maxAvailableHeight = availableHeight - taskbarHeight - (margin * 2);
                        
                        // Constrain height to fit available space
                        if (targetHeight > maxAvailableHeight) {
                            targetHeight = Math.max(300, maxAvailableHeight);
                        }

                        // Calculate Y position with extra margin to prevent cutoff
                        targetY = availableHeight - targetHeight - taskbarHeight - margin;
                        
                        // Ensure top safety
                        if (targetY < margin) {
                            targetY = margin;
                        }
                    }

                    // Check if a resize/re-center is needed, with a small tolerance
                    if (Math.abs(win.width - targetWidth) > 1 || Math.abs(win.height - targetHeight) > 1 || Math.abs(win.x - targetX) > 1 || Math.abs(win.y - targetY) > 1) {
                         newWin = { ...newWin, isMaximized: false, preMaximizedState: undefined, width: targetWidth, height: targetHeight, x: targetX, y: targetY, zIndex: 10000 }; // Force z-index
                         winChanged = true;
                    }
                } else { // Apply existing constraining logic for all other windows
                    if (!win.isMaximized) {
                        const c = constrainRect({ x: win.x, y: win.y, width: win.width, height: win.height });
                        if (c.x !== win.x || c.y !== win.y || c.width !== win.width || c.height !== win.height) {
                            newWin = { ...newWin, ...c };
                            winChanged = true;
                        }
                    }
    
                    if (win.preMaximizedState) {
                        const c = constrainRect(win.preMaximizedState);
                        if (c.x !== win.preMaximizedState.x || c.y !== win.preMaximizedState.y || c.width !== win.preMaximizedState.width || c.height !== win.preMaximizedState.height) {
                            newWin.preMaximizedState = c;
                            winChanged = true;
                        }
                    }
                }

                if (winChanged) hasChanges = true;
                return newWin;
            });

            return hasChanges ? newWindows : prevWindows;
        });
        
        wasMobile.current = isMobile;

    }, [desktopDimensions, isMobile, taskbarPosition]); // Added taskbarPosition
    
    useEffect(() => {
        if (desktopDimensions.width > 0 && desktopWidgetState === null && !isMobile) {
            const width = 280;
            const height = 120;
            const padding = 20;
            setDesktopWidgetState({
                x: desktopDimensions.width - width - padding,
                y: padding,
                width: width,
                height: height,
            });
        }
        if (desktopDimensions.width > 0 && mobileWidgetState === null && isMobile) {
            const width = Math.min(280, desktopDimensions.width - 20);
            const height = 100;
            const padding = 10;
            const bannerVisible = isPending && isPendingBannerVisible;
            setMobileWidgetState({
                x: desktopDimensions.width - width - padding,
                y: bannerVisible ? 80 : 20,
                width: width,
                height: height,
            });
        }
    }, [desktopDimensions, desktopWidgetState, setDesktopWidgetState, mobileWidgetState, setMobileWidgetState, isMobile, isPending, isPendingBannerVisible]);

    useEffect(() => {
        if (!boundsRef.current || desktopDimensions.height === 0) return;
    
        const desktopAppDefinitions = pinnedAppIds
            .map(id => apps.find(app => app.id === id))
            .filter((app): app is AppDefinition => !!app);
    
        const targetSetter = isMobile ? setMobileIconPositions : setDesktopIconPositions;

        targetSetter(currentPositions => {
            const desktopAppIds = new Set(desktopAppDefinitions.map(app => app.id));
    
            const defaultPositions: Record<string, { x: number; y: number }> = {};
            const iconSize = getIconSizePixels(desktopIconSize);
            const yGap = 8;
            const padding = 16;
            const containerHeight = boundsRef.current!.offsetHeight;
            let xPos = padding;
            let yPos = padding;
    
            desktopAppDefinitions.forEach(app => {
                if (yPos + iconSize + yGap > containerHeight) {
                    yPos = padding;
                    xPos += iconSize + padding;
                }
                defaultPositions[app.id] = { x: xPos, y: yPos };
                yPos += iconSize + yGap;
            });
    
            const finalPositions = { ...defaultPositions, ...currentPositions };
            
            const finalFiltered: Record<string, { x: number; y: number }> = {};
            desktopAppIds.forEach(appId => {
                if (finalPositions[appId]) {
                    finalFiltered[appId] = finalPositions[appId];
                }
            });
    
            if (JSON.stringify(finalFiltered) !== JSON.stringify(currentPositions)) {
                return finalFiltered;
            }
            
            return currentPositions;
        });
    }, [desktopDimensions, desktopIconSize, pinnedAppIds, setMobileIconPositions, setDesktopIconPositions, apps, isMobile]);
    
    
    
    const handleSearch = (query: string) => {
        handleNavigate(`search/${query}`);
    };

    const handleRequestLogout = () => {
        setIsLogoutModalOpen(true);
        const startMenu = windows.find(w => w.appId === 'start');
        if (startMenu) closeWindow(startMenu.id);
    };

    const handleConfirmLogout = () => {
        setIsLogoutModalOpen(false);
        onLogout();
    };

    const handleClosePendingBanner = () => {
        setIsBannerClosing(true);
        setTimeout(() => {
            setIsPendingBannerVisible(false);
        }, 300);
    };
    
    const toggleStartMenu = () => {
        handleNavigate(urlState.appId === 'start' ? '' : 'start');
    };

    const focusWindow = useCallback((id: string) => {
        setWindows(prevWindows => {
            const windowToFocus = prevWindows.find(w => w.id === id);
            if (!windowToFocus) return prevWindows;
            
            const currentTopWindow = prevWindows.filter(w => !w.isMinimized).sort((a, b) => b.zIndex - a.zIndex)[0];
            const currentActiveId = currentTopWindow ? currentTopWindow.id : null;

            if (windowToFocus.id !== currentActiveId || windowToFocus.isMinimized) {
                handleNavigate(windowToFocus.appId);
                return prevWindows;
            } else {
                return prevWindows.map(win => 
                    win.id === id ? { ...win, zIndex: nextZIndex.current++ } : win
                );
            }
        });
    }, [handleNavigate]);

    const minimizeWindow = useCallback((id: string) => {
        setWindows(prevWindows => {
            const windowToMinimize = prevWindows.find(w => w.id === id);
            if (!windowToMinimize) return prevWindows;

            const wasActive = activeWindowId === id;
            if (wasActive) {
                const candidates = prevWindows.filter(w => w.id !== id && !w.isMinimized);
                if (candidates.length > 0) {
                    const nextAppToFocus = candidates.reduce((prev, current) => 
                        (prev.zIndex > current.zIndex) ? prev : current
                    ).appId;
                    handleNavigate(nextAppToFocus);
                } else {
                    handleNavigate('');
                }
            }
            return prevWindows.map(w => w.id === id ? { ...w, isMinimized: true } : w);
        });
    }, [activeWindowId, handleNavigate]);

    const maximizeWindow = useCallback((id: string) => {
        setWindows(prevWindows => {
            const nextZ = Math.max(...prevWindows.map(w => w.zIndex), 0) + 1;
            return prevWindows.map(win => {
                if (win.id === id) {
                    if (win.isMaximized) {
                        return { ...win, isMaximized: false, ...win.preMaximizedState, zIndex: nextZ };
                    } else {
                        const preMaximizedState = { x: win.x, y: win.y, width: win.width, height: win.height };
                        return { ...win, isMaximized: true, preMaximizedState, zIndex: nextZ };
                    }
                }
                return win;
            });
        });
    }, []);
    
    const handleWindowBoundsChange = useCallback((id: string, bounds: { x: number; y: number; width: number; height: number; }) => {
        setWindows(prevWindows => prevWindows.map(win => {
            if (win.id === id) {
                return { ...win, ...bounds, isMaximized: false };
            }
            return win;
        }));
    }, []);

    const handleRefreshWindow = useCallback((id: string) => {
        let windowTitle = '';
        setWindows(wins => wins.map(w => {
            if (w.id === id) { 
                windowTitle = w.title; 
                return { ...w, refreshKey: w.refreshKey + 1 };
            }
            return w;
        }));
        if (windowTitle) addNotification({ title: 'App Refreshed', message: `'${windowTitle}' has been refreshed.`, type: 'info' });
    }, [addNotification]);

    const taskbarApps = useMemo(() => {
        const appsMap = new Map<string, AppDefinition>();
        pinnedAppIds.forEach(id => { const appDef = userApps.find(app => app.id === id); if (appDef) appsMap.set(id, appDef); });
        windows.forEach(win => { if (!appsMap.has(win.appId)) { const appDef = userApps.find(app => app.id === win.appId); if (appDef) appsMap.set(appDef.id, appDef); } });
        return Array.from(appsMap.values());
    }, [pinnedAppIds, windows, userApps]);

    const handleTaskbarAppClick = (appId: string, e: React.MouseEvent<HTMLButtonElement>) => {
        const openWindow = windows.find(win => win.appId === appId && !win.isMinimized);
        if (openWindow) {
             if (openWindow.id === activeWindowId) {
                minimizeWindow(openWindow.id);
            } else {
                handleNavigate(appId);
            }
        } else {
            handleNavigate(appId);
        }
    };
    
    const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    
    const handleNotificationBellClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const appId = 'notifications';
        const openWindow = windows.find(win => win.appId === appId && !win.isMinimized);
        if (openWindow) {
            if (openWindow.id === activeWindowId) {
                closeWindow(openWindow.id);
            } else {
                handleNavigate(appId);
            }
        } else {
            handleNavigate(appId);
        }
    }, [windows, activeWindowId, handleNavigate, closeWindow]);

    const appComponentMap = useMemo(() => {
        const components: Record<string, React.ReactElement> = {};
        const allAppDefinitions = [...baseApps, ...internalApps];

        for (const app of allAppDefinitions) {
            const Component = app.component;
            if (Component) {
                components[app.id] = <Component />;
            }
        }
        return components;
    }, []);

    const pinnedDesktopApps = useMemo(() =>
        pinnedAppIds.map(id => apps.find(app => app.id === id)).filter((app): app is AppDefinition => !!app),
    [pinnedAppIds, apps]);

    if (isSyncingProfile) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900">
                <SpinnerIcon className="w-12 h-12 mb-4" />
                <h1 className="text-xl font-bold">Syncing Profile...</h1>
                <p className="text-sm">Updating your information, please wait.</p>
            </div>
        );
    }

    const { appId: targetAppIdFromUrl } = urlState;
    const targetAppId = targetAppIdFromUrl === 'dashboard' ? 'home' : targetAppIdFromUrl;
    
    if (targetAppId && !apps.find(app => app.id === targetAppId)) {
        return <NotFoundPage />;
    }

    return (
        <div className="h-full w-full overflow-hidden relative text-slate-800 dark:text-slate-200">
            {!isWorkMode && <SleepScreen onWake={() => setIsWorkMode(true)} />}
            
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Confirm Sign Out"
                confirmText="Sign Out"
            >
                <p>Are you sure you want to sign out from your account?</p>
            </ConfirmationModal>

            <div ref={boundsRef} className="h-full w-full relative z-10" onClick={() => setActiveIconId(null)} onMouseDown={(e) => { if (e.target === e.currentTarget) handleNavigate(''); }}>
                {isPending && isPendingBannerVisible && (
                    <div className={`absolute top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full max-w-lg z-[1000] bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm font-semibold p-3 rounded-lg shadow-lg flex items-center gap-3 transition-all duration-300 ease-in-out ${isBannerClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <ClockIcon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-grow text-left">Your account is pending administrator approval. Some features are currently disabled.</span>
                        <button onClick={handleClosePendingBanner} className="p-1 rounded-full text-amber-700/70 dark:text-amber-200/70 hover:bg-amber-200/50 dark:hover:bg-amber-800/50 hover:text-amber-800 dark:hover:text-amber-100 transition-colors flex-shrink-0" aria-label="Close pending approval banner">
                            <XCircleIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                {widgetState && <DesktopWidgets state={widgetState} onStateChange={handleWidgetStateChange} boundsRef={boundsRef} />}
                {pinnedDesktopApps.map(app => (
                    currentIconPositions[app.id] && (
                        <DesktopIcon
                            key={app.id}
                            app={app}
                            onOpen={(id, props, bounds) => openApp(id, props, bounds)}
                            x={currentIconPositions[app.id].x}
                            y={currentIconPositions[app.id].y}
                            onPositionChange={handleIconPositionChange}
                            boundsRef={boundsRef}
                            isSelected={activeIconId === app.id}
                            onSelect={setActiveIconId}
                            size={desktopIconSize}
                        />
                    )
                ))}
                {windows.filter(win => !win.isMinimized).map(win => {
                    const app = apps.find(app => app.id === win.appId);
                    if (!app) return null;

                    const baseComponent = appComponentMap[win.appId];
                    if (!baseComponent) return null;

                    let props: Record<string, any> = {
                        onOpenApp: handleOpenAppFromWindow,
                        onNavigateWithinApp: handleNavigate,
                        user: currentUser,
                        onClose: () => closeWindow(win.id),
                        ...(win.props || {})
                    };

                    if (app.id === 'home') props = { ...props, writeups, isPending };
                    if (app.id === 'settings') props = { ...props, allUsers, setAllUsers, taskbarPosition, setTaskbarPosition, pinnedAppIds, setPinnedAppIds: handleSetPinnedApps, allApps: userApps, desktopIconSize, setDesktopIconSize, onAcceptFriendRequest, onRejectFriendRequest, onRemoveFriend, onSendFriendRequest, onLogout: handleRequestLogout, onProfileUpdate: handleSettingsProfileUpdate, onDeleteAccount, onVerifyPassword, onEmailChange };
                    if (app.id === 'search') props = { ...props, allApps: userApps, allPosts: [...writeups, ...blogPosts], query: (win.props as any)?.deepLinkInfo };
                    if (app.id === 'start') props = { ...props, onSearch: handleSearch, pinnedAppIds, setPinnedAppIds: handleSetPinnedApps, allApps: userApps, onLogout: handleRequestLogout, searchablePosts: [...writeups, ...blogPosts], addNotification, onClose: () => handleNavigate(''), isWorkMode, onToggleWorkMode: () => setIsWorkMode(prev => !prev) }; 
                    if (app.id === 'chat') props = { ...props, messages: chatMessages, onSendMessage: handleSendMessage, onEditMessage: handleEditMessage, onDeleteMessage: handleDeleteMessage, onReaction: handleReaction, allUsers, onClearChat: handleClearChatMessages };
                    if (app.id === 'admin') props = { ...props, allUsers, setAllUsers, user: currentUser, onApproveWriteupAccess, onRejectWriteupAccess, liveUsers };
                    if (app.id === 'writeup') props = { ...props, posts: writeups, onSavePost: handleSaveWriteup, onDeletePost, onLikePost, onAddCommentToPost, onDeleteCommentFromPost, onRequestAccess: onRequestWriteupAccess };
                    if (app.id === 'blog') props = { ...props, posts: blogPosts, onSavePost: handleSaveBlog, onDeletePost, onLikePost, onAddCommentToPost, onDeleteCommentFromPost };
                    if (app.id === 'notes') props = { ...props };
                    if (app.id === 'todolist') props = { ...props };
                    if (app.id === 'resources') props = { ...props };
                    if (app.id === 'docs') props = { ...props };
                    if (app.id === 'copyright') props = { ...props }; // Add Copyright props
                    if (app.id === 'mywork') props = { ...props, writeups, blogPosts, allUsers };
                    if (app.id === 'about') props = { ...props, writeups, blogPosts, allUsers, profileUserEmail: (win.props as any)?.deepLinkInfo };
                    if (app.id === 'kali') props = { ...props };
                    if (app.id === 'consistency') props = { ...props };

                    const childrenWithProps = React.cloneElement(baseComponent, props);
                    
                    return (
                        <Window
                            key={win.id}
                            id={win.id}
                            appId={win.appId}
                            title={win.title}
                            icon={win.icon}
                            x={win.x}
                            y={win.y}
                            width={win.width}
                            height={win.height}
                            zIndex={win.appId === 'start' ? 10000 : win.zIndex}
                            isActive={win.id === activeWindowId}
                            isMaximized={win.isMaximized}
                            accentColor={app.accentColor}
                            onClose={closeWindow}
                            onMinimize={minimizeWindow}
                            onMaximize={maximizeWindow}
                            onFocus={focusWindow}
                            onBoundsChange={handleWindowBoundsChange}
                            onRefresh={handleRefreshWindow}
                            boundsRef={boundsRef}
                            isClosing={win.isClosing}
                            initialBounds={win.initialBounds}
                        >
                           {childrenWithProps}
                        </Window>
                    );
                })}
            </div>
            
            <InstallPWAButton />
            <Taskbar 
                position={taskbarPosition} 
                apps={taskbarApps} 
                openWindows={windows} 
                activeWindowId={activeWindowId} 
                onAppClick={handleTaskbarAppClick} 
                onStartClick={toggleStartMenu} 
                isStartMenuOpen={isStartMenuOpen} 
                startButtonRef={startButtonRef} 
                user={currentUser} 
                onLogout={handleRequestLogout} 
                onOpenSettings={(e) => handleNavigate('settings')} 
                isAnyWindowMaximized={isAnyWindowMaximized}
                allAppsForSearch={userApps} 
                searchablePosts={[...writeups, ...blogPosts]} 
                onSearch={handleSearch} 
                unreadNotificationCount={unreadNotificationCount} 
                onOpenNotifications={handleNotificationBellClick} 
            />
        </div>
    );
};

export default DashboardPage;
