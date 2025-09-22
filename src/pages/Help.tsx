import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Search, 
  FileText, 
  Download, 
  ChevronRight, 
  ChevronDown,
  Hash,
  Printer
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useTour, TourStartButton, TourRestartButton } from "@/components/ProductTour";

interface TocItem {
  id: string;
  title: string;
  level: number;
  children: TocItem[];
}

interface Section {
  id: string;
  title: string;
  content: string;
  level: number;
}

const Help = () => {
  const { hasSeenTour, startTour, restartTour } = useTour();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<Section[]>([]);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [helpContent, setHelpContent] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Load help content
  useEffect(() => {
    fetch("/src/content/help.md")
      .then(response => response.text())
      .then(content => {
        setHelpContent(content);
        parseContentSections(content);
      })
      .catch(() => {
        // Fallback content if file can't be loaded
        const fallbackContent = `# Help

Welcome to the Amazon Product Research Playbook help system.

## Getting Started

This tool helps you research and validate Amazon product opportunities.

### Features

- Import data from research tools
- Score opportunities systematically  
- Compare products side-by-side
- Generate sourcing packets

For more detailed information, please refer to the documentation.`;
        setHelpContent(fallbackContent);
        parseContentSections(fallbackContent);
      });
  }, []);

  // Load expanded sections from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("help-expanded-sections");
    if (saved) {
      setExpandedSections(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save expanded sections to localStorage
  useEffect(() => {
    localStorage.setItem("help-expanded-sections", JSON.stringify(Array.from(expandedSections)));
  }, [expandedSections]);

  // Parse markdown content into sections
  const parseContentSections = (content: string) => {
    const lines = content.split('\n');
    const sections: Section[] = [];
    const tocItems: TocItem[] = [];
    
    let currentSection: Section | null = null;
    let currentContent: string[] = [];

    lines.forEach(line => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+\{#(.+?)\})?$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }

        const level = headerMatch[1].length;
        const title = headerMatch[2].trim();
        const customId = headerMatch[3];
        const id = customId || title.toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        currentSection = { id, title, content: '', level };
        currentContent = [];

        // Build TOC
        const tocItem: TocItem = { id, title, level, children: [] };
        if (level === 1) {
          tocItems.push(tocItem);
        } else {
          // Find parent and add as child
          const findParent = (items: TocItem[], targetLevel: number): TocItem | null => {
            for (let i = items.length - 1; i >= 0; i--) {
              if (items[i].level < targetLevel) {
                return items[i];
              }
              const child = findParent(items[i].children, targetLevel);
              if (child) return child;
            }
            return null;
          };
          
          const parent = findParent(tocItems, level);
          if (parent) {
            parent.children.push(tocItem);
          } else {
            tocItems.push(tocItem);
          }
        }
      } else {
        currentContent.push(line);
      }
    });

    // Save final section
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }

    setSections(sections);
    setTocItems(tocItems);
  };

  // Handle section expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Filter sections based on search
  const filteredSections = sections.filter(section =>
    searchQuery === "" ||
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle PDF save
  const handleSavePDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      if (contentRef.current) {
        const canvas = await html2canvas(contentRef.current);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('amazon-research-help.pdf');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  // Render TOC item
  const renderTocItem = (item: TocItem, level = 0) => (
    <div key={item.id} className={cn("", level > 0 && "ml-4")}>
      <button
        onClick={() => scrollToSection(item.id)}
        className={cn(
          "flex items-center gap-2 w-full text-left py-1 px-2 rounded text-sm hover:bg-accent transition-colors",
          activeSection === item.id && "bg-accent text-accent-foreground"
        )}
      >
        <Hash className="h-3 w-3 opacity-50" />
        <span className="truncate">{item.title}</span>
      </button>
      {item.children.map(child => renderTocItem(child, level + 1))}
    </div>
  );

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table of Contents Sidebar */}
        <aside className="lg:w-80 lg:sticky lg:top-24 lg:h-fit">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                <h2 className="font-semibold">Table of Contents</h2>
              </div>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search help topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* TOC Items */}
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {tocItems.map(item => renderTocItem(item))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Actions */}
              <div className="space-y-2">
                {!hasSeenTour ? (
                  <TourStartButton onStart={startTour} />
                ) : (
                  <TourRestartButton onRestart={restartTour} />
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrint}
                  className="w-full justify-start"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSavePDF}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Save as PDF
                </Button>
              </div>

              {searchQuery && (
                <div className="mt-4">
                  <Badge variant="secondary">
                    {filteredSections.length} results
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div 
            ref={contentRef}
            className="prose prose-slate dark:prose-invert max-w-none"
          >
            {filteredSections.map(section => (
              <section 
                key={section.id} 
                id={section.id}
                className="scroll-mt-24"
              >
                {section.level <= 2 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 text-left hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {section.level === 1 ? (
                        <h1 className="text-3xl font-bold m-0">{section.title}</h1>
                      ) : (
                        <h2 className="text-2xl font-semibold m-0">{section.title}</h2>
                      )}
                    </button>
                  </div>
                )}

                {(section.level > 2 || expandedSections.has(section.id)) && (
                  <div className={cn("space-y-4", section.level <= 2 && "ml-6")}>
                    {section.level > 2 && (
                      section.level === 3 ? (
                        <h3 id={section.id} className="text-xl font-semibold scroll-mt-24">
                          {section.title}
                        </h3>
                      ) : section.level === 4 ? (
                        <h4 id={section.id} className="text-lg font-medium scroll-mt-24">
                          {section.title}
                        </h4>
                      ) : (
                        <h5 id={section.id} className="text-base font-medium scroll-mt-24">
                          {section.title}
                        </h5>
                      )
                    )}
                    
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        h1: ({node, ...props}) => null, // Skip h1 as we handle it above
                        h2: ({node, ...props}) => null, // Skip h2 as we handle it above
                        h3: ({node, ...props}) => null, // Skip h3 as we handle it above
                        h4: ({node, ...props}) => null, // Skip h4 as we handle it above
                        h5: ({node, ...props}) => null, // Skip h5 as we handle it above
                        a: ({node, ...props}) => (
                          <a 
                            {...props} 
                            className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                            target={props.href?.startsWith('http') ? '_blank' : undefined}
                            rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          />
                        ),
                        code: ({node, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match;
                          return (
                            <code 
                              className={cn(
                                "relative rounded bg-muted px-1 py-0.5 font-mono text-sm",
                                !isInline && "block p-4 overflow-x-auto"
                              )}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto">
                            <table {...props} className="w-full border-collapse border border-border" />
                          </div>
                        ),
                        th: ({node, ...props}) => (
                          <th {...props} className="border border-border bg-muted p-2 text-left font-semibold" />
                        ),
                        td: ({node, ...props}) => (
                          <td {...props} className="border border-border p-2" />
                        ),
                      }}
                    >
                      {section.content}
                    </ReactMarkdown>
                  </div>
                )}

                {section.level <= 2 && <Separator className="my-8" />}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Help;