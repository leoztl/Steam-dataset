const svg = d3.select('svg');
const width = svg.attr("width");
const height = svg.attr("height");
const margin = { top: 60, right: 80, bottom: 60, left: 150 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const mainGroup = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("id", "mainGroup");

//define scales
let xscale = d3.scaleTime().range([0, innerWidth]),
    yscale = d3.scaleLinear().range([innerHeight, 0]),
    //color scale
    color = d3.scaleOrdinal(d3.schemeTableau10);

//define line generator
let line = d3.line()
    .curve(d3.curveBasis)
    .x(function (d) {
        return xscale(d.Year);
    })
    .y(function (d) {
        return yscale(d.val);
    });
function hasWhiteSpace(s) {
    return s.indexOf(' ') >= 0;
}
d3.csv("rate.csv").then(data => {
    console.log(data)
    data.forEach(function (d) {
        d.Year = d3.timeParse("%Y")(d.Year);
    })
    var tags = data.columns.slice(1).map(function (id) {
        return {
            id: id.replaceAll(" ", "_"),
            values: data.map(function (d) {
                return {
                    Year: d.Year,
                    val: +d[id]

                };
            })
        }
    })
    console.log(tags)
    let tag_id = [];
    for (const i in tags) {
        tag_id.push(tags[i].id);
    }
    //define x axis
    xscale.domain(d3.extent(data, function (d) {
        return d.Year;
    }));
    yscale.domain([
        d3.min(tags, function (c) {
            return d3.min(c.values, function (d) {
                return d.val;
            });
        }),
        d3.max(tags, function (c) {
            return d3.max(c.values, function (d) {
                return d.val;
            });
        })
    ]);
    //define color scale
    color.domain(tags.map(function (c) {
        return tag_id.indexOf(c.id);
    }));
    var yaxis = d3.axisLeft(yscale);
    var xaxis = d3.axisBottom(xscale);
    const xAxisGrid = d3.axisBottom(xscale).tickSize(-innerHeight).tickFormat('');
    const yAxisGrid = d3.axisLeft(yscale).tickSize(-innerWidth).tickFormat('');
    // append x grid
    mainGroup.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0,' + innerHeight + ')')
        .call(xAxisGrid);
    // append y grid
    mainGroup.append('g')
        .attr('class', 'grid')
        .call(yAxisGrid);
    // append xaxis
    mainGroup.append('g')
        .attr("class", "xaxis")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(xaxis)
        .append("text")
        .attr("transform", "translate(" + innerWidth + ",0)")
        .attr("dy", "40")
        .attr("fill", "#000")
        .attr("font-size", "20px")
        .text("Year");
    // append yaxis
    mainGroup.append('g')
        .attr("class", "yaxis")
        .call(yaxis)
        .append("text")
        .attr("dx", "-40")
        .attr("fill", "#000")
        .attr("font-size", "20px")
        .text("Rating");

    let tooltip = d3.select('#container').append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
    function start(event, d) {
        op = d3.select(this).attr('opacity')
        if (op != 0) {
            d3.select(this)
                .attr('opacity', 0.85)
                .attr("stroke-width", 4);
        }
        tooltip.html(d3.select(this).attr("id").slice(5).replaceAll("_", " ") + "<br>" + yscale.invert(event.pageY - margin.top - 8));
        tooltip
            .style("position", "absolute")
            .style("background", color(d3.select(this).attr("id").slice(5)))
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY - 40) + "px")
            .style("opacity", .8);
    }
    function end(event, d) {
        op = d3.select(this).attr('opacity')
        if (op != 0) {
            op = 1
            d3.select(this)
                .attr('opacity', 1)
                .attr("stroke-width", 2);
        }
        tooltip.html(d3.select(this).attr("id"))
            .style("opacity", 0);
    }
    let tag = mainGroup.selectAll(".tag")
        .data(tags)
        .enter()
        .append("g")
        .attr("class", "tag")
    tag.append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke-width", 0)
        .attr('id', function (d) { return 'line-' + d.id })
        .attr("d", function (d) { return line(d.values); })
        .style("stroke", function (d) { return color(d.id); })
        .on('mouseover', start)
        .on('mouseout', end)

    var longY = function (d) { return d.value.Year.length };
    var longE = function (d) { return d.value.Year.length };

    // append country labels to svg
    tag.append("text")
        .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
        .attr("transform", function (d) { return "translate(" + xscale(d.value.Year) + "," + yscale(d.value.val) + ")"; })
        .attr("x", 3)
        .attr('id', function (d) { return 'text-' + d.id })
        .attr("dy", "0.35em")
        .style("font", "11px sans-serif")
        .attr("opacity", 0)
        .text(function (d) { return d.id.replaceAll("_", " "); });

    let current_top = 0
    let current_left = 0
    let ceil = 400
    for (let i = 0; i < tags.length; i++) {
        var tick = document.createElement('input');
        tick.type = 'checkbox';
        tick.id = 'myCheckbox';
        tick.name = tags[i].id;
        tick.value = tags[i].id;

        var label = document.createElement('label');
        label.for = tags[i].id.replaceAll("_", " ")
        label.appendChild(document.createTextNode(tags[i].id.replaceAll("_", " ")));
        var divcheck = document.createElement('div');
        divcheck.id = "nation";
        // tick.appendChild(document.createTextNode(tags[i].id));
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

            var lineSelected = this.value;
            var svgline = d3.select('#line-' + lineSelected);
            var textline = d3.select('#text-' + lineSelected);
            console.log(svgline);
            console.log(textline);

            if (svgline.attr('opacity') === '0') {
                // console.log('making it visible');
                svgline.attr('opacity', 1);
                svgline.attr('stroke-width', 2);
            } else {
                svgline.attr('opacity', 0);
                svgline.attr('stroke-width', 0);
            }

            if (textline.attr('opacity') === '0') {
                // console.log('making it visible');
                textline.attr('opacity', 1);
            } else {
                textline.attr('opacity', 0);
            }
            this.style.background = '#555';
            this.style.color = 'white';

        });
    }
})