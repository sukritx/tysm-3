import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';

const CustomToast = ({ t, message, icon }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      toast.dismiss(t.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [t.id]);

  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      onClick={() => toast.dismiss(t.id)}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {icon}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomToast;