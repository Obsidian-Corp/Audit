import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download } from "lucide-react";
import { useEngagementDocuments } from "@/hooks/useEngagementDocuments";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ConfirmationTracker } from "@/components/audit-tools/ConfirmationTracker";
import { Separator } from "@/components/ui/separator";

export const EngagementDocumentsTab = ({ engagementId }: { engagementId: string }) => {
  const { documents, isLoading } = useEngagementDocuments(engagementId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Documents</h3>
          <p className="text-sm text-muted-foreground">Engagement documentation</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Upload Document</Button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {documents?.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <CardTitle className="text-base">{doc.document_name}</CardTitle>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  {doc.document_type && <Badge variant="outline">{doc.document_type}</Badge>}
                  <span className="text-muted-foreground">
                    Uploaded {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      {/* Confirmation Tracker - Contextual Tool */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold">Confirmation Tracker</h3>
          <p className="text-sm text-muted-foreground">
            Track external confirmations for bank accounts, A/R, A/P, and other audit procedures (AU-C 505)
          </p>
        </div>
        <ConfirmationTracker engagementId={engagementId} />
      </div>
    </div>
  );
};
