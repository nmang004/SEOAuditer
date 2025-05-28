'use client';

import { useState, useCallback } from 'react';
import { useNotification } from '@/components/notifications/notification-provider';
import { useCommandPalette } from '@/components/command-palette';
import { AdvancedDataTable } from '@/components/data/advanced-data-table';
import { useNotify } from '@/components/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

type Status = 'todo' | 'in-progress' | 'done';

interface Task {
  id: string;
  title: string;
  status: Status;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  dueDate: string;
}

const statuses = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const priorities = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const tasks: Task[] = [
  {
    id: '1',
    title: 'Implement authentication',
    status: 'done',
    priority: 'high',
    assignee: 'John Doe',
    dueDate: '2023-06-15',
  },
  {
    id: '2',
    title: 'Design dashboard layout',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Jane Smith',
    dueDate: '2023-06-20',
  },
  {
    id: '3',
    title: 'Set up database schema',
    status: 'todo',
    priority: 'medium',
    assignee: 'Mike Johnson',
    dueDate: '2023-06-25',
  },
  {
    id: '4',
    title: 'Write API documentation',
    status: 'todo',
    priority: 'low',
    assignee: 'Sarah Williams',
    dueDate: '2023-06-30',
  },
];

export default function ComponentsDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const notify = useNotify();

  // Command palette commands
  const commands = [
    {
      id: 'new-task',
      label: 'Create New Task',
      group: 'Tasks',
      shortcut: '⌘N',
      onSelect: () => {
        notify.success('New Task', 'Create a new task');
      },
    },
    {
      id: 'search-tasks',
      label: 'Search Tasks',
      group: 'Tasks',
      shortcut: '⌘K',
      onSelect: () => {
        const searchInput = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
        searchInput?.focus();
      },
    },
    {
      id: 'open-settings',
      label: 'Open Settings',
      group: 'Application',
      shortcut: '⌘,',
      onSelect: () => {
        notify.info('Settings', 'Opening application settings');
      },
    },
  ];

  const { CommandPalette, openCommandPalette } = useCommandPalette({ commands });

  // Table columns
  const columns = [
    {
      id: 'select',
      header: ({ table }: any) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: any) => (
        <div className="font-medium">{row.getValue('title')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status') as Status;
        return (
          <Badge
            variant={status === 'done' ? 'success' : status === 'in-progress' ? 'warning' : 'outline'}
            className="capitalize"
          >
            {statuses[status]}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: any) => {
        const priority = row.getValue('priority') as 'low' | 'medium' | 'high';
        return (
          <div className="capitalize">
            <span
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
            />
            {priorities[priority]}
          </div>
        );
      },
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }: any) => {
        const date = new Date(row.getValue('dueDate'));
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
  ];

  // Filter tasks based on search term
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.priority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle row selection
  const handleRowSelection = useCallback(
    (rows: Task[]) => {
      if (rows.length > 0) {
        notify.info(
          'Tasks Selected',
          `You have selected ${rows.length} task(s)`,
          {
            action: {
              label: 'View Selected',
              onClick: () => {
                // Handle view selected action
                console.log('Selected rows:', rows);
              },
            },
          }
        );
      }
    },
    [notify]
  );

  // Handle row click
  const handleRowClick = useCallback(
    (row: Task) => {
      notify.info('Task Selected', `You clicked on: ${row.title}`);
    },
    [notify]
  );

  // Show different notification types
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const notifications = {
      success: () =>
        notify.success('Success', 'Your action was completed successfully!'),
      error: () =>
        notify.error('Error', 'Something went wrong. Please try again.'),
      warning: () =>
        notify.warning('Warning', 'This action cannot be undone.'),
      info: () =>
        notify.info('Info', 'Here is some information you might find useful.'),
    };

    notifications[type]();
  };

  const { updateNotification } = useNotification();

  // Show progress notification
  const showProgressNotification = () => {
    const id = notify.default('Uploading File', 'Starting upload...', {
      progress: 0,
    });

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        clearInterval(interval);
        updateNotification(id, {
          title: 'Upload Complete',
          description: 'Your file has been uploaded successfully!',
          type: 'success',
        });
      } else {
        updateNotification(id, {
          progress,
          description: `Uploading... ${progress}%`,
        });
      }
    }, 200);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Components Demo</h1>
          <p className="text-muted-foreground">
            Interactive demo of the new components
          </p>
        </div>
        <Button onClick={openCommandPalette} variant="outline">
          Open Command Palette (⌘K)
        </Button>
      </div>

      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Data Table</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="commands">Command Palette</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Data Table</CardTitle>
              <CardDescription>
                Interactive table with sorting, filtering, and row selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 max-w-sm">
                  <Label htmlFor="search" className="sr-only">
                    Search
                  </Label>
                  <Input
                    id="search"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                  <Button size="sm">Create Task</Button>
                </div>
              </div>
              <AdvancedDataTable
                columns={columns}
                data={filteredTasks}
                enableRowSelection
                onRowSelectionChange={handleRowSelection}
                onRowClick={handleRowClick}
                className="border rounded-md"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification System</CardTitle>
              <CardDescription>
                Show different types of notifications with actions and progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="success"
                  onClick={() => showNotification('success')}
                >
                  Show Success
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => showNotification('error')}
                >
                  Show Error
                </Button>
                <Button
                  variant="warning"
                  onClick={() => showNotification('warning')}
                >
                  Show Warning
                </Button>
                <Button
                  variant="outline"
                  onClick={() => showNotification('info')}
                >
                  Show Info
                </Button>
              </div>
              <div className="pt-4">
                <Button onClick={showProgressNotification}>
                  Show Progress Notification
                </Button>
              </div>
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Notification with Action</h3>
                <Button
                  variant="outline"
                  onClick={() =>
                    notify.info(
                      'New Update Available',
                      'A new version of the app is available. Would you like to update now?',
                      {
                        action: {
                          label: 'Update Now',
                          onClick: () => {
                            // Handle update action
                            notify.success('Updating...', 'Your app is being updated');
                          },
                        },
                      }
                    )
                  }
                >
                  Show Action Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Command Palette</CardTitle>
              <CardDescription>
                Press ⌘K or click the button in the header to open the command
                palette
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  The command palette provides quick access to common actions and
                  navigation. Try these commands:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      ⌘K
                    </code>{' '}
                    - Open command palette
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      ⌘N
                    </code>{' '}
                    - Create new task
                  </li>
                  <li>
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      ⌘,
                    </code>{' '}
                    - Open settings
                  </li>
                </ul>
                <div className="pt-4">
                  <Button onClick={openCommandPalette}>
                    Open Command Palette
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CommandPalette />
    </div>
  );
}
