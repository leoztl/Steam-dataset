const svg = d3.select('svg');
const width = svg.attr("width");
const height = svg.attr("height");
const margin = { top: 60, right: 80, bottom: 60, left: 150 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const mainGroup = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")").attr("id", "mainGroup");
mainGroup.append('g').attr("id", "chart")
mainGroup.append('g').attr("id", "grid")
mainGroup.append('g').attr("id", "tick")
const innerRadius = 180;
const outerRadius = 450;
console.log(outerRadius)

let xscale = d3.scaleBand()
    .range([0, 2 * Math.PI])
    .align(0);

let yscale = d3.scaleRadial()
    .range([innerRadius, outerRadius]);

let color = d3.scaleOrdinal(d3.schemeTableau10);

function replaceSpace(s) {
    return s.replaceAll(" ", "_");
}
d3.csv("sales.csv").then(data => {
    xscale.domain(data.map(function (d) { return d.Year; }));
    console.log(data)
    keys = [];
    labels_gen();
    // create check box
    let current_top = 0;
    let current_left = 0;
    let ceil = 400;
    tag_names = data.columns.slice(1);
    for (let i = 0; i < tag_names.length; i++) {
        var tick = document.createElement('input');
        tick.type = 'checkbox';
        tick.id = 'myCheckbox';
        tick.name = tag_names[i];
        tick.value = tag_names[i];

        var label = document.createElement('label');
        label.for = tag_names[i]
        label.appendChild(document.createTextNode(tag_names[i]));
        var divcheck = document.createElement('div');
        divcheck.id = "nation";

        divcheck.appendChild(tick);
        divcheck.appendChild(label);
        document.getElementById("menu").appendChild(divcheck);

        divcheck.style.position = "absolute";
        divcheck.style.top = current_top + 'px';
        divcheck.style.left = current_left + 'px';
        current_top += 20
        if (current_top > ceil) {
            current_top = 0
            current_left += 200
        }
        tick.addEventListener("click", function () {
            if (keys.includes(this.name)) {
                let idx = keys.indexOf(this.name);
                keys.splice(idx, 1);
            } else {
                keys.push(this.name);
            }
            let stacked = d3.stack().keys(keys)(data);
            console.log(stacked)
            maxi = d3.max(stacked[stacked.length - 1], function (d) {
                return d[1];
            })
            update(stacked, maxi);
            update_grid();

        });
    }
    function getKeyByValue(object, value) {
        for (var prop in object) {
            if (object.hasOwnProperty(prop)) {
                if (+object[prop] === value) {
                    if (keys.includes(prop)) {
                        return prop;
                    }

                }

            }
        }
    }
    let tooltip = d3.select('#container').append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
    function start(event, d) {
        console.log(d);
        let current_data = d.data;
        let current_val = d[1] - d[0];
        let current_name = getKeyByValue(current_data, current_val);
        tooltip.html(current_name+"<br>"+current_val);
        tooltip
            .style("position", "absolute")
            .style("background", color(current_name))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 40) + "px")
            .style("opacity", .9);

    }
    function end(event, d) {

        tooltip.html(d3.select(this).attr("id"))
            .style("opacity", 0);
    }
    function update(stacked, maxi) {
        yscale.domain([0, maxi]);
        mainGroup.select("#chart")
            .selectAll("g")
            .data(stacked)
            .join('g')
            .attr("fill", function (d) { return color(d.key); })
            .selectAll("path")
            .data(function (d) { return d; })
            .join("path")
            .on("mouseover", start)
            .on("mouseout", end)
            .transition().duration(1000)
            .attr("d", d3.arc()
                .innerRadius(function (d) { return yscale(d[0]); })
                .outerRadius(function (d) { return yscale(d[1]); })
                .startAngle(function (d) { return xscale(d.data.Year); })
                .endAngle(function (d) { return xscale(d.data.Year) + xscale.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius));
    }
    function labels_gen() {
        var label = mainGroup.append("g")
            .attr("class", "label")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function (d) { return "rotate(" + ((xscale(d.Year) + xscale.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; });

        label.append("line")
            .attr("x2", -5)
            .attr("stroke", "#000");

        label.append("text")
            .attr("transform", function (d) { return (xscale(d.Year) + xscale.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; })
            .text(function (d) { return d.Year; });

        mainGroup.append("circle")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("r", innerRadius);
    }
    function update_grid() {
        console.log(yscale.ticks(5))
        mainGroup.select("#grid")
            .attr("class", "grid")
            .attr("text-anchor", "middle")
            .selectAll("circle")
            .data(yscale.ticks(5).slice(1))
            .join("circle")
            .attr("class", "grid")
            .attr("fill", "none")
            .transition().duration(1000)
            .attr("r", yscale);
        mainGroup.select("#tick")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(yscale.ticks(5).slice(1))
            .join("text")
            .transition().duration(1000)
            .attr("y", function (d) { return -yscale(d); })
            .attr("x", 0)
            .attr("dy", "8px")
            .text(function (d) { return d; });
    }


})