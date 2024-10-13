import React from 'react';
import { Pen } from 'lucide-react';

const SecondaryNavbar = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
      <div className="flex items-center space-x-4">
        <button className="bg-secondary text-secondary-foreground rounded-full px-4 py-2 text-base font-medium">
          SAT (query exam)
        </button>
        <button className="bg-destructive text-destructive-foreground rounded-full px-4 py-2 text-base font-medium">
          Math (query subject)
        </button>
      </div>
      <div className="flex space-x-4">
        <button className="rounded-full p-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
          <Pen className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SecondaryNavbar;