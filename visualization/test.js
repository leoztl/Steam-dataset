const svg = d3.select('svg');
const width = svg.attr("width");
const height = svg.attr("height");
const margin = { top: 60, right: 30, bottom: 60, left: 150 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const mainGroup = svg.append("g").attr("transform","translate("+margin.left+","+margin.top+")").attr("id","mainGroup");

d3.csv("miserables.json").then(data => {
    //console.log(data);
    data.forEach(function(d){
        //d.Year = d3.timeParse("%Y")(d.Year);
        d.value = +d.GDP_In_Billion_USD;
    })
    console.log(data);
    let xscale = d3.scaleBand().domain(data.map(data=>data.Year)).range([0, innerWidth]).padding(0.1);
    let yscale = d3.scaleLinear().domain([0,d3.max(data,function(d){return d.value;})]).range([innerHeight,0]);
    let xaxis = d3.axisBottom(xscale);
    xaxis.ticks(10);
    let yaxis = d3.axisLeft(yscale);
    mainGroup.append('g').attr("transform","translate(0,"+innerHeight+")").call(xaxis);
    mainGroup.append('g').call(yaxis)
});