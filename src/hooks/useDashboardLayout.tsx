import { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

export interface DashboardWidget {
  id: string;
  title: string;
  component: string;
  position: number;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'kpis', title: 'Key Metrics', component: 'DashboardKPIs', position: 0, visible: true, size: 'large' },
  { id: 'tasks', title: 'Task Inbox', component: 'TaskInbox', position: 1, visible: true, size: 'medium' },
  { id: 'audits', title: 'Active Audits', component: 'ActiveAudits', position: 2, visible: true, size: 'medium' },
  { id: 'risks', title: 'Risk Heatmap', component: 'RiskHeatmap', position: 3, visible: true, size: 'small' },
  { id: 'compliance', title: 'Compliance', component: 'ComplianceScorecard', position: 4, visible: true, size: 'small' },
];

export function useDashboardLayout() {
  const { currentOrg } = useOrganization();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load saved layout from localStorage
  useEffect(() => {
    if (!currentOrg) return;
    
    const savedLayout = localStorage.getItem(`dashboard-layout-${currentOrg.id}`);
    if (savedLayout) {
      try {
        setWidgets(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  }, [currentOrg]);

  // Save layout to localStorage
  const saveLayout = (newWidgets: DashboardWidget[]) => {
    if (!currentOrg) return;
    
    setWidgets(newWidgets);
    localStorage.setItem(`dashboard-layout-${currentOrg.id}`, JSON.stringify(newWidgets));
  };

  const reorderWidgets = (startIndex: number, endIndex: number) => {
    const result = Array.from(widgets);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update positions
    const updatedWidgets = result.map((widget, index) => ({
      ...widget,
      position: index,
    }));
    
    saveLayout(updatedWidgets);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
    );
    saveLayout(updatedWidgets);
  };

  const resetLayout = () => {
    saveLayout(defaultWidgets);
  };

  return {
    widgets,
    isCustomizing,
    setIsCustomizing,
    reorderWidgets,
    toggleWidgetVisibility,
    resetLayout,
  };
}
