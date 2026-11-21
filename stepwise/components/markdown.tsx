import ReactMarkdown, { defaultUrlTransform } from "react-markdown";

/**
 * Renders AI-generated content safely: raw HTML is never rendered, unsafe URL
 * schemes (javascript:, data:) are stripped, and images are not loaded.
 */
export function Md({ children }: { children: string }) {
  return (
    <ReactMarkdown
      skipHtml
      urlTransform={defaultUrlTransform}
      disallowedElements={["img"]}
      unwrapDisallowed
      components={{
        a: ({ href, children: c }) => (
          <a href={href} target="_blank" rel="noopener noreferrer nofollow ugc">
            {c}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
