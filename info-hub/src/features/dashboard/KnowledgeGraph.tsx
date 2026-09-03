"use client";

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useContentRepo, useTopicRepo } from '@/data/mock/db';
import { useRouter } from 'next/navigation';
import { Maximize2, Minimize2, Sparkles, Filter, ExternalLink, ArrowRight, X } from 'lucide-react';
import { Button, Badge } from '@/shared/ui/components';
import { TYPE_TRANSLATIONS, STATE_TRANSLATIONS } from '@/shared/utils/translations';
import { ContentType } from '@/shared/types';
import { cn } from '@/shared/utils';

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { getAll: getAllContent } = useContentRepo();
  const { getAll: getAllTopics } = useTopicRepo();
  const router = useRouter();

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('ALL');

  const rawContent = getAllContent();
  const rawTopics = getAllTopics();

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = isExpanded ? 650 : 380;
    
    // Clear previous elements
    d3.select(containerRef.current).selectAll("*").remove();

    // Prepare deeply cloned clean nodes and links (no cyclic mutation leakage)
    const nodes: any[] = [];
    const links: any[] = [];

    // Filter content if chosen
    const filteredContent = filterType === 'ALL' 
      ? rawContent 
      : rawContent.filter(c => c.type === filterType);

    rawTopics.forEach(t => {
      nodes.push({
        id: t.id,
        group: 'topic',
        title: t.name,
        radius: isExpanded ? 28 : 22,
      });
    });

    filteredContent.forEach(c => {
      nodes.push({
        id: c.id,
        group: 'content',
        title: c.title,
        type: c.type,
        state: c.state,
        maturity: c.maturity,
        radius: isExpanded ? 16 : 13,
      });

      if (Array.isArray(c.topicIds)) {
        c.topicIds.forEach(tId => {
          if (rawTopics.some(t => t.id === tId)) {
            links.push({
              source: c.id,
              target: tId,
              value: 1
            });
          }
        });
      }
    });

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    // Add subtle grid background pattern
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "matrix-grid")
      .attr("width", 30)
      .attr("height", 30)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("circle")
      .attr("cx", 2)
      .attr("cy", 2)
      .attr("r", 1)
      .attr("fill", "#e2e8f0");

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#matrix-grid)");

    // Zoom container
    const g = svg.append("g");

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(isExpanded ? 100 : 70))
      .force("charge", d3.forceManyBody().strength(isExpanded ? -240 : -160))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.radius + (isExpanded ? 14 : 8)));

    const link = g.append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,3");

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "cursor-pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Topic nodes (Clean neutral background with subtle border)
    node.filter((d: any) => d.group === 'topic')
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", "#f8fafc")
      .attr("stroke", "#64748b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2");

    // Content nodes with type colors
    node.filter((d: any) => d.group === 'content')
      .append("circle")
      .attr("r", (d: any) => d.radius)
      .attr("fill", (d: any) => {
        if (d.type === 'COURSE') return '#10b981';
        if (d.type === 'ARTICLE') return '#3b82f6';
        if (d.type === 'LESSON') return '#f59e0b';
        return '#8b5cf6';
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2.5);

    // Topic labels inside node
    node.filter((d: any) => d.group === 'topic')
      .append("text")
      .attr("dy", 4)
      .attr("text-anchor", "middle")
      .text((d: any) => d.title.length > 10 ? d.title.substring(0, 9) + '…' : d.title)
      .attr("font-size", isExpanded ? "11px" : "10px")
      .attr("font-weight", "600")
      .attr("fill", "#334155")
      .attr("pointer-events", "none");

    // Click handler -> Selects node for inspection
    node.on("click", (event, d: any) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    node.on("mouseover", function() {
      d3.select(this).select("circle")
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 3.5);
    }).on("mouseout", function(e, d: any) {
      d3.select(this).select("circle")
        .attr("stroke", d.group === 'topic' ? "#64748b" : "#ffffff")
        .attr("stroke-width", d.group === 'topic' ? 2 : 2.5);
    });

    svg.on("click", () => {
      setSelectedNode(null);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [rawContent, rawTopics, isExpanded, filterType]);

  return (
    <div className={cn(
      "w-full bg-white rounded-2xl border border-stone-200 overflow-hidden relative shadow-sm transition-all duration-300",
      isExpanded && "fixed inset-4 z-50 shadow-2xl border-stone-400 bg-[#FCFCFD]"
    )}>
      {/* Matrix Header Controls */}
      <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">Матриця Знань</h3>
            <p className="text-xs text-stone-500">Інтерактивний синтез та зв&apos;язки матеріалів</p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['ALL', 'COURSE', 'ARTICLE', 'LESSON', 'NOTE'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap",
                filterType === t 
                  ? "bg-stone-900 text-white shadow-sm" 
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              )}
            >
              {t === 'ALL' ? 'Всі зв’язки' : TYPE_TRANSLATIONS[t as ContentType] || t}
            </button>
          ))}
        </div>

        {/* Expand / Minimize Toggle */}
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-1.5 text-xs text-stone-700 hover:bg-stone-100"
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Згорнути</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Розгорнути матрицю</span>
            </>
          )}
        </Button>
      </div>

      {/* SVG Canvas Container */}
      <div 
        ref={containerRef} 
        className={cn(
          "w-full cursor-grab active:cursor-grabbing relative",
          isExpanded ? "h-[calc(100%-65px)] min-h-[500px]" : "h-[380px]"
        )} 
      />

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-20 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-4 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                selectedNode.group === 'topic' ? "bg-stone-400" :
                selectedNode.type === 'COURSE' ? "bg-emerald-500" :
                selectedNode.type === 'ARTICLE' ? "bg-blue-500" : "bg-purple-500"
              )} />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                {selectedNode.group === 'topic' ? 'Тема' : TYPE_TRANSLATIONS[selectedNode.type as ContentType] || 'Матеріал'}
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-stone-400 hover:text-stone-700 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <h4 className="font-bold text-stone-900 text-sm mb-2">{selectedNode.title}</h4>
          
          {selectedNode.group === 'content' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Зрілість матеріалу:</span>
                <span className="font-semibold text-emerald-600">{selectedNode.maturity || 0}%</span>
              </div>
              <Button 
                onClick={() => router.push(`/content/${selectedNode.id}`)}
                className="w-full gap-2 text-xs py-2 bg-stone-900 hover:bg-stone-800 text-white"
              >
                <span>Відкрити матеріал</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {selectedNode.group === 'topic' && (
            <p className="text-xs text-stone-500">
              Ця тема об&apos;єднує пов&apos;язані нотатки, статті та навчальні матеріали.
            </p>
          )}
        </div>
      )}

      {/* Legend Footer */}
      <div className="absolute bottom-3 left-4 flex items-center gap-3 text-[10px] font-medium text-stone-500 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full border border-stone-200/60 pointer-events-none">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"/> Курси</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/> Статті</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"/> Нотатки</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-stone-400"/> Теми</div>
      </div>
    </div>
  );
}
