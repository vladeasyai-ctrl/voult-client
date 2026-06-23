import type { DemoFolderKind } from '@/lib/demo-node-theme';

export interface HomeLayoutNode {
  id: string;
  labelKey?: string;
  x: number;
  y: number;
  doc?: boolean;
  filename?: string;
  folderKind?: DemoFolderKind;
}

export const HOME_CANVAS_W = 600;
export const HOME_CANVAS_H = 460;

/** Positions are node centers on the home demo canvas. */
export const HOME_LAYOUT: HomeLayoutNode[] = [
  { id: 'home', labelKey: 'demo.home', x: 300, y: 230, folderKind: 'home' },

  { id: 'documents', labelKey: 'demo.documents', x: 300, y: 55, folderKind: 'documents' },
  { id: 'deed', labelKey: 'demo.deed', x: 195, y: 18, doc: true, filename: 'Property_Deed.pdf' },
  { id: 'registration', labelKey: 'demo.registration', x: 405, y: 18, doc: true, filename: 'Registration.pdf' },

  { id: 'warranties', labelKey: 'demo.warranties', x: 72, y: 175, folderKind: 'warranties' },
  { id: 'appliance', labelKey: 'demo.applianceWarranty', x: 18, y: 95, doc: true, filename: 'Washer_Warranty.pdf' },

  { id: 'utilities', labelKey: 'demo.utilities', x: 500, y: 145, folderKind: 'utilities' },
  { id: 'waterBills', labelKey: 'demo.waterBills', x: 548, y: 72, folderKind: 'water' },
  { id: 'waterJan', labelKey: 'demo.waterJan', x: 582, y: 38, doc: true, filename: 'Jan_2025.pdf' },
  { id: 'waterFeb', labelKey: 'demo.waterFeb', x: 582, y: 98, doc: true, filename: 'Feb_2025.pdf' },
  { id: 'waterMar', labelKey: 'demo.waterMar', x: 582, y: 158, doc: true, filename: 'Mar_2025.pdf' },
  { id: 'electricity', labelKey: 'demo.electricity', x: 548, y: 218, folderKind: 'electricity' },
  { id: 'electricBill', labelKey: 'demo.electricBill', x: 582, y: 258, doc: true, filename: 'Mar_Receipt.pdf' },

  { id: 'renovation', labelKey: 'demo.renovation', x: 108, y: 340, folderKind: 'renovation' },
  { id: 'floorPlan', labelKey: 'demo.floorPlan', x: 38, y: 418, doc: true, filename: 'Floor_Plan.pdf' },

  { id: 'insurance', labelKey: 'demo.insurance', x: 355, y: 365, folderKind: 'insurance' },
  { id: 'homePolicy', labelKey: 'demo.homePolicy', x: 445, y: 425, doc: true, filename: 'Home_Policy.pdf' },
];

export function homeNodeCentroid(ids: string[]): { x: number; y: number } {
  const nodes = HOME_LAYOUT.filter((n) => ids.includes(n.id));
  if (!nodes.length) {
    return { x: HOME_CANVAS_W / 2, y: HOME_CANVAS_H / 2 };
  }
  return {
    x: nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length,
    y: nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length,
  };
}
