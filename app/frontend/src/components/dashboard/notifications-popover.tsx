'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Bell, AlertTriangle, Shield, WifiOff, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Id } from '../../../convex/_generated/dataModel'

interface Notification {
  _id: Id<'notifications'>
  type: 'cve' | 'risk' | 'offline' | 'info'
  title: string
  message: string
  read: boolean
  createdAt: number
  link?: string
}

export function NotificationsPopover() {
  const notifications = useQuery(api.notifications.getNotifications)
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const [open, setOpen] = useState(false)

  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0

  const handleMarkAsRead = async (id: Id<'notifications'>, e: React.MouseEvent) => {
    e.stopPropagation()
    await markAsRead({ notificationId: id })
  }

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    await markAllAsRead()
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'cve': return <Shield className="h-4 w-4 text-red-500" />
      case 'risk': return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-3 w-3 bg-red-600 rounded-full border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 text-xs text-primary hover:text-primary/80"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-[400px] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((notification: Notification) => (
              <DropdownMenuItem 
                key={notification._id} 
                className={cn(
                  'flex flex-col items-start p-3 cursor-pointer focus:bg-accent border-b last:border-0',
                  !notification.read && 'bg-accent/30'
                )}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full gap-3">
                  <div className="mt-1 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium leading-none', !notification.read && 'font-bold')}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex justify-end items-center gap-2 mt-1">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-[10px] hover:bg-transparent text-primary"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                        >
                          Mark as read
                        </Button>
                      )}
                      {notification.link && (
                        <Button asChild variant="outline" size="sm" className="h-6 px-2 text-[10px]">
                          <Link href={notification.link}>View</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

