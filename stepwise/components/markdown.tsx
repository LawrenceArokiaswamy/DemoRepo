import ReactMarkdown from "react-markdown";

/** Renders generated content. Raw HTML in the source is not rendered. */
export function Md({ children }: { children: string }) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}
