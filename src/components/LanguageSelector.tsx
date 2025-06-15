
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:text-cyan-400 border-white/20 hover:border-cyan-400/50"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'PT' : 'EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-slate-800/95 backdrop-blur-lg border-slate-600 text-white"
      >
        <DropdownMenuItem 
          onClick={() => setLanguage('pt')}
          className={`cursor-pointer hover:bg-slate-700 ${language === 'pt' ? 'bg-slate-700' : ''}`}
        >
          🇧🇷 Português
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`cursor-pointer hover:bg-slate-700 ${language === 'en' ? 'bg-slate-700' : ''}`}
        >
          🇺🇸 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
