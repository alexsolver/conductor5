import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";

export function Header() {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-end items-center">
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
          </Button>
        </div>
      </div>
    </div>
  );
}
