import * as d3 from 'd3';

interface DataSet {
  dates: string[];
  todo: number[];
  inProgress: number[];
  done: number[];
}

export class CumulativeFlowDiagram {
  private canvas: fabric.Canvas;
  private data: DataSet;
  private svgElement: SVGElement;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.data = {
      date: ['19/1','20/2','21/2','22/2','23/2'],
      todo: [100, 20, 30, 40, 50],
      inProgress: [5, 10, 15, 20, 25],
      done: [2, 4, 6, 8, 10]
    };
  }

  public draw(): void {
    const margin = { top: 50, right: 0, bottom: 0, left: -1200 },
      width = 100 - margin.left - margin.right,
      height = 800;

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    const svg = d3.create("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    x.domain(this.data.dates);
    y.domain([0, d3.max([...this.data.todo, ...this.data.inProgress, ...this.data.done])!]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style("font-size", "1.5rem"); 

    svg.append("g")
      .call(d3.axisLeft(y))
      .style("font-size", "30px"); 

    svg.append("text")
      .attr("x", (width / 2))             
      .attr("y", "-0.5rem")
      .attr("text-anchor", "middle")  
      .style("font-size", "2rem") 
      .style("font-family", "PermanentMarker")
      .text("Cumulative Flow Diagram");

    this.drawArea(svg, this.data.todo, "todo", "steelblue");
    this.drawArea(svg, this.data.inProgress, "inProgress", "orange");
    this.drawArea(svg, this.data.done, "done", "green");

    this.svgElement = svg.node()!;
    this.loadSVG();
  }

  private drawArea(svg: d3.Selection<SVGGElement, unknown, null, undefined>, data: number[], className: string, color: string): void {
    const area = d3.area<number>()
      .x((d, i) => i * (1200 / 5))
      .y0(800)
      .y1(d => 800 - (d*4));

    svg.append("path")
      .data([data])
      .attr("class", className)
      .attr("d", area)
      .attr("fill", color);
  }

  private loadSVG(): void {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(this.svgElement);

    fabric.loadSVGFromString(svgStr, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      obj.id='cfd';
      obj.selectable=false;

      const existingObj = this.canvas.getObjects().find(o => o.id === 'cfd');
      if (existingObj) {
        this.canvas.remove(existingObj);
      }

      this.canvas.add(obj).renderAll();
    });
  }
}