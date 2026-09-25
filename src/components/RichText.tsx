import { Fragment } from "react";
import { parseRichText } from "../data/richText.ts";
import GlossaryTerm from "./GlossaryTerm.tsx";

interface Props {
  text: string;
}

/** Muuttaa tekstin [[termi]]-merkinnät selitettäviksi sanoiksi. */
export default function RichText({ text }: Props) {
  return parseRichText(text).map((segment, i) =>
    segment.kind === "text" ? (
      <Fragment key={i}>{segment.text}</Fragment>
    ) : (
      <GlossaryTerm key={i} termKey={segment.key} label={segment.label} />
    ),
  );
}
