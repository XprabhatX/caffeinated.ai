import { useEffect, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',

    theme: 'base',

    themeVariables: {
        // ─────────────────────────────
        // GLOBAL
        // ─────────────────────────────

        background: '#5E3023',
        textColor: '#F3E9DC',

        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',

        // ─────────────────────────────
        // FLOWCHART
        // ─────────────────────────────

        primaryColor: '#C08552',
        primaryTextColor: '#F3E9DC',
        primaryBorderColor: '#F3E9DC',

        secondaryColor: '#895737',
        secondaryTextColor: '#F3E9DC',
        secondaryBorderColor: '#C08552',

        tertiaryColor: '#C08552',
        tertiaryTextColor: '#F3E9DC',
        tertiaryBorderColor: '#F3E9DC',

        mainBkg: '#C08552',
        nodeBorder: '#F3E9DC',
        nodeTextColor: '#F3E9DC',

        // THIS fixes the invisible connections
        lineColor: '#F3E9DC',
        defaultLinkColor: '#F3E9DC',

        // Text sitting on the diagram surface
        titleColor: '#F3E9DC',

        // Labels sitting on connections
        edgeLabelBackground: '#895737',

        // Notes
        noteBkgColor: '#C08552',
        noteTextColor: '#F3E9DC',
        noteBorderColor: '#F3E9DC',

        // ─────────────────────────────
        // PIE CHART
        // ─────────────────────────────

        pie1: '#C08552',
        pie2: '#895737',
        pie3: '#B67345',
        pie4: '#73402B',
        pie5: '#D0925D',
        pie6: '#9A5F3D',
        pie7: '#C8814F',

        pieTitleTextColor: '#F3E9DC',
        pieSectionTextColor: '#F3E9DC',
        pieLegendTextColor: '#F3E9DC',

        pieTitleTextSize: '25px',
        pieSectionTextSize: '17px',
        pieLegendTextSize: '16px',

        pieStrokeColor: '#F3E9DC',
        pieStrokeWidth: '2px',

        pieOuterStrokeColor: '#F3E9DC',
        pieOuterStrokeWidth: '2px',

        pieOpacity: 1,

        // ─────────────────────────────
        // XY CHART
        // ─────────────────────────────

        xyChart: {
            // IMPORTANT:
            // removes the Cream rectangle
            backgroundColor: '#5E3023',

            titleColor: '#F3E9DC',

            xAxisLabelColor: '#F3E9DC',
            xAxisTitleColor: '#F3E9DC',
            xAxisTickColor: '#F3E9DC',
            xAxisLineColor: '#F3E9DC',

            yAxisLabelColor: '#F3E9DC',
            yAxisTitleColor: '#F3E9DC',
            yAxisTickColor: '#F3E9DC',
            yAxisLineColor: '#F3E9DC',

            // Strongly visible line(s)
            plotColorPalette: '#C08552, #F3E9DC, #D0925D'
        }
    }
});

const MermaidDiagram = ({ chart }) => {
    const [svg, setSvg] = useState('');

    useEffect(() => {
        let cancelled = false;

        const renderDiagram = async () => {
            try {
                const id =
                    `mermaid-${Date.now()}-${Math.random()
                        .toString(36)
                        .slice(2)}`;

                const { svg } = await mermaid.render(id, chart);

                if (!cancelled) {
                    setSvg(svg);
                }
            } catch (error) {
                console.error(
                    'Mermaid rendering failed:',
                    error
                );

                if (!cancelled) {
                    setSvg('');
                }
            }
        };

        renderDiagram();

        return () => {
            cancelled = true;
        };
    }, [chart]);

    if (!svg) {
        return (
            <pre className="my-4 overflow-x-auto rounded-lg bg-[#5E3023] p-4 text-[#F3E9DC]">
                {chart}
            </pre>
        );
    }

    return (
        <div
            className="my-6 flex justify-center overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

export default MermaidDiagram;