import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { fetchGraphData } from '../services/auditService';
import { GraphNode, GraphLink, GraphData } from '../types/index';
import { ZoomIn, ZoomOut, RefreshCw, Filter, Loader2, Maximize2, Share2 } from 'lucide-react';

interface SimulationNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  index?: number;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  type: string;
}

const GraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GraphData | null>(null);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const graphData = await fetchGraphData();
      setData(graphData);
    } catch (e) {
      console.error("Failed to load graph", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);
    
    // Gradient Definitions for Glowing Nodes
    const defs = svg.append("defs");
    
    // Violet Glow
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "2.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const container = svg.append("g");

    const nodes: SimulationNode[] = data.nodes.map(d => ({ ...d }));
    const links: SimulationLink[] = data.links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<SimulationNode, SimulationLink>(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(60));

    // Arrow marker
    defs.selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 32)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#52525b"); // Zinc-600 arrow

    // Links
    const link = container.append("g")
      .attr("stroke", "#3f3f46") // Zinc-700
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#end)");

    // Node Groups
    const node = container.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, SimulationNode>()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // Node Circles with Glow
    node.append("circle")
      .attr("r", d => d.val + 10)
      .attr("fill", "#09090b") // Black center
      .attr("stroke", d => {
        if (d.group === 1) return "#8b5cf6"; // Violet
        if (d.group === 2) return "#3b82f6"; // Blue
        if (d.group === 3) return "#10b981"; // Emerald
        if (d.group === 4) return "#f43f5e"; // Rose
        return "#71717a";
      })
      .attr("stroke-width", 2)
      .style("filter", "url(#glow)")
      .attr("class", "cursor-pointer transition-all");
    
    // Inner fill for aesthetic
    node.append("circle")
      .attr("r", d => d.val + 4)
      .attr("fill", d => {
        if (d.group === 1) return "rgba(139, 92, 246, 0.2)";
        if (d.group === 2) return "rgba(59, 130, 246, 0.2)";
        if (d.group === 3) return "rgba(16, 185, 129, 0.2)";
        if (d.group === 4) return "rgba(244, 63, 94, 0.2)";
        return "rgba(113, 113, 122, 0.2)";
      })
      .attr("pointer-events", "none");

    // Labels
    node.append("text")
      .text(d => d.label)
      .attr("x", 20)
      .attr("y", 5)
      .attr("font-size", "12px")
      .attr("font-family", "Inter, sans-serif")
      .attr("fill", "#e4e4e7") // Zinc-200
      .attr("font-weight", "500")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.8)"); // readable on dark

    // Link labels
    const linkText = container.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .text(d => d.type)
      .attr("font-size", "8px")
      .attr("font-family", "JetBrains Mono, monospace")
      .attr("fill", "#71717a") // Zinc-500
      .attr("text-anchor", "middle")
      .attr("dy", -4);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as SimulationNode).x!)
        .attr("y1", d => (d.source as SimulationNode).y!)
        .attr("x2", d => (d.target as SimulationNode).x!)
        .attr("y2", d => (d.target as SimulationNode).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);

      linkText
         .attr("x", d => ((d.source as SimulationNode).x! + (d.target as SimulationNode).x!) / 2)
         .attr("y", d => ((d.source as SimulationNode).y! + (d.target as SimulationNode).y!) / 2);
    });

    function dragstarted(event: any, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: SimulationNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: SimulationNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    d3.select(svgRef.current).call(zoom);

  }, [data]);

  return (
    <div className="h-full flex flex-col bg-black relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(#3f3f46 1px, transparent 1px)', 
          backgroundSize: '32px 32px' 
      }}></div>

      {/* Floating HUD Header */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="glass-panel p-4 rounded-xl pointer-events-auto flex items-center gap-4">
           <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center border border-violet-500/30 text-violet-400">
             <Share2 size={20} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-white tracking-tight">本体可视化视图</h2>
             <div className="flex gap-2 text-[10px] text-zinc-400 font-mono uppercase">
               <span>节点数: 84</span>
               <span className="text-zinc-600">|</span>
               <span>关系数: 124</span>
               <span className="text-zinc-600">|</span>
               <span className="text-emerald-500">实时连接</span>
             </div>
           </div>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button className="flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur border border-white/10 text-zinc-300 rounded-lg text-sm hover:bg-white/10 transition-colors">
            <Filter size={16} /> <span className="hidden md:inline">筛选</span>
          </button>
          <button 
            onClick={loadGraphData}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-0 cursor-move">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-500">
             <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-violet-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                </div>
             </div>
             <p className="font-mono text-xs tracking-widest animate-pulse">正在获取图谱数据...</p>
          </div>
        ) : (
          <svg ref={svgRef} className="w-full h-full"></svg>
        )}
        
        {/* HUD Controls Bottom Left */}
        <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
          <button className="p-3 bg-zinc-900/90 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-violet-500/50 transition-all">
            <ZoomIn size={20} />
          </button>
          <button className="p-3 bg-zinc-900/90 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-violet-500/50 transition-all">
             <ZoomOut size={20} />
          </button>
          <button className="p-3 bg-zinc-900/90 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-violet-500/50 transition-all mt-2">
             <Maximize2 size={20} />
          </button>
        </div>

         {/* Legend HUD Bottom Right */}
        <div className="absolute bottom-6 right-6 glass-panel p-4 rounded-xl z-10 w-48">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 border-b border-white/5 pb-2">节点类型</h4>
          <div className="space-y-2">
            {[
              { color: 'bg-violet-500', label: '标准条款' },
              { color: 'bg-blue-500', label: '控制项' },
              { color: 'bg-emerald-500', label: '审计证据' },
              { color: 'bg-rose-500', label: '安全风险' }
            ].map((item) => (
               <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-300">{item.label}</span>
                  <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`}></div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;