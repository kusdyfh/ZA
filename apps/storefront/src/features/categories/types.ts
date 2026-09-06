export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
}
