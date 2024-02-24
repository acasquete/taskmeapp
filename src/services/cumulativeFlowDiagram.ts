import * as d3 from 'd3';

interface DataSet {
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
      todo: [100, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      inProgress: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
      done: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
    };
  }

  public draw(): void {
    return;
    const margin = { top: 20, right: 0, bottom: 0, left: -1200 },
      width = 100 - margin.left - margin.right,
      height = 800;

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    const svg = d3.create("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    x.domain(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"]);
    y.domain([0, d3.max([...this.data.todo, ...this.data.inProgress, ...this.data.done])!]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));

    this.drawArea(svg, this.data.todo, "todo", "steelblue");
    this.drawArea(svg, this.data.inProgress, "inProgress", "orange");
    this.drawArea(svg, this.data.done, "done", "green");

    this.svgElement = svg.node()!;
    this.loadSVG();
  }

  private drawArea(svg: d3.Selection<SVGGElement, unknown, null, undefined>, data: number[], className: string, color: string): void {
    const area = d3.area<number>()
      .x((d, i) => i * (1200 / 10))
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
      this.canvas.add(obj).renderAll();
    });
  }
}