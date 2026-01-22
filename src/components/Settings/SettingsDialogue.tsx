import { Dialog, DialogPanel } from '@headlessui/react';
import {
  ArrowLeft,
  BrainCog,
  ChevronLeft,
  ExternalLink,
  Search,
  Sliders,
  ToggleRight,
  LogOut,
  User,
} from 'lucide-react';
import Preferences from './Sections/Preferences';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Loader from '../ui/Loader';
import { cn } from '@/lib/utils';
import Models from './Sections/Models/Section';
import SearchSection from './Sections/Search';
import Select from '@/components/ui/Select';
import Personalization from './Sections/Personalization';
import { useAuth } from '@/lib/hooks/useAuth';

const sections = [
  {
    key: 'preferences',
    name: 'Preferences',
    description: 'Customize your application preferences.',
    icon: Sliders,
    component: Preferences,
    dataAdd: 'preferences',
    requiresAdmin: false, // 公开配置
  },
  {
    key: 'personalization',
    name: 'Personalization',
    description: 'Customize the behavior and tone of the model.',
    icon: ToggleRight,
    component: Personalization,
    dataAdd: 'personalization',
    requiresAdmin: false, // 公开配置
  },
  {
    key: 'models',
    name: 'Models',
    description: 'Connect to AI services and manage connections.',
    icon: BrainCog,
    component: Models,
    dataAdd: 'modelProviders',
    requiresAdmin: true, // 需要管理员权限
  },
  {
    key: 'search',
    name: 'Search',
    description: 'Manage search settings.',
    icon: Search,
    component: SearchSection,
    dataAdd: 'search',
    requiresAdmin: true, // 需要管理员权限
  },
];

const SettingsDialogue = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (active: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>(sections[0].key);
  const [selectedSection, setSelectedSection] = useState(sections[0]);

  // 用户认证
  const { user, isAdmin, logout, getToken } = useAuth();

  // 根据管理员状态过滤sections
  const visibleSections = sections.filter(
    (section) => !section.requiresAdmin || isAdmin
  );

  useEffect(() => {
    setSelectedSection(sections.find((s) => s.key === activeSection)!);
  }, [activeSection]);

  useEffect(() => {
    if (isOpen) {
      const fetchConfig = async () => {
        try {
          const token = getToken();
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };

          // 如果有管理员token，添加到请求头
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const res = await fetch('/api/config', {
            method: 'GET',
            headers,
          });

          const data = await res.json();

          setConfig(data);
        } catch (error) {
          console.error('Error fetching config:', error);
          toast.error('Failed to load configuration.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchConfig();
    }
  }, [isOpen, isAdmin, getToken]);

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/30 backdrop-blur-sm h-screen"
      >
        <DialogPanel className="space-y-4 border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary backdrop-blur-lg rounded-xl h-[calc(100vh-2%)] w-[calc(100vw-2%)] md:h-[calc(100vh-7%)] md:w-[calc(100vw-7%)] lg:h-[calc(100vh-20%)] lg:w-[calc(100vw-30%)] overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center h-full w-full">
              <Loader />
            </div>
          ) : (
            <div className="flex flex-1 inset-0 h-full overflow-hidden">
              <div className="hidden lg:flex flex-col justify-between w-[240px] border-r border-white-200 dark:border-dark-200 h-full px-3 pt-3 overflow-y-auto">
                <div className="flex flex-col">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-row items-center hover:bg-light-200 hover:dark:bg-dark-200 p-2 rounded-lg"
                  >
                    <ChevronLeft
                      size={18}
                      className="text-black/50 dark:text-white/50 group-hover:text-black/70 group-hover:dark:text-white/70"
                    />
                    <p className="text-black/50 dark:text-white/50 group-hover:text-black/70 group-hover:dark:text-white/70 text-[14px]">
                      Back
                    </p>
                  </button>

                  <div className="flex flex-col items-start space-y-1 mt-8">
                    {sections.map((section) => (
                      <button
                        key={section.dataAdd}
                        className={cn(
                          `flex flex-row items-center space-x-2 px-2 py-1.5 rounded-lg w-full text-sm hover:bg-light-200 hover:dark:bg-dark-200 transition duration-200 active:scale-95`,
                          activeSection === section.key
                            ? 'bg-light-200 dark:bg-dark-200 text-black/90 dark:text-white/90'
                            : ' text-black/70 dark:text-white/70',
                        )}
                        onClick={() => setActiveSection(section.key)}
                      >
                        <section.icon size={17} />
                        <p>{section.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col space-y-1 py-[18px] px-2">
                  <p className="text-xs text-black/70 dark:text-white/70">
                    Version: {process.env.NEXT_PUBLIC_VERSION}
                  </p>
                  <a
                    href="https://github.com/itzcrazykns/perplexica"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-black/70 dark:text-white/70 flex flex-row space-x-1 items-center transition duration-200 hover:text-black/90 hover:dark:text-white/90"
                  >
                    <span>GitHub</span>
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* 用户信息区 */}
                <div className="mt-auto pt-4 border-t border-light-200 dark:border-dark-200">
                  {user && (
                    <div className="space-y-3 pb-2">
                      {/* 用户信息 */}
                      <div className="flex items-center gap-2 px-2">
                        <div className="w-8 h-8 rounded-full bg-light-200 dark:bg-dark-200 flex items-center justify-center">
                          <User size={16} className="text-black/60 dark:text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-black/80 dark:text-white/80 truncate">
                            {user.name || user.email}
                          </p>
                          <p className="text-[10px] text-black/50 dark:text-white/50 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* 管理员标识 */}
                      {isAdmin && (
                        <div className="px-2 py-1 mx-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium text-center">
                            Administrator
                          </p>
                        </div>
                      )}
                      
                      {/* 登出按钮 */}
                      <button
                        onClick={() => {
                          logout();
                          toast.success('Logged out successfully');
                        }}
                        className="flex flex-row items-center space-x-2 px-2 py-1.5 rounded-lg w-full text-xs hover:bg-red-50 hover:dark:bg-red-900/20 transition duration-200 text-red-600 dark:text-red-400"
                      >
                        <LogOut size={16} />
                        <p>Logout</p>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full flex flex-col overflow-hidden">
                <div className="flex flex-row lg:hidden w-full justify-between px-[20px] my-4 flex-shrink-0">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="group flex flex-row items-center hover:bg-light-200 hover:dark:bg-dark-200 rounded-lg mr-[40%]"
                  >
                    <ArrowLeft
                      size={18}
                      className="text-black/50 dark:text-white/50 group-hover:text-black/70 group-hover:dark:text-white/70"
                    />
                  </button>
                  <Select
                    options={visibleSections.map((section) => {
                      return {
                        value: section.key,
                        key: section.key,
                        label: section.name,
                      };
                    })}
                    value={activeSection}
                    onChange={(e) => {
                      setActiveSection(e.target.value);
                    }}
                    className="!text-xs lg:!text-sm"
                  />
                </div>
                {selectedSection.component && (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="border-b border-light-200/60 px-6 pb-6 lg:pt-6 dark:border-dark-200/60 flex-shrink-0">
                      <div className="flex flex-col">
                        <h4 className="font-medium text-black dark:text-white text-sm lg:text-sm">
                          {selectedSection.name}
                        </h4>
                        <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
                          {selectedSection.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <selectedSection.component
                        fields={config.fields[selectedSection.dataAdd]}
                        values={config.values[selectedSection.dataAdd]}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogPanel>
      </motion.div>
    </Dialog>
  );
};

export default SettingsDialogue;
