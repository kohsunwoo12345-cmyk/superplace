'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface MenuItem {
  id: string;
  href: string;
  icon: any;
  text: string;
}

interface SearchBarProps {
  menuItems: MenuItem[];
  isMobile?: boolean;
}

export default function SearchBar({ menuItems, isMobile = false }: SearchBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 검색 결과 계산
  const results = query.trim() 
    ? menuItems.filter(item => 
        item.text.toLowerCase().includes(query.toLowerCase()) ||
        item.href.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // 검색 아이템 클릭
  const handleItemClick = (href: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(href);
  };

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Enter' && results.length > 0) {
      handleItemClick(results[0].href);
    }
  };

  // 검색창 닫기
  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  // 데스크톱 검색
  if (!isMobile) {
    return (
      <div className="hidden md:block relative flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="메뉴 검색... (예: 학생, 출석, 설정)"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-xl hover:bg-gray-50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
          />
        </div>
        
        {/* 검색 결과 드롭다운 */}
        {isOpen && query && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={closeSearch}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto z-50">
              {results.length > 0 ? (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {results.length}개 결과
                  </div>
                  {results.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.href)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all group text-left"
                      >
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 group-hover:text-blue-900">
                            {item.text}
                          </div>
                          <div className="text-xs text-gray-500">{item.href}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">검색 결과가 없습니다</p>
                  <p className="text-xs text-gray-400 mt-1">다른 키워드로 검색해보세요</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // 모바일 검색
  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Search className="w-5 h-5 text-gray-600" />
      </button>

      {/* 모바일 전체화면 오버레이 */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={closeSearch}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메뉴 검색..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
            {query ? (
              results.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {results.length}개 결과
                  </div>
                  <div className="space-y-2">
                    {results.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.href)}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all group text-left"
                        >
                          <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-900">
                              {item.text}
                            </div>
                            <div className="text-xs text-gray-500">{item.href}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">검색 결과가 없습니다</p>
                  <p className="text-sm text-gray-400 mt-1">다른 키워드로 검색해보세요</p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">메뉴를 검색해보세요</p>
                <p className="text-sm text-gray-400 mt-1">예: 학생, 출석, 설정</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
