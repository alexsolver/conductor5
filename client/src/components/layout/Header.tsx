import { Button } from "@/components/ui/button";
import { Bell, Menu, BarChart3, Ticket } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        className="px-4 border-r border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </Button>
          </Link>
          <Link href="/tickets">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <Ticket className="h-5 w-5" />
              <span className="font-medium">Tickets</span>
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center">
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
    </div>
  );
}
