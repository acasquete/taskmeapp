import * as d3 from 'd3';

type CFDData = { date: string; ToDo: number; InProgress: number; Done: number; };

export class CumulativeFlowDiagram {
  private canvas: fabric.Canvas;
  private data: CFDData[];
  private svg: any;

  constructor(canvas: fabric.Canvas) {
    const sample: CFDData[] = [
      { date: '2021-01-01', ToDo: 10, InProgress: 5, Done: 2 },
      { date: '2021-01-02', ToDo: 7, InProgress: 8, Done: 4 },
      { date: '2021-01-03', ToDo: 5, InProgress: 9, Done: 6 },
      { date: '2021-01-04', ToDo: 3, InProgress: 10, Done: 8 },
      { date: '2021-01-05', ToDo: 1, InProgress: 10, Done: 12 },
    ];
    
    this.canvas = canvas;
    this.data = sample;
    this.initializeSVG(); 
    this.draw();
  }

  private initializeSVG(): void {
    const svgElement = document.createElement('svg');

    this.svg = d3.select(svgElement)
                 .attr('width', 600)
                 .attr('height', 400);

    fabric.loadSVGFromString(svgElement.outerHTML, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options);
      this.canvas.add(obj).renderAll();
    });
  }

  private prepareData(): any[] {
    const stack = d3.stack().keys(["ToDo", "InProgress", "Done"]);
    return stack(this.data);
  }

  public draw(): void {
    const data = this.prepareData();
    // Suponiendo que `data` es tu conjunto de datos y ya está preparado para ser utilizado con d3.stack()
const svg = d3.select('body').append('svg')
.attr('width', 600)
.attr('height', 400);

const margin = {top: 20, right: 20, bottom: 30, left: 50},
  width = +svg.attr('width') - margin.left - margin.right,
  height = +svg.attr('height') - margin.top - margin.bottom,
  g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand()
.rangeRound([0, width])
.padding(0.1)
.domain(data.map(d => d.date));

const y = d3.scaleLinear()
.rangeRound([height, 0])
.domain([0, d3.max(data, d => d.total)]);

const z = d3.scaleOrdinal(d3.schemeCategory10); // Ajusta según tus necesidades

// Líneas de cuadrícula para el eje Y
g.append('g')
.attr('class', 'grid')
.call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(''));

// Generador de área
const area = d3.area()
.x(d => x(d.data.date))
.y0(d => y(d[0]))
.y1(d => y(d[1]));

const stack = d3.stack()
.keys(/* tus claves de datos */);

const layer = g.selectAll('.layer')
.data(stack(data))
.enter().append('g')
.attr('class', 'layer');

layer.append('path')
.attr('class', 'area')
.style('fill', (d, i) => z(i))
.attr('d', area);


// Convertir el SVG a string para su carga
const svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));

// Carga el SVG en Fabric.js
fabric.loadSVGFromString(svgString, (objects, options) => {
    const obj = fabric.util.groupSVGElements(objects, options);
    obj.set({ left: 0, top: 0, scaleX: 0.5, scaleY: 0.5 }); // Ajusta según necesidades
    this.canvas.add(obj).renderAll();
});


  }
  
}