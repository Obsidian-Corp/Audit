import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Template {
  id: string;
  name: string;
  description: string;
  type: string;
  content: string;
}

const templates: Template[] = [
  {
    id: '1',
    name: 'Financial Statement Analysis',
    description: 'Template for analyzing financial statements and key ratios',
    type: 'financial',
    content: `<h2>Financial Statement Analysis</h2>
<h3>Objective</h3>
<p>Analyze the accuracy and completeness of financial statements.</p>
<h3>Procedures</h3>
<ul>
<li>Review balance sheet for accuracy</li>
<li>Verify income statement classifications</li>
<li>Analyze cash flow statement</li>
<li>Calculate and assess key financial ratios</li>
</ul>
<h3>Findings</h3>
<p>[Document findings here]</p>
<h3>Conclusion</h3>
<p>[Document conclusion here]</p>`,
  },
  {
    id: '2',
    name: 'Internal Controls Testing',
    description: 'Template for documenting internal control tests',
    type: 'controls',
    content: `<h2>Internal Controls Testing</h2>
<h3>Control Description</h3>
<p>[Describe the control being tested]</p>
<h3>Test Procedures</h3>
<ol>
<li>Identify control objectives</li>
<li>Select sample transactions</li>
<li>Test control effectiveness</li>
<li>Document exceptions</li>
</ol>
<h3>Sample Selection</h3>
<p>Sample size: [X]<br>Sampling method: [Method]</p>
<h3>Results</h3>
<p>[Document test results]</p>
<h3>Exceptions</h3>
<p>[Document any exceptions found]</p>`,
  },
  {
    id: '3',
    name: 'Revenue Recognition Review',
    description: 'Template for revenue recognition audit procedures',
    type: 'revenue',
    content: `<h2>Revenue Recognition Review</h2>
<h3>Scope</h3>
<p>Review revenue recognition policies and practices for compliance with applicable standards.</p>
<h3>Procedures Performed</h3>
<ul>
<li>Review revenue recognition policy</li>
<li>Test timing of revenue recognition</li>
<li>Verify supporting documentation</li>
<li>Assess collectibility</li>
</ul>
<h3>Sample Details</h3>
<p>[Document sample selection]</p>
<h3>Observations</h3>
<p>[Document observations]</p>`,
  },
  {
    id: '4',
    name: 'IT General Controls',
    description: 'Template for IT general controls assessment',
    type: 'it',
    content: `<h2>IT General Controls Assessment</h2>
<h3>Scope</h3>
<p>Assess IT general controls including access management, change management, and system operations.</p>
<h3>Controls Tested</h3>
<ul>
<li>Access controls and user management</li>
<li>Change management procedures</li>
<li>Backup and recovery</li>
<li>System monitoring</li>
</ul>
<h3>Test Results</h3>
<p>[Document results for each control area]</p>
<h3>Recommendations</h3>
<p>[Document recommendations]</p>`,
  },
  {
    id: '5',
    name: 'Substantive Testing',
    description: 'Template for substantive audit procedures',
    type: 'substantive',
    content: `<h2>Substantive Testing</h2>
<h3>Account/Area</h3>
<p>[Specify account or area being tested]</p>
<h3>Assertion</h3>
<p>[Existence | Completeness | Accuracy | Valuation | Rights/Obligations]</p>
<h3>Procedures</h3>
<ol>
<li>[Procedure 1]</li>
<li>[Procedure 2]</li>
<li>[Procedure 3]</li>
</ol>
<h3>Evidence Obtained</h3>
<p>[Document evidence]</p>
<h3>Conclusion</h3>
<p>[State conclusion on assertion]</p>`,
  },
];

interface WorkpaperTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export function WorkpaperTemplates({ onSelectTemplate }: WorkpaperTemplatesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Workpaper Templates</DialogTitle>
          <DialogDescription>
            Choose a template to get started quickly with pre-formatted structure
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <Card key={template.id} className="border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  {template.name}
                </CardTitle>
                <CardDescription className="text-xs">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectTemplate(template)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
