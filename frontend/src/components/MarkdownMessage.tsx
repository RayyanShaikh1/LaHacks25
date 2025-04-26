import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { ComponentPropsWithoutRef } from "react";

interface CodeProps extends ComponentPropsWithoutRef<"code"> {
  inline?: boolean;
}

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content }) => {
  return (
    <div className="markdown-content text-neutral-200">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Style headers
          h1: ({ ...props }) => (
            <h1 className="text-2xl font-bold mb-4 text-neutral-200" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-xl font-bold mb-3 text-neutral-200" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-lg font-bold mb-2 text-neutral-200" {...props} />
          ),

          // Style code blocks and inline code
          code: ({ inline, ...props }: CodeProps) => (
            <code
              className={`${
                inline
                  ? "bg-neutral-700/50 px-1 py-0.5 rounded text-sm"
                  : "block bg-neutral-700/50 p-4 rounded-lg my-2 overflow-x-auto"
              }`}
              {...props}
            />
          ),

          // Style lists
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside mb-4" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside mb-4" {...props} />
          ),

          // Style links
          a: ({ ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Style blockquotes
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-neutral-400/30 pl-4 my-4 italic"
              {...props}
            />
          ),

          // Style paragraphs
          p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
