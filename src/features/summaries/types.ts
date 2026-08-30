/** Un résumé (fiche) déposé dans un cours. */
export interface SummaryItem {
  id: string;
  title: string;
  chapterId: string | null;
  chapterName: string | null;
  authorId: string;
  authorName: string;
  createdAt: string;
  fileName: string;
  /** URL signée (~1 h) vers le fichier. */
  fileUrl: string | null;
  /** L'utilisateur courant peut-il supprimer ce résumé ? */
  canDelete: boolean;
  kind: "image" | "pdf" | "other";
}
