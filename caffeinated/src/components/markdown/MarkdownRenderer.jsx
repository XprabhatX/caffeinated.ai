import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import MermaidDiagram from './MermaidDiagram';

const MarkdownRenderer = ({ content }) => {
    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({
                        inline,
                        className,
                        children,
                        ...props
                    }) {
                        const match =
                            /language-(\w+)/.exec(className || '');

                        if (!inline && match?.[1] === 'mermaid') {
                            return (
                                <MermaidDiagram
                                    chart={String(children).trim()}
                                />
                            );
                        }

                        return (
                            <code
                                className={className}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {content || ''}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;