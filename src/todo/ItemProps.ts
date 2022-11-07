import { NumericLiteral } from "typescript";

export interface ItemProps {
  _id?: string;
  name: string;
  author: string;
  available: boolean;
  publish_date: Date;
  version: number;
  pages: number;
}
