# Shared Services

Platform-level shared services that can be used by any app in the Obsidian Platform.

## Files Service

Centralized file management with upload, download, and storage capabilities.

```tsx
import { FileService, useFiles, FileUploadButton } from '@/shared';

// In any component
function MyComponent() {
  const { files, isLoading, deleteFile, downloadFile } = useFiles({
    projectId: 'project-123',
    folder: 'documents'
  });

  return (
    <div>
      <FileUploadButton
        options={{
          organizationId: orgId,
          projectId: 'project-123',
          folder: 'documents'
        }}
        onUploadComplete={() => console.log('Upload done!')}
      />
      
      {files.map(file => (
        <div key={file.id}>
          {file.name}
          <button onClick={() => downloadFile(file.path, file.name)}>
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Stakeholders Service

Manage stakeholders across projects and apps.

```tsx
import { StakeholderService, useStakeholders } from '@/shared';

function StakeholderManager() {
  const { 
    stakeholders, 
    createStakeholder, 
    updateStakeholder,
    deleteStakeholder 
  } = useStakeholders({
    projectId: 'project-123'
  });

  // Create a stakeholder
  const handleCreate = async () => {
    await createStakeholder({
      name: 'John Doe',
      role: 'Project Sponsor',
      influence_level: 'high',
      interest_level: 'high',
      organization_id: orgId
    });
  };

  return <div>{/* Your UI */}</div>;
}
```

## Notifications Service

Real-time notification system with read/unread tracking.

```tsx
import { NotificationService, useNotifications } from '@/shared';

function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  return (
    <div>
      <Badge>{unreadCount}</Badge>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

## Architecture Benefits

1. **Reusability**: Use the same services across all apps
2. **Consistency**: Unified behavior and data access patterns
3. **Maintainability**: Single source of truth for shared functionality
4. **Type Safety**: Shared TypeScript types ensure consistency
5. **Real-time**: Built-in Supabase real-time subscriptions

## Adding New Shared Services

1. Create a new directory under `src/shared/`
2. Define types in `types.ts`
3. Create service class in `[Service]Service.ts`
4. Add React hooks in `hooks/use[Service].tsx`
5. Export everything from `src/shared/index.ts`
