import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Download, Upload } from 'lucide-react';
import { EvidenceLibrary } from '@/components/audit-tools/EvidenceLibrary';

interface EngagementEvidenceTabProps {
  engagementId: string;
}

export function EngagementEvidenceTab({ engagementId }: EngagementEvidenceTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Evidence Library</h3>
          <p className="text-sm text-muted-foreground">
            Manage audit evidence and supporting documentation
          </p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </div>

      {/* Evidence Library Component - to be created */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Evidence</CardTitle>
          <CardDescription>
            Supporting documentation collected during fieldwork
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Evidence library will display uploaded documents, images, and supporting materials
            organized by workpaper and procedure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
