import * as d3 from 'd3';

export class CumulativeFlowDiagram {
  private canvas: fabric.Canvas;
  private svgElement: SVGElement;
  private data: Record<string, Record<string, number>>;

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas;
    this.data = {};
  }

  public addOrUpdate(date: string, state: string, value: number): void {
    let stateValue = state.trim().toLocaleLowerCase();

    if (!this.data[date]) {
      this.data[date] = {};
    }
    this.data[date][stateValue] = value;
  }

  public reset () {
    this.data = {};
  }

  public getLast14Days(): Record<string, Record<string, number>> {
    const today = new Date();
    const result: Record<string, Record<string, number>> = {};

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = `${date.getMonth() + 1}/${date.getDate()}`;

      if (this.data[dateString]) {
        result[dateString] = this.data[dateString];
      }
    }

    return result;
  }

  public getDataForD3(state: string): number[] {
    const last14Days = this.getLast14Days();
    const result: number[] = [];

    Object.keys(last14Days).forEach(date => {
      const value = last14Days[date][state] || 0;
      result.push(value);
    });

    return result;
  }

  public getDatesWithDataLast14Days(): string[] {
    const today = new Date();
    const datesWithData: string[] = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = `${date.getMonth() + 1}/${date.getDate()}`;

      if (this.data.hasOwnProperty(dateString)) {
        datesWithData.push(dateString);
      }
    }
    return datesWithData;
  }

  private updateGraph(svg: any) {
    const last14DaysData = this.getLast14Days();
    const stages = this.getUniqueStages(last14DaysData);
    const colors = this.getStageColors();

    console.log(stages);
    console.log('stages ' + stages.length);

    for (let i = 0; i < stages.length; i++) {

      const stage = stages[i];
      const stageDataForD3 = this.getDataForD3(stage);
      console.debug(colors);
      console.debug(colors[i]);
      console.debug(i);
      this.drawArea(svg, stageDataForD3, stage, colors[i]);
    }
  }

  private getStageColors(): string[] {
    return ['#f0e49e', '#e78175', '#00b9d6', '#bcda69', 'purple', 'brown', 'pink', 'gray', 'cyan', 'magenta'];
  }

  private getUniqueStages(data: Record<string, Record<string, number>>): string[] {
    const stages = new Set<string>();
    Object.values(data).forEach(dayData => {
      Object.keys(dayData).forEach(stage => stages.add(stage));
    });
    return Array.from(stages);
  }

  public draw(): void {
     
    const margin = { top: 50, right: 0, bottom: 0, left: -1200 },
      width = 100 - margin.left - margin.right,
      height = 800;

    const x = d3.scaleBand().range([0, width]).padding(0);
    const y = d3.scaleLinear().range([height, 0]);

    const svg = d3.create("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    x.domain(this.getDatesWithDataLast14Days());
    y.domain([0,15]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style("font-size", "1.5rem")
      .selectAll("text")  

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

    
    this.updateGraph(svg);
    this.svgElement = svg.node()!;
    this.loadSVG();
  }

  private drawArea(svg: d3.Selection<SVGGElement, unknown, null, undefined>, data: number[], className: string, color: string): void {
    
    const days = this.getDatesWithDataLast14Days().length;
    
    const area = d3.area<number>()
      .x((d, i) => i * (1300 / days))
      .y0(800)
      .y1(d => 800 - (d * 800 / 15));

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