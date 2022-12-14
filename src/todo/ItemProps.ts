import { NumericLiteral } from "typescript";

export interface ItemProps {
  _id?: string;
  name: string;
  author: string;
  available: boolean;
  publish_date: Date;
  pages: number;
  _failed?: boolean;
  photoBase64: string;
  latitude: number;
  longitude: number;
}
